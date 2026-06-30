import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { ThousandsDirective } from '../../shared/directives/thousands.directive';
import { AuthService } from '../../core/services/auth.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriesService } from '../../core/services/categories.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { CommercesService } from '../../core/services/commerces.service';
import { TransactionDto, UserDto, CategoryDto, PaymentMethodDto, CommerceDto } from '../../core/models';

@Component({
  selector: 'app-transaction-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    AppSelectComponent,
    ThousandsDirective
  ],
  templateUrl: './transaction-form-dialog.component.html'
})
export class TransactionFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly usersService = inject(UsersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly commercesService = inject(CommercesService);
  private readonly dialogRef = inject(MatDialogRef<TransactionFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  data = inject<TransactionDto | null>(MAT_DIALOG_DATA);

  readonly isAdmin = this.authService.isAdmin;

  users: UserDto[] = null as any;
  categories: CategoryDto[] = null as any;
  paymentMethods: (PaymentMethodDto & { displayName: string })[] = null as any;
  commerces: (CommerceDto & { displayName: string })[] = null as any;

  form = this.fb.group({
    date: [new Date().toISOString().split('T')[0], [Validators.required]],
    userId: ['', [Validators.required]],
    description: ['', [Validators.required]],
    commerceId: [null as string | null],
    categoryId: [null as string | null, [Validators.required]],
    paymentMethodId: [null as string | null],
    grossAmount: [0, [Validators.required, Validators.min(0)]],
    netAmount: [0, [Validators.required, Validators.min(0)]],
    discountAmount: [0],
    discountPercent: [0],
    notes: ['']
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.usersService.getAll().subscribe(u => this.users = u);
    } else {
      this.form.patchValue({ userId: this.authService.currentUser()?.userId ?? '' });
      this.form.get('userId')?.disable();
    }
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.paymentMethodsService.getAll().subscribe(p => {
      this.paymentMethods = p.map(m => ({
        ...m,
        displayName: [m.name, m.lastDigits || null, m.bankName || null].filter(Boolean).join(' - ')
      }));
    });
    this.commercesService.getAll().subscribe(c => {
      this.commerces = c.map(x => ({
        ...x,
        displayName: x.address ? `${x.name} - ${x.address}` : x.name
      }));
    });

    if (this.data) {
      this.form.patchValue({
        date: this.data.date,
        userId: this.data.userId,
        description: this.data.description ?? '',
        commerceId: this.data.commerceId,
        categoryId: this.data.categoryId,
        paymentMethodId: this.data.paymentMethodId,
        grossAmount: this.data.grossAmount,
        netAmount: this.data.netAmount,
        discountAmount: this.data.discountAmount,
        discountPercent: this.data.discountPercent,
        notes: this.data.notes
      });
    }
  }

  onGrossAmountChange(): void { this.recalcFromPercent(); }
  onDiscountPercentChange(): void { this.recalcFromPercent(); }

  private recalcFromPercent(): void {
    const gross = this.form.get('grossAmount')?.value ?? 0;
    const pct = this.form.get('discountPercent')?.value ?? 0;
    const discountAmt = Math.round(gross * pct / 100);
    this.form.patchValue({ discountAmount: discountAmt, netAmount: gross - discountAmt }, { emitEvent: false });
  }

  onDiscountAmountChange(): void {
    const gross = this.form.get('grossAmount')?.value ?? 0;
    const discount = this.form.get('discountAmount')?.value ?? 0;
    const pct = gross > 0 ? Math.round(discount / gross * 100) : 0;
    this.form.patchValue({ discountPercent: pct, netAmount: gross - discount }, { emitEvent: false });
  }

  saving = false;

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const value = this.form.getRawValue();
    const dto = {
      date: value.date!,
      userId: value.userId!,
      description: value.description || undefined,
      commerceId: value.commerceId || undefined,
      categoryId: value.categoryId || undefined,
      paymentMethodId: value.paymentMethodId || undefined,
      grossAmount: value.grossAmount ?? 0,
      netAmount: value.netAmount ?? 0,
      discountAmount: value.discountAmount ?? 0,
      discountPercent: value.discountPercent ?? 0,
      notes: value.notes ?? ''
    };

    if (this.isEdit) {
      this.transactionsService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Transacción actualizada', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.transactionsService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Transacción creada', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
