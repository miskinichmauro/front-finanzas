import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThousandsDirective } from '../../shared/directives/thousands.directive';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { AuthService } from '../../core/services/auth.service';
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
    MatButtonModule,
    MatCheckboxModule,
    AppSelectComponent,
    ThousandsDirective
  ],
  templateUrl: './income-form-dialog.component.html'
})
export class IncomeFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly incomesService = inject(IncomesService);
  private readonly usersService = inject(UsersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly dialogRef = inject(MatDialogRef<IncomeFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  data = inject<IncomeDto | null>(MAT_DIALOG_DATA);

  readonly isAdmin = this.authService.isAdmin;

  users: UserDto[] = [];
  categories: CategoryDto[] = [];
  updateSeries = false;

  form = this.fb.group({
    userId: ['', [Validators.required]],
    categoryId: [null as string | null, [Validators.required]],
    description: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0)]],
    date: [new Date().toISOString().split('T')[0], [Validators.required]],
    isRecurring: [false]
  });

  get isEdit(): boolean { return !!this.data; }
  get isEditingRecurringSeries(): boolean {
    return this.isEdit && !!this.data?.isRecurring && !!this.data?.recurringGroupId;
  }

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.usersService.getAll().subscribe(u => this.users = u);
    } else {
      this.form.patchValue({ userId: this.authService.currentUser()?.userId ?? '' });
      this.form.get('userId')?.disable();
    }
    this.categoriesService.getAll().subscribe(c => this.categories = c);

    if (this.data) {
      this.form.patchValue({
        userId: this.data.userId,
        categoryId: this.data.categoryId,
        description: this.data.description,
        amount: this.data.amount,
        date: this.data.date,
        isRecurring: this.data.isRecurring
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
      description: value.description!,
      amount: value.amount ?? 0,
      date: value.date!,
      isRecurring: value.isRecurring ?? false
    };

    if (this.isEdit) {
      const call = this.updateSeries
        ? this.incomesService.updateSeries(this.data!.id, dto)
        : this.incomesService.update(this.data!.id, dto);

      call.subscribe({
        next: result => {
          const msg = this.updateSeries ? 'Serie actualizada' : 'Ingreso actualizado';
          this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.incomesService.create(dto).subscribe({
        next: result => {
          const msg = dto.isRecurring
            ? 'Ingreso recurrente creado para todos los meses restantes del año'
            : 'Ingreso creado';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
