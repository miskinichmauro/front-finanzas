import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../core/services/users.service';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { CreateUserDto, UpdateUserDto, UserDto, UserRole } from '../../core/models';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    AppSelectComponent
  ],
  templateUrl: './user-form-dialog.component.html'
})
export class UserFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  readonly roleItems = [
    { value: UserRole.User,  label: 'Usuario' },
    { value: UserRole.Admin, label: 'Administrador' }
  ];
  private dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<UserDto | null>(MAT_DIALOG_DATA);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', this.data ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]],
    role: [UserRole.User, Validators.required],
    isActive: [true]
  });

  get isEdit(): boolean {
    return !!this.data;
  }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        email: this.data.email,
        role: this.data.role,
        isActive: this.data.isActive
      });
    }
  }

  saving = false;

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const value = this.form.getRawValue();

    if (this.isEdit) {
      const dto: UpdateUserDto = {
        name: value.name!,
        email: value.email!,
        role: value.role!,
        isActive: value.isActive ?? true
      };

      this.usersService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Usuario actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      const dto: CreateUserDto = {
        name: value.name!,
        email: value.email!,
        password: value.password!,
        role: value.role!,
        isActive: value.isActive ?? true
      };

      this.usersService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Usuario creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
