import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { ThousandsDirective } from '../../shared/directives/thousands.directive';
import { AuthService } from '../../core/services/auth.service';
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
    MatButtonModule,
    MatCheckboxModule,
    AppSelectComponent,
    ThousandsDirective
  ],
  templateUrl: './fixed-expense-form-dialog.component.html'
})
export class FixedExpenseFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly fixedExpensesService = inject(FixedExpensesService);
  private readonly usersService = inject(UsersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly dialogRef = inject(MatDialogRef<FixedExpenseFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  data = inject<FixedExpenseDto | null>(MAT_DIALOG_DATA);

  readonly isAdmin = this.authService.isAdmin;

  users: UserDto[] = null as any;
  categories: CategoryDto[] = null as any;
  paymentMethods: (PaymentMethodDto & { displayName: string })[] = null as any;

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

  saving = false;

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const value = this.form.getRawValue();
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
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.fixedExpensesService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Gasto fijo creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
