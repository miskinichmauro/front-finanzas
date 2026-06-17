import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { PaymentMethodDto } from '../../core/models';

@Component({
  selector: 'app-payment-method-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './payment-method-form-dialog.component.html'
})
export class PaymentMethodFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private paymentMethodsService = inject(PaymentMethodsService);
  private dialogRef = inject(MatDialogRef<PaymentMethodFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<PaymentMethodDto | null>(MAT_DIALOG_DATA);

  paymentTypes = ['Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'Transferencia', 'Billetera Virtual', 'Otro'];

  form = this.fb.group({
    name: ['', [Validators.required]],
    type: ['', [Validators.required]],
    bankName: [''],
    lastDigits: [''],
    isActive: [true]
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        type: this.data.type,
        bankName: this.data.bankName,
        lastDigits: this.data.lastDigits,
        isActive: this.data.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const dto = {
      name: value.name!,
      type: value.type!,
      bankName: value.bankName ?? '',
      lastDigits: value.lastDigits ?? '',
      isActive: value.isActive ?? true
    };

    if (this.isEdit) {
      this.paymentMethodsService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Medio de pago actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
      });
    } else {
      this.paymentMethodsService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Medio de pago creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 })
      });
    }
  }
}
