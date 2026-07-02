import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryGroupsService } from '../../core/services/category-groups.service';
import { CategoryGroupDto } from '../../core/models';

@Component({
  selector: 'app-category-group-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar Grupo' : 'Nuevo Grupo' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="field"><label>Nombre<input formControlName="name" placeholder="Nombre del grupo" /></label></div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close class="btn-cancel">Cancelar</button>
      <button mat-flat-button class="btn-primary" (click)="save()" [disabled]="form.invalid || saving">Guardar</button>
    </mat-dialog-actions>
  `
})
export class CategoryGroupFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CategoryGroupsService);
  private readonly dialogRef = inject(MatDialogRef<CategoryGroupFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<CategoryGroupDto | null>(MAT_DIALOG_DATA);
  readonly form = this.fb.group({ name: [this.data?.name ?? '', [Validators.required, Validators.minLength(2)]] });
  saving = false;

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const request = this.data
      ? this.service.update(this.data.id, { name: this.form.value.name! })
      : this.service.create({ name: this.form.value.name! });
    request.subscribe({
      next: result => { this.snackBar.open('Grupo guardado', 'Cerrar', { duration: 3000 }); this.dialogRef.close(result); },
      error: () => { this.saving = false; this.snackBar.open('No se pudo guardar el grupo', 'Cerrar', { duration: 3000 }); }
    });
  }
}
