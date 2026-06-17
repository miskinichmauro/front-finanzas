import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../core/services/users.service';
import { UserDto } from '../../core/models';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './user-form-dialog.component.html'
})
export class UserFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<UserDto | null>(MAT_DIALOG_DATA);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    isActive: [true]
  });

  get isEdit(): boolean {
    return !!this.data;
  }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        isActive: this.data.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const dto = { name: value.name!, isActive: value.isActive ?? true };

    if (this.isEdit) {
      this.usersService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Usuario actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
      });
    } else {
      this.usersService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Usuario creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 })
      });
    }
  }
}
