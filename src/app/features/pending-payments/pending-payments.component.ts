import { Component, AfterViewInit, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { PeriodExpensesService } from '../../core/services/period-expenses.service';
import { DebtsService } from '../../core/services/debts.service';
import { FriendsService } from '../../core/services/friends.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryDto } from '../../core/models';
import { PeriodExpenseDto, RegisterPeriodExpensePaymentDto } from '../../core/models/period-expense.model';
import { DebtDto, CreateDebtDto, SubmitPaymentDto } from '../../core/models/debt.model';
import { FriendDto } from '../../core/models/friend.model';
import { CategoriesService } from '../../core/services/categories.service';

type ViewMode = 'owed-by-me' | 'owed-to-me';

@Component({
  selector: 'app-register-pending-payment-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Registrar pago</h2>
    <mat-dialog-content>
      <p class="dialog-subtitle">{{ data.description }} · Gs. {{ data.amount.toLocaleString('es-PY') }}</p>
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
      <p class="dialog-subtitle">{{ data.description }} · Gs. {{ data.amount.toLocaleString('es-PY') }}</p>
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
    PageHeaderComponent
  ],
  templateUrl: './pending-payments.component.html',
  styleUrl: './pending-payments.component.scss'
})
export class PendingPaymentsComponent implements OnInit, AfterViewInit {
  private readonly periodExpensesService = inject(PeriodExpensesService);
  private readonly debtsService          = inject(DebtsService);
  private readonly categoriesService     = inject(CategoriesService);
  private readonly auth                  = inject(AuthService);
  private readonly dialog                = inject(MatDialog);
  private readonly snackBar              = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns    = ['description', 'categoryName', 'amount', 'period', 'actions'];
  debtColumnsDebtor   = ['debtDescription', 'debtCreditor', 'debtAmount', 'debtDate', 'debtStatus', 'debtActionsDebtor'];
  debtColumnsCreditor = ['debtDescription', 'debtDebtor', 'debtAmount', 'debtDate', 'debtStatus', 'debtActionsCreditor'];

  loading      = signal(false);
  loadingDebts = signal(false);

  viewMode: ViewMode = 'owed-by-me';
  allPeriods   = false;
  statusFilter = '';
  filterYear   = new Date().getFullYear();
  filterMonth  = new Date().getMonth() + 1;

  dataSource     = new MatTableDataSource<PeriodExpenseDto>([]);
  debtDataSource = new MatTableDataSource<DebtDto>([]);
  categories: CategoryDto[] = [];

  years  = [2023, 2024, 2025, 2026, 2027].map(y => ({ value: y, label: y.toString() }));
  months = [
    { value: 1,  label: 'Enero' },   { value: 2,  label: 'Febrero' },  { value: 3,  label: 'Marzo' },
    { value: 4,  label: 'Abril' },   { value: 5,  label: 'Mayo' },     { value: 6,  label: 'Junio' },
    { value: 7,  label: 'Julio' },   { value: 8,  label: 'Agosto' },   { value: 9,  label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  viewModes = [
    { value: 'owed-by-me',  label: 'Lo que debo' },
    { value: 'owed-to-me', label: 'Lo que me deben' }
  ];

  statusOptions = [
    { value: '',                     label: 'Todos' },
    { value: 'Pending',              label: 'Pendiente' },
    { value: 'Accepted',             label: 'Aceptado' },
    { value: 'AwaitingConfirmation', label: 'Esperando confirmación' },
    { value: 'Paid',                 label: 'Pagado' },
    { value: 'Rejected',             label: 'Rechazado' }
  ];

  get periodTotal(): number  { return this.dataSource.data.reduce((s, r) => s + r.amount, 0); }
  get debtTotal(): number    { return this.debtDataSource.data.reduce((s, r) => s + r.amount, 0); }
  get currentUserId(): string { return this.auth.currentUser()?.userId ?? ''; }

  ngOnInit(): void {
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  onViewModeChange(): void { this.loadData(); }
  onFilterChange(): void   { this.loadData(); }

  loadData(): void {
    this.loadDebts();
    if (this.viewMode === 'owed-by-me') this.loadPeriodExpenses();
    else this.dataSource.data = [];
  }

  private loadPeriodExpenses(): void {
    this.loading.set(true);
    this.dataSource.data = [];
    this.periodExpensesService.getPending(this.filterYear, this.filterMonth).subscribe({
      next: data  => { this.dataSource.data = data; this.loading.set(false); },
      error: ()   => { this.snackBar.open('Error al cargar pagos pendientes', 'Cerrar', { duration: 3000 }); this.loading.set(false); }
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
    const obs = this.viewMode === 'owed-by-me'
      ? this.debtsService.getOwedByMe(filter)
      : this.debtsService.getOwedToMe(filter);

    obs.subscribe({
      next: data => { this.debtDataSource.data = data; this.loadingDebts.set(false); },
      error: ()  => { this.snackBar.open('Error al cargar deudas', 'Cerrar', { duration: 3000 }); this.loadingDebts.set(false); }
    });
  }

  getCategoryName(categoryId: string | null): string {
    return this.categories.find(c => c.id === categoryId)?.name ?? '—';
  }

  getPeriod(row: PeriodExpenseDto): string {
    const month = this.months.find(m => m.value === row.month)?.label ?? row.month.toString();
    return `${month} ${row.year}`;
  }

  formatAmount(amount: number): string { return Math.round(amount).toLocaleString('es-PY'); }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('es-PY'); } catch { return iso; }
  }

  statusLabel(status: string): string {
    return this.statusOptions.find(s => s.value === status)?.label ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      Pending:              'badge-pending',
      Accepted:             'badge-accepted',
      AwaitingConfirmation: 'badge-awaiting',
      Paid:                 'badge-paid',
      Rejected:             'badge-rejected'
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
}
