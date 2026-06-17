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
import { FixedExpensesService } from '../../core/services/fixed-expenses.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriesService } from '../../core/services/categories.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { FixedExpenseDto, UserDto, CategoryDto, PaymentMethodDto } from '../../core/models';

@Component({
  selector: 'app-fixed-expense-form-dialog',
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
  templateUrl: './fixed-expense-form-dialog.component.html'
})
export class FixedExpenseFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private fixedExpensesService = inject(FixedExpensesService);
  private usersService = inject(UsersService);
  private categoriesService = inject(CategoriesService);
  private paymentMethodsService = inject(PaymentMethodsService);
  private dialogRef = inject(MatDialogRef<FixedExpenseFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<FixedExpenseDto | null>(MAT_DIALOG_DATA);

  users: UserDto[] = [];
  categories: CategoryDto[] = [];
  paymentMethods: PaymentMethodDto[] = [];

  form = this.fb.group({
    userId: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    paymentMethodId: [null as string | null],
    description: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0)]],
    dueDay: [null as number | null],
    notes: [''],
    isActive: [true]
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
        description: this.data.description,
        amount: this.data.amount,
        dueDay: this.data.dueDay,
        notes: this.data.notes,
        isActive: this.data.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const dto = {
      userId: value.userId!,
      categoryId: value.categoryId!,
      paymentMethodId: value.paymentMethodId || undefined,
      description: value.description!,
      amount: value.amount ?? 0,
      dueDay: value.dueDay ?? undefined,
      notes: value.notes ?? '',
      isActive: value.isActive ?? true
    };

    if (this.isEdit) {
      this.fixedExpensesService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Gasto fijo actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
      });
    } else {
      this.fixedExpensesService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Gasto fijo creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 })
      });
    }
  }
}
