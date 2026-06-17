import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PeriodExpensesService } from '../../core/services/period-expenses.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriesService } from '../../core/services/categories.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { PeriodExpenseDto, UserDto, CategoryDto, PaymentMethodDto, PERIOD_EXPENSE_TYPES } from '../../core/models';

@Component({
  selector: 'app-period-expense-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './period-expense-form-dialog.component.html'
})
export class PeriodExpenseFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private periodExpensesService = inject(PeriodExpensesService);
  private usersService = inject(UsersService);
  private categoriesService = inject(CategoriesService);
  private paymentMethodsService = inject(PaymentMethodsService);
  private dialogRef = inject(MatDialogRef<PeriodExpenseFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<PeriodExpenseDto | null>(MAT_DIALOG_DATA);

  users: UserDto[] = [];
  categories: CategoryDto[] = [];
  paymentMethods: PaymentMethodDto[] = [];
  expenseTypes = [...PERIOD_EXPENSE_TYPES];

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  form = this.fb.group({
    userId: ['', [Validators.required]],
    categoryId: [null as string | null],
    paymentMethodId: [null as string | null],
    type: ['Egreso', [Validators.required]],
    description: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0)]],
    year: [this.currentYear, [Validators.required]],
    month: [this.currentMonth, [Validators.required]],
    isPaid: [false],
    notes: ['']
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    this.usersService.getAll().subscribe(u => this.users = u);
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.paymentMethodsService.getAll().subscribe(p => this.paymentMethods = p);

    if (this.data) {
      this.form.patchValue({
        userId: this.data.userId,
        categoryId: this.data.categoryId,
        paymentMethodId: this.data.paymentMethodId,
        type: this.data.type,
        description: this.data.description,
        amount: this.data.amount,
        year: this.data.year,
        month: this.data.month,
        isPaid: this.data.isPaid,
        notes: this.data.notes
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const dto = {
      userId: value.userId!,
      categoryId: value.categoryId || undefined,
      paymentMethodId: value.paymentMethodId || undefined,
      type: value.type!,
      description: value.description!,
      amount: value.amount ?? 0,
      year: value.year ?? this.currentYear,
      month: value.month ?? this.currentMonth,
      isPaid: value.isPaid ?? false,
      notes: value.notes ?? ''
    };

    if (this.isEdit) {
      this.periodExpensesService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Gasto actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
      });
    } else {
      this.periodExpensesService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Gasto creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 })
      });
    }
  }
}
