import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IncomesService } from '../../core/services/incomes.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriesService } from '../../core/services/categories.service';
import { IncomeDto, UserDto, CategoryDto } from '../../core/models';

@Component({
  selector: 'app-income-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './income-form-dialog.component.html'
})
export class IncomeFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private incomesService = inject(IncomesService);
  private usersService = inject(UsersService);
  private categoriesService = inject(CategoriesService);
  private dialogRef = inject(MatDialogRef<IncomeFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<IncomeDto | null>(MAT_DIALOG_DATA);

  users: UserDto[] = [];
  categories: CategoryDto[] = [];

  form = this.fb.group({
    userId: ['', [Validators.required]],
    categoryId: [null as string | null],
    description: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0)]],
    date: [new Date(), [Validators.required]],
    isRecurring: [false]
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    this.usersService.getAll().subscribe(u => this.users = u);
    this.categoriesService.getAll().subscribe(c => this.categories = c);

    if (this.data) {
      this.form.patchValue({
        userId: this.data.userId,
        categoryId: this.data.categoryId,
        description: this.data.description,
        amount: this.data.amount,
        date: new Date(this.data.date),
        isRecurring: this.data.isRecurring
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const dateVal = value.date instanceof Date ? value.date : new Date(value.date!);
    const dto = {
      userId: value.userId!,
      categoryId: value.categoryId || undefined,
      description: value.description!,
      amount: value.amount ?? 0,
      date: dateVal.toISOString().split('T')[0],
      isRecurring: value.isRecurring ?? false
    };

    if (this.isEdit) {
      this.incomesService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Ingreso actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
      });
    } else {
      this.incomesService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Ingreso creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 })
      });
    }
  }
}
