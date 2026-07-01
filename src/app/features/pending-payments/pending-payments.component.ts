import { Component, AfterViewInit, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RowActionsComponent } from '../../shared/components/row-actions/row-actions.component';
import { PeriodExpensesService } from '../../core/services/period-expenses.service';
import { DebtsService } from '../../core/services/debts.service';
import { FriendsService } from '../../core/services/friends.service';
import { AuthService } from '../../core/services/auth.service';
import { PurchasesService } from '../../core/services/purchases.service';
import { CategoryDto } from '../../core/models';
import { PeriodExpenseDto, RegisterPeriodExpensePaymentDto } from '../../core/models/period-expense.model';
import { DebtDto, CreateDebtDto, SubmitPaymentDto } from '../../core/models/debt.model';
import { FriendDto } from '../../core/models/friend.model';
import { UpcomingInstallmentDto } from '../../core/models/purchase.model';
import { CategoriesService } from '../../core/services/categories.service';
import { formatDisplayedAmount } from '../../shared/utils/amount-display.util';

@Component({
  selector: 'app-register-pending-payment-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Registrar pago</h2>
    <mat-dialog-content>
      <p class="dialog-subtitle">{{ data.description }} · Gs. {{ formatAmount(data.amount) }}</p>
      <form class="dialog-form" [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label>Nro. de comprobante
            <input formControlName="receiptNumber" maxlength="100" autocomplete="off" />
          </label>
        </div>
        <div class="field">
          <label>Fecha de pago
            <input type="datetime-local" formControlName="paidAt" />
          </label>
        </div>
        <div class="field">
          <label>Descripción del pago
            <textarea formControlName="paymentDescription" maxlength="500" rows="3"></textarea>
          </label>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button class="btn-primary" type="button" (click)="submit()" [disabled]="form.invalid">Registrar pago</button>
    </mat-dialog-actions>
  `
})
export class RegisterPendingPaymentDialogComponent {
  formatAmount(amount: number): string { return formatDisplayedAmount(amount); }
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<RegisterPendingPaymentDialogComponent>);
  readonly data = inject<{ description: string; amount: number }>(MAT_DIALOG_DATA);

  form = this.fb.group({
    receiptNumber:      ['', [Validators.required, Validators.maxLength(100)]],
    paidAt:             [this.toDateTimeLocal(new Date()), [Validators.required]],
    paymentDescription: ['', [Validators.maxLength(500)]]
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.getRawValue());
  }

  private toDateTimeLocal(date: Date): string {
    const pad = (v: number) => v.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

@Component({
  selector: 'app-reject-debt-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Rechazar pago</h2>
    <mat-dialog-content>
      <p class="dialog-subtitle">{{ data.description }} · Gs. {{ formatAmount(data.amount) }}</p>
      <form class="dialog-form" [formGroup]="form">
        <div class="field">
          <label>Motivo del rechazo (opcional)
            <textarea formControlName="rejectionReason" maxlength="300" rows="3" placeholder="Ej: comprobante incorrecto, monto no coincide..."></textarea>
          </label>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="warn" type="button" (click)="submit()">Rechazar</button>
    </mat-dialog-actions>
  `
})
export class RejectDebtDialogComponent {
  formatAmount(amount: number): string { return formatDisplayedAmount(amount); }
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<RejectDebtDialogComponent>);
  readonly data = inject<{ description: string; amount: number }>(MAT_DIALOG_DATA);

  form = this.fb.group({
    rejectionReason: ['', [Validators.maxLength(300)]]
  });

  submit(): void {
    this.dialogRef.close(this.form.getRawValue());
  }
}

@Component({
  selector: 'app-create-debt-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule, AppSelectComponent],
  styles: [`
    .dialog-form {
      gap: 8px;
    }

    .field > label {
      gap: 2px;
      font-size: 10px;
    }

    .field > label > input {
      min-height: 28px;
      height: 28px;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 11.5px;
      line-height: 1.1;
      box-sizing: border-box;
    }

    .field > label > input[type='date'] {
      padding-right: 34px;
      appearance: none;
      -webkit-appearance: none;
    }

    .field > label > app-select {
      display: block;
      width: 100%;
    }

    mat-dialog-actions {
      min-height: 40px !important;
      padding-top: 4px !important;
    }

    mat-dialog-actions button[mat-button],
    mat-dialog-actions button[mat-flat-button] {
      min-height: 28px !important;
      height: 28px !important;
      padding: 0 10px !important;
      font-size: 11.5px !important;
      line-height: 1 !important;
    }
  `],
  template: `
    <h2 mat-dialog-title>Nueva Deuda</h2>
    <mat-dialog-content>
      @if (loadingFriends()) {
        <div style="display:flex;justify-content:center;padding:24px"><mat-spinner diameter="32" /></div>
      } @else {
        <form class="dialog-form" [formGroup]="form">
          <div class="field">
            <label>Deudor (amigo)
              <app-select
                formControlName="debtorUserId"
                [items]="friends"
                valueKey="friendUserId"
                labelKey="friendName"
                nullLabel="Seleccionar amigo...">
              </app-select>
            </label>
          </div>
          <div class="field">
            <label>Monto (Gs.)
              <input type="number" formControlName="amount" min="1" inputmode="numeric" />
            </label>
          </div>
          <div class="field">
            <label>Descripción
              <input formControlName="description" maxlength="200" autocomplete="off" />
            </label>
          </div>
          <div class="field">
            <label>Fecha
              <input type="date" formControlName="date" />
            </label>
          </div>
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button class="btn-primary" type="button" (click)="submit()"
              [disabled]="form.invalid || loadingFriends()">
        Crear deuda
      </button>
    </mat-dialog-actions>
  `
})
export class CreateDebtDialogComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly friendsService = inject(FriendsService);
  readonly dialogRef = inject(MatDialogRef<CreateDebtDialogComponent>);
  readonly data      = inject<{ creditorUserId: string }>(MAT_DIALOG_DATA);

  loadingFriends = signal(true);
  friends: FriendDto[] = [];

  form = this.fb.group({
    debtorUserId: ['', Validators.required],
    amount:       [null as number | null, [Validators.required, Validators.min(1)]],
    description:  ['', [Validators.required, Validators.maxLength(200)]],
    date:         [new Date().toISOString().slice(0, 10), Validators.required]
  });

  ngOnInit(): void {
    this.friendsService.getMyFriends().subscribe({
      next: f => { this.friends = f; this.loadingFriends.set(false); },
      error: () => this.loadingFriends.set(false)
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const dto: CreateDebtDto = {
      creditorUserId: this.data.creditorUserId,
      debtorUserId:   v.debtorUserId!,
      amount:         v.amount!,
      description:    v.description!,
      date:           v.date!
    };
    this.dialogRef.close(dto);
  }
}

@Component({
  selector: 'app-pending-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    AppSelectComponent,
    PageHeaderComponent,
    RowActionsComponent
  ],
  templateUrl: './pending-payments.component.html',
  styleUrl: './pending-payments.component.scss'
})
export class PendingPaymentsComponent implements OnInit, AfterViewInit {
  private readonly periodExpensesService = inject(PeriodExpensesService);
  private readonly debtsService          = inject(DebtsService);
  private readonly categoriesService     = inject(CategoriesService);
  private readonly purchasesService      = inject(PurchasesService);
  private readonly auth                  = inject(AuthService);
  private readonly dialog                = inject(MatDialog);
  private readonly snackBar              = inject(MatSnackBar);

  @ViewChild('periodPaginator')   paginator!: MatPaginator;
  @ViewChild('debtPaginator')     debtPaginator!: MatPaginator;
  @ViewChild('purchasePaginator') purchasePaginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns  = ['description', 'categoryName', 'amount', 'period', 'actions'];
  debtColumns       = ['debtCounterpart', 'debtDescription', 'debtAmount', 'debtDate', 'debtStatus', 'debtActions'];
  purchaseColumns   = ['purchaseName', 'purchaseInstallment', 'purchaseDueDate', 'purchaseAmount', 'purchaseStatus', 'purchaseActions'];

  loading         = signal(false);
  loadingDebts    = signal(false);
  loadingPurchases = signal(false);

  pageMode  = 'period';
  pageModes = [
    { value: 'period',    label: 'Gastos del período' },
    { value: 'debts',     label: 'Deudas con amigos' },
    { value: 'purchases', label: 'Cuotas de compras' }
  ];

  allPeriods        = false;
  statusFilter      = '';
  counterpartFilter = '';
  filterYear        = new Date().getFullYear();
  filterMonth       = new Date().getMonth() + 1;

  counterpartOptions: { value: string; label: string }[] = [{ value: '', label: 'Todos' }];
  private allDebtsRaw: DebtDto[] = [];

  dataSource          = new MatTableDataSource<PeriodExpenseDto>([]);
  debtDataSource      = new MatTableDataSource<DebtDto>([]);
  purchaseDataSource  = new MatTableDataSource<UpcomingInstallmentDto>([]);
  categories: CategoryDto[] = [];

  years  = [2023, 2024, 2025, 2026, 2027].map(y => ({ value: y, label: y.toString() }));
  months = [
    { value: 1,  label: 'Enero' },   { value: 2,  label: 'Febrero' },  { value: 3,  label: 'Marzo' },
    { value: 4,  label: 'Abril' },   { value: 5,  label: 'Mayo' },     { value: 6,  label: 'Junio' },
    { value: 7,  label: 'Julio' },   { value: 8,  label: 'Agosto' },   { value: 9,  label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  statusOptions = [
    { value: '',                     label: 'Todos' },
    { value: 'Pending',              label: 'Pendiente' },
    { value: 'Accepted',             label: 'Aceptado' },
    { value: 'AwaitingConfirmation', label: 'Esperando confirmación' },
    { value: 'Paid',                 label: 'Pagado' },
    { value: 'Rejected',             label: 'Rechazado' }
  ];

  get periodTotal(): number    { return this.dataSource.data.reduce((s, r) => s + r.amount, 0); }
  get debtTotal(): number      { return this.debtDataSource.data.reduce((s, r) => s + r.amount, 0); }
  get purchasePendingTotal(): number { return this.purchaseDataSource.data.filter(r => !r.isPaid).reduce((s, r) => s + r.amount, 0); }
  get currentUserId(): string { return this.auth.currentUser()?.userId ?? ''; }

  isDebtor(debt: DebtDto): boolean    { return debt.debtorUserId === this.currentUserId; }
  counterpart(debt: DebtDto): string  { return this.isDebtor(debt) ? debt.creditorUserName : debt.debtorUserName; }

  ngOnInit(): void {
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  onFilterChange(): void { this.loadData(); }

  onPageModeChange(): void {
    this.loadData();
    setTimeout(() => {
      this.debtDataSource.paginator     = this.debtPaginator     ?? null;
      this.purchaseDataSource.paginator = this.purchasePaginator ?? null;
    });
  }

  loadData(): void {
    if (this.pageMode === 'period') {
      this.loadPeriodExpenses();
    } else if (this.pageMode === 'purchases') {
      this.loadPurchaseInstallments();
    } else {
      this.loadDebts();
    }
  }

  private loadPeriodExpenses(): void {
    this.loading.set(true);
    this.dataSource.data = [];
    this.periodExpensesService.getPending(this.filterYear, this.filterMonth).subscribe({
      next: data => { this.dataSource.data = data; this.loading.set(false); },
      error: ()  => { this.snackBar.open('Error al cargar pagos y cobros pendientes', 'Cerrar', { duration: 3000 }); this.loading.set(false); }
    });
  }

  loadDebts(): void {
    this.loadingDebts.set(true);
    this.debtDataSource.data = [];
    const filter = {
      status:     this.statusFilter || undefined,
      year:       this.allPeriods ? undefined : this.filterYear,
      month:      this.allPeriods ? undefined : this.filterMonth,
      allPeriods: this.allPeriods
    };
    forkJoin([
      this.debtsService.getOwedByMe(filter),
      this.debtsService.getOwedToMe(filter)
    ]).subscribe({
      next: ([byMe, toMe]) => {
        this.allDebtsRaw = [...byMe, ...toMe].sort((a, b) => b.date.localeCompare(a.date));
        this.buildCounterpartOptions();
        this.applyDebtFilters();
        this.loadingDebts.set(false);
      },
      error: () => { this.snackBar.open('Error al cargar deudas', 'Cerrar', { duration: 3000 }); this.loadingDebts.set(false); }
    });
  }

  private buildCounterpartOptions(): void {
    const seen = new Map<string, string>();
    for (const debt of this.allDebtsRaw) {
      const userId = this.isDebtor(debt) ? debt.creditorUserId : debt.debtorUserId;
      const name   = this.counterpart(debt);
      if (!seen.has(userId)) seen.set(userId, name);
    }
    this.counterpartOptions = [
      { value: '', label: 'Todos' },
      ...Array.from(seen.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label))
    ];
    if (this.counterpartFilter && !seen.has(this.counterpartFilter)) {
      this.counterpartFilter = '';
    }
  }

  applyDebtFilters(): void {
    this.debtDataSource.data = this.counterpartFilter
      ? this.allDebtsRaw.filter(debt => {
          const cpId = this.isDebtor(debt) ? debt.creditorUserId : debt.debtorUserId;
          return cpId === this.counterpartFilter;
        })
      : this.allDebtsRaw;
  }

  getCategoryName(categoryId: string | null): string {
    return this.categories.find(c => c.id === categoryId)?.name ?? '—';
  }

  getPeriod(row: PeriodExpenseDto): string {
    const month = this.months.find(m => m.value === row.month)?.label ?? row.month.toString();
    return `${month} ${row.year}`;
  }

  formatAmount(amount: number): string { return formatDisplayedAmount(amount); }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('es-PY'); } catch { return iso; }
  }

  statusLabel(status: string): string {
    return this.statusOptions.find(s => s.value === status)?.label ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      Pending:              'badge--amber',
      Accepted:             'badge--green',
      AwaitingConfirmation: 'badge--blue',
      Paid:                 'badge--green',
      Rejected:             'badge--red'
    };
    return map[status] ?? '';
  }

  openRegisterPayment(item: PeriodExpenseDto): void {
    const ref = this.dialog.open(RegisterPendingPaymentDialogComponent, {
      data: { description: item.description, amount: item.amount },
      width: '480px'
    });
    ref.afterClosed().subscribe((dto?: RegisterPeriodExpensePaymentDto) => {
      if (!dto) return;
      this.periodExpensesService.registerPayment(item.id, dto).subscribe({
        next: () => { this.snackBar.open('Pago registrado', 'Cerrar', { duration: 2500 }); this.loadData(); },
        error: () => this.snackBar.open('Error al registrar pago', 'Cerrar', { duration: 3000 })
      });
    });
  }

  openCreateDebt(): void {
    const ref = this.dialog.open(CreateDebtDialogComponent, {
      data: { creditorUserId: this.currentUserId },
      width: '480px'
    });
    ref.afterClosed().subscribe((dto?: CreateDebtDto) => {
      if (!dto) return;
      this.debtsService.create(dto).subscribe({
        next: () => { this.snackBar.open('Deuda creada', 'Cerrar', { duration: 2500 }); this.loadDebts(); },
        error: () => this.snackBar.open('Error al crear deuda', 'Cerrar', { duration: 3000 })
      });
    });
  }

  acceptDebt(debt: DebtDto): void {
    this.debtsService.accept(debt.id).subscribe({
      next: () => { this.snackBar.open('Deuda aceptada', 'Cerrar', { duration: 2500 }); this.loadDebts(); },
      error: () => this.snackBar.open('Error al aceptar', 'Cerrar', { duration: 3000 })
    });
  }

  submitDebtPayment(debt: DebtDto): void {
    const ref = this.dialog.open(RegisterPendingPaymentDialogComponent, {
      data: { description: debt.description, amount: debt.amount },
      width: '480px'
    });
    ref.afterClosed().subscribe((result?: { receiptNumber: string; paidAt: string; paymentDescription: string }) => {
      if (!result) return;
      const dto: SubmitPaymentDto = {
        paymentReference:   result.receiptNumber,
        paidAt:             result.paidAt || null,
        paymentDescription: result.paymentDescription || null
      };
      this.debtsService.submitPayment(debt.id, dto).subscribe({
        next: () => { this.snackBar.open('Pago enviado — esperando confirmación', 'Cerrar', { duration: 3000 }); this.loadDebts(); },
        error: () => this.snackBar.open('Error al registrar pago', 'Cerrar', { duration: 3000 })
      });
    });
  }

  confirmDebtPayment(debt: DebtDto): void {
    this.debtsService.confirm(debt.id).subscribe({
      next: () => { this.snackBar.open('Pago confirmado', 'Cerrar', { duration: 2500 }); this.loadDebts(); },
      error: () => this.snackBar.open('Error al confirmar', 'Cerrar', { duration: 3000 })
    });
  }

  rejectDebtPayment(debt: DebtDto): void {
    const ref = this.dialog.open(RejectDebtDialogComponent, {
      data: { description: debt.description, amount: debt.amount },
      width: '480px'
    });
    ref.afterClosed().subscribe((result?: { rejectionReason: string }) => {
      if (result === undefined) return;
      this.debtsService.reject(debt.id, { rejectionReason: result.rejectionReason || null }).subscribe({
        next: () => { this.snackBar.open('Pago rechazado', 'Cerrar', { duration: 2500 }); this.loadDebts(); },
        error: () => this.snackBar.open('Error al rechazar', 'Cerrar', { duration: 3000 })
      });
    });
  }

  deleteDebt(debt: DebtDto): void {
    this.debtsService.delete(debt.id).subscribe({
      next: () => { this.snackBar.open('Deuda eliminada', 'Cerrar', { duration: 2500 }); this.loadDebts(); },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
    });
  }

  loadPurchaseInstallments(): void {
    this.loadingPurchases.set(true);
    this.purchaseDataSource.data = [];
    this.purchasesService.getUpcomingInstallments(this.filterYear, this.filterMonth).subscribe({
      next: data => { this.purchaseDataSource.data = data; this.loadingPurchases.set(false); },
      error: ()   => { this.snackBar.open('Error al cargar cuotas', 'Cerrar', { duration: 3000 }); this.loadingPurchases.set(false); }
    });
  }

  markInstallmentPaid(item: UpcomingInstallmentDto): void {
    const ref = this.dialog.open(RegisterPendingPaymentDialogComponent, {
      data: { description: `${item.purchaseName} — Cuota ${item.installmentNumber}/${item.totalInstallments}`, amount: item.amount },
      width: '480px'
    });
    ref.afterClosed().subscribe((result?: { receiptNumber: string; paidAt: string; paymentDescription: string }) => {
      if (!result) return;
      this.purchasesService.updateInstallment(item.purchaseId, item.installmentId, {
        isPaid:             true,
        paymentReference:   result.receiptNumber || undefined,
        paymentDescription: result.paymentDescription || undefined
      }).subscribe({
        next: () => { this.snackBar.open('Cuota marcada como pagada', 'Cerrar', { duration: 2500 }); this.loadPurchaseInstallments(); },
        error: () => this.snackBar.open('Error al marcar como pagada', 'Cerrar', { duration: 3000 })
      });
    });
  }

  unpayInstallment(item: UpcomingInstallmentDto): void {
    this.purchasesService.updateInstallment(item.purchaseId, item.installmentId, { isPaid: false }).subscribe({
      next: () => { this.snackBar.open('Cuota marcada como pendiente', 'Cerrar', { duration: 2500 }); this.loadPurchaseInstallments(); },
      error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
    });
  }

  formatDueDate(iso: string): string {
    try {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    } catch { return iso; }
  }
}


