import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommercesService } from '../../core/services/commerces.service';
import { CommerceDto } from '../../core/models';

@Component({
  selector: 'app-commerce-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './commerce-form-dialog.component.html'
})
export class CommerceFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private commercesService = inject(CommercesService);
  private dialogRef = inject(MatDialogRef<CommerceFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<CommerceDto | null>(MAT_DIALOG_DATA);

  form = this.fb.group({
    name: ['', [Validators.required]],
    address: [''],
    isFavorite: [false]
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        address: this.data.address,
        isFavorite: this.data.isFavorite
      });
    }
  }

  saving = false;

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const value = this.form.value;
    const dto = {
      name: value.name!,
      address: value.address ?? '',
      isFavorite: value.isFavorite ?? false
    };

    if (this.isEdit) {
      this.commercesService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Comercio actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.commercesService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Comercio creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
