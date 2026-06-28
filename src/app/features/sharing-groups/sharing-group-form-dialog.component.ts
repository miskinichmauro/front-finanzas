import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SharingGroupsService } from '../../core/services/sharing-groups.service';
import { FriendsService } from '../../core/services/friends.service';
import { UsersService } from '../../core/services/users.service';
import { SharingGroupDto } from '../../core/models';
import { AppMultiSelectComponent } from '../../shared/components/app-multi-select/app-multi-select.component';

interface MemberOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-sharing-group-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    AppMultiSelectComponent
  ],
  templateUrl: './sharing-group-form-dialog.component.html'
})
export class SharingGroupFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sharingGroupsService = inject(SharingGroupsService);
  private readonly friendsService = inject(FriendsService);
  private readonly usersService = inject(UsersService);
  private readonly dialogRef = inject(MatDialogRef<SharingGroupFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  data = inject<SharingGroupDto | null>(MAT_DIALOG_DATA);

  memberOptions: MemberOption[] = [];
  selectedMemberIds: string[] = [];

  form = this.fb.group({
    name: ['', [Validators.required]],
    isActive: [true]
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    const existingIds = this.data?.members.map(m => m.userId) ?? [];

    forkJoin({
      friends: this.friendsService.getMyFriends().pipe(catchError(() => of([]))),
      allUsers: this.usersService.getAll().pipe(catchError(() => of([])))
    }).subscribe(({ friends, allUsers }) => {
      const friendOptions = friends.map(f => ({ id: f.friendUserId, name: f.friendName }));

      const existingNonFriends = allUsers
        .filter(u => existingIds.includes(u.id) && !friends.some(f => f.friendUserId === u.id))
        .map(u => ({ id: u.id, name: u.name }));

      const merged = [...friendOptions, ...existingNonFriends];
      this.memberOptions = merged.slice().sort((a: MemberOption, b: MemberOption) => a.name.localeCompare(b.name));
      this.selectedMemberIds = existingIds;
    });

    if (this.data) {
      this.form.patchValue({ name: this.data.name, isActive: this.data.isActive });
    }
  }

  saving = false;

  get hasMembers(): boolean { return this.selectedMemberIds.length > 0; }

  onSubmit(): void {
    if (this.form.invalid || this.saving || !this.hasMembers) return;
    this.saving = true;
    const value = this.form.value;
    const dto = { name: value.name!, isActive: value.isActive ?? true };

    if (this.isEdit) {
      this.sharingGroupsService.update(this.data!.id, dto).subscribe({
        next: () => {
          this.sharingGroupsService.updateMembers(this.data!.id, { userIds: this.selectedMemberIds }).subscribe({
            next: result => {
              this.snackBar.open('Grupo actualizado', 'Cerrar', { duration: 3000 });
              this.dialogRef.close(result);
            },
            error: () => { this.saving = false; this.snackBar.open('Error al actualizar miembros', 'Cerrar', { duration: 3000 }); }
          });
        },
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.sharingGroupsService.create(dto).subscribe({
        next: group => {
          this.sharingGroupsService.updateMembers(group.id, { userIds: this.selectedMemberIds }).subscribe({
            next: result => {
              this.snackBar.open('Grupo creado', 'Cerrar', { duration: 3000 });
              this.dialogRef.close(result);
            },
            error: () => { this.saving = false; this.snackBar.open('Error al asignar miembros', 'Cerrar', { duration: 3000 }); }
          });
        },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
