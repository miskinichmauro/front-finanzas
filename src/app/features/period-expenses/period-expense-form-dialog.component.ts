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
import { PeriodExpensesService } from '../../core/services/period-expenses.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriesService } from '../../core/services/categories.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { PeriodExpenseDto } from '../../core/models/period-expense.model';
import { UserDto, CategoryDto, PaymentMethodDto } from '../../core/models';

@Component({
  selector: 'app-period-expense-form-dialog',
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
  templateUrl: './period-expense-form-dialog.component.html'
})
export class PeriodExpenseFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly periodExpensesService = inject(PeriodExpensesService);
  private readonly usersService = inject(UsersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly dialogRef = inject(MatDialogRef<PeriodExpenseFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  data = inject<PeriodExpenseDto | null>(MAT_DIALOG_DATA);

  readonly isAdmin = this.authService.isAdmin;

  users: UserDto[] = null as any;
  categories: CategoryDto[] = null as any;
  paymentMethods: (PaymentMethodDto & { displayName: string })[] = null as any;
  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  form = this.fb.group({
    userId: ['', [Validators.required]],
    categoryId: [null as string | null, [Validators.required]],
    paymentMethodId: [null as string | null, [Validators.required]],
    description: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0)]],
    year: [this.currentYear, [Validators.required]],
    month: [this.currentMonth, [Validators.required]],
    isPaid: [false],
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

    if (this.data) {
      this.form.patchValue({
        userId: this.data.userId,
        categoryId: this.data.categoryId,
        paymentMethodId: this.data.paymentMethodId,
        description: this.data.description,
        amount: this.data.amount,
        year: this.data.year,
        month: this.data.month,
        isPaid: this.data.isPaid,
        notes: this.data.notes
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
      paymentMethodId: value.paymentMethodId!,
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
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.periodExpensesService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Gasto creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
