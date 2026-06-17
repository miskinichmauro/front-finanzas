import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './transaction-form-dialog.component.html'
})
export class TransactionFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionsService = inject(TransactionsService);
  private usersService = inject(UsersService);
  private categoriesService = inject(CategoriesService);
  private paymentMethodsService = inject(PaymentMethodsService);
  private commercesService = inject(CommercesService);
  private dialogRef = inject(MatDialogRef<TransactionFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<TransactionDto | null>(MAT_DIALOG_DATA);

  users: UserDto[] = [];
  categories: CategoryDto[] = [];
  paymentMethods: PaymentMethodDto[] = [];
  commerces: CommerceDto[] = [];

  form = this.fb.group({
    date: [new Date(), [Validators.required]],
    userId: ['', [Validators.required]],
    commerceId: [null as string | null],
    categoryId: [null as string | null],
    paymentMethodId: [null as string | null],
    grossAmount: [0, [Validators.required, Validators.min(0)]],
    netAmount: [0, [Validators.required, Validators.min(0)]],
    discountAmount: [0],
    discountPercent: [0],
    notes: ['']
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    this.usersService.getAll().subscribe(u => this.users = u);
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.paymentMethodsService.getAll().subscribe(p => this.paymentMethods = p);
    this.commercesService.getAll().subscribe(c => this.commerces = c);

    if (this.data) {
      this.form.patchValue({
        date: new Date(this.data.date),
        userId: this.data.userId,
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

  onGrossAmountChange(): void {
    const gross = this.form.get('grossAmount')?.value ?? 0;
    const discount = this.form.get('discountAmount')?.value ?? 0;
    this.form.patchValue({ netAmount: gross - discount }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const dateVal = value.date instanceof Date ? value.date : new Date(value.date!);
    const dto = {
      date: dateVal.toISOString().split('T')[0],
      userId: value.userId!,
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
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
      });
    } else {
      this.transactionsService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Transacción creada', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 })
      });
    }
  }
}
