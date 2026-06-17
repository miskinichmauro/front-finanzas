import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharingGroupsService } from '../../core/services/sharing-groups.service';
import { UsersService } from '../../core/services/users.service';
import { SharingGroupDto, UserDto } from '../../core/models';

@Component({
  selector: 'app-sharing-group-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule
  ],
  templateUrl: './sharing-group-form-dialog.component.html'
})
export class SharingGroupFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sharingGroupsService = inject(SharingGroupsService);
  private usersService = inject(UsersService);
  private dialogRef = inject(MatDialogRef<SharingGroupFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<SharingGroupDto | null>(MAT_DIALOG_DATA);

  users: UserDto[] = [];
  selectedUserIds = new Set<string>();

  form = this.fb.group({
    name: ['', [Validators.required]],
    isActive: [true]
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    this.usersService.getAll().subscribe(u => {
      this.users = u;
    });

    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        isActive: this.data.isActive
      });
      this.data.members.forEach(m => this.selectedUserIds.add(m.userId));
    }
  }

  toggleUser(userId: string): void {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  }

  isSelected(userId: string): boolean {
    return this.selectedUserIds.has(userId);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const dto = { name: value.name!, isActive: value.isActive ?? true };

    if (this.isEdit) {
      this.sharingGroupsService.update(this.data!.id, dto).subscribe({
        next: group => {
          this.sharingGroupsService.updateMembers(this.data!.id, { userIds: Array.from(this.selectedUserIds) }).subscribe({
            next: result => {
              this.snackBar.open('Grupo actualizado', 'Cerrar', { duration: 3000 });
              this.dialogRef.close(result);
            },
            error: () => this.snackBar.open('Error al actualizar miembros', 'Cerrar', { duration: 3000 })
          });
        },
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
      });
    } else {
      this.sharingGroupsService.create(dto).subscribe({
        next: group => {
          this.sharingGroupsService.updateMembers(group.id, { userIds: Array.from(this.selectedUserIds) }).subscribe({
            next: result => {
              this.snackBar.open('Grupo creado', 'Cerrar', { duration: 3000 });
              this.dialogRef.close(result);
            },
            error: () => this.snackBar.open('Error al asignar miembros', 'Cerrar', { duration: 3000 })
          });
        },
        error: () => this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 })
      });
    }
  }
}
