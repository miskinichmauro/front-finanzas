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
import { LoansService } from '../../core/services/loans.service';
import { UsersService } from '../../core/services/users.service';
import { LoanDto, UserDto } from '../../core/models';

@Component({
  selector: 'app-loan-form-dialog',
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
  templateUrl: './loan-form-dialog.component.html'
})
export class LoanFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly loansService = inject(LoansService);
  private readonly usersService = inject(UsersService);
  private readonly dialogRef = inject(MatDialogRef<LoanFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  data = inject<LoanDto | null>(MAT_DIALOG_DATA);

  readonly isAdmin = this.authService.isAdmin;
  readonly loanTypes = [
    { value: 'Prestamo', label: 'Préstamo' },
    { value: 'Ahorro', label: 'Ahorro' }
  ];

  users: UserDto[] = null as any;

  form = this.fb.group({
    userId: ['', Validators.required],
    type: ['Prestamo', Validators.required],
    name: ['', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(0)]],
    installmentAmount: [0, [Validators.required, Validators.min(1)]],
    totalInstallments: [1, [Validators.required, Validators.min(1)]],
    firstDueDate: ['', Validators.required],
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

    if (this.data) {
      this.form.patchValue({
        userId: this.data.userId,
        type: this.data.type,
        name: this.data.name,
        totalAmount: this.data.totalAmount,
        installmentAmount: this.data.installmentAmount,
        totalInstallments: this.data.totalInstallments,
        firstDueDate: this.data.firstDueDate,
        notes: this.data.notes ?? '',
        isActive: this.data.isActive
      });
      this.form.get('totalInstallments')?.disable();
      this.form.get('firstDueDate')?.disable();
    }
  }

  saving = false;

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const v = this.form.getRawValue();

    if (this.isEdit) {
      this.loansService.update(this.data!.id, {
        userId: v.userId!,
        type: v.type as 'Prestamo' | 'Ahorro',
        name: v.name!,
        totalAmount: v.totalAmount ?? 0,
        installmentAmount: v.installmentAmount ?? 0,
        notes: v.notes ?? undefined,
        isActive: v.isActive ?? true
      }).subscribe({
        next: r => { this.snackBar.open('Actualizado', 'Cerrar', { duration: 3000 }); this.dialogRef.close(r); },
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.loansService.create({
        userId: v.userId!,
        type: v.type as 'Prestamo' | 'Ahorro',
        name: v.name!,
        totalAmount: v.totalAmount ?? 0,
        installmentAmount: v.installmentAmount ?? 0,
        totalInstallments: v.totalInstallments ?? 1,
        firstDueDate: v.firstDueDate!,
        notes: v.notes ?? undefined
      }).subscribe({
        next: r => { this.snackBar.open('Creado', 'Cerrar', { duration: 3000 }); this.dialogRef.close(r); },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
