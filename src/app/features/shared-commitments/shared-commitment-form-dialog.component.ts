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
import { SharedCommitmentsService } from '../../core/services/shared-commitments.service';
import { SharingGroupsService } from '../../core/services/sharing-groups.service';
import { CategoriesService } from '../../core/services/categories.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { SharedCommitmentDto, SharingGroupDto, CategoryDto, PaymentMethodDto, SHARED_COMMITMENT_SECTIONS } from '../../core/models';

@Component({
  selector: 'app-shared-commitment-form-dialog',
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
  templateUrl: './shared-commitment-form-dialog.component.html'
})
export class SharedCommitmentFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sharedCommitmentsService = inject(SharedCommitmentsService);
  private sharingGroupsService = inject(SharingGroupsService);
  private categoriesService = inject(CategoriesService);
  private paymentMethodsService = inject(PaymentMethodsService);
  private dialogRef = inject(MatDialogRef<SharedCommitmentFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<SharedCommitmentDto | null>(MAT_DIALOG_DATA);

  sharingGroups: SharingGroupDto[] = [];
  categories: CategoryDto[] = [];
  paymentMethods: PaymentMethodDto[] = [];
  sections = [...SHARED_COMMITMENT_SECTIONS];

  form = this.fb.group({
    sharingGroupId: ['', [Validators.required]],
    section: ['', [Validators.required]],
    description: ['', [Validators.required]],
    categoryId: [null as string | null],
    paymentMethodId: [null as string | null],
    amount: [0, [Validators.required, Validators.min(0)]],
    displayOrder: [0],
    notes: [''],
    isActive: [true]
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    this.sharingGroupsService.getAll().subscribe(g => this.sharingGroups = g);
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.paymentMethodsService.getAll().subscribe(p => this.paymentMethods = p);

    if (this.data) {
      this.form.patchValue({
        sharingGroupId: this.data.sharingGroupId,
        section: this.data.section,
        description: this.data.description,
        categoryId: this.data.categoryId,
        paymentMethodId: this.data.paymentMethodId,
        amount: this.data.amount,
        displayOrder: this.data.displayOrder,
        notes: this.data.notes,
        isActive: this.data.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const dto = {
      sharingGroupId: value.sharingGroupId!,
      section: value.section!,
      description: value.description!,
      categoryId: value.categoryId || undefined,
      paymentMethodId: value.paymentMethodId || undefined,
      amount: value.amount ?? 0,
      displayOrder: value.displayOrder ?? 0,
      notes: value.notes ?? '',
      isActive: value.isActive ?? true
    };

    if (this.isEdit) {
      this.sharedCommitmentsService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Compromiso actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
      });
    } else {
      this.sharedCommitmentsService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Compromiso creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 })
      });
    }
  }
}
