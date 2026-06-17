import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SplitService } from '../../core/services/split.service';
import { SplitAdjustmentDto, UserDto } from '../../core/models';

export interface AdjustmentDialogData {
  adjustment: SplitAdjustmentDto | null;
  sharingGroupId: string;
  year: number;
  month: number;
  users: UserDto[];
}

@Component({
  selector: 'app-split-adjustment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar Ajuste' : 'Nuevo Ajuste' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 pt-2 min-w-80">
        <mat-form-field appearance="outline">
          <mat-label>Usuario</mat-label>
          <mat-select formControlName="userId">
            @for (u of data.users; track u.id) {
              <mat-option [value]="u.id">{{ u.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <input matInput formControlName="description" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Monto (Gs.) — negativo para descuento</mat-label>
          <input matInput type="number" formControlName="amount" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Orden de visualización</mat-label>
          <input matInput type="number" formControlName="displayOrder" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="form.invalid">
        Guardar
      </button>
    </mat-dialog-actions>
  `
})
export class SplitAdjustmentDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private splitService = inject(SplitService);
  private dialogRef = inject(MatDialogRef<SplitAdjustmentDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<AdjustmentDialogData>(MAT_DIALOG_DATA);

  form = this.fb.group({
    userId: ['', [Validators.required]],
    description: ['', [Validators.required]],
    amount: [0, [Validators.required]],
    displayOrder: [0]
  });

  get isEdit(): boolean { return !!this.data.adjustment; }

  ngOnInit(): void {
    if (this.data.adjustment) {
      this.form.patchValue({
        userId: this.data.adjustment.userId,
        description: this.data.adjustment.description,
        amount: this.data.adjustment.amount,
        displayOrder: this.data.adjustment.displayOrder
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;

    if (this.isEdit) {
      const dto = {
        userId: value.userId!,
        description: value.description!,
        amount: value.amount ?? 0,
        displayOrder: value.displayOrder ?? 0
      };
      this.splitService.updateAdjustment(this.data.adjustment!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Ajuste actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
      });
    } else {
      const dto = {
        sharingGroupId: this.data.sharingGroupId,
        year: this.data.year,
        month: this.data.month,
        userId: value.userId!,
        description: value.description!,
        amount: value.amount ?? 0,
        displayOrder: value.displayOrder ?? 0
      };
      this.splitService.createAdjustment(dto).subscribe({
        next: result => {
          this.snackBar.open('Ajuste creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 })
      });
    }
  }
}
