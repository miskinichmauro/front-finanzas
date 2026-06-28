import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriesService } from '../../core/services/categories.service';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { CategoryDto } from '../../core/models';

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    AppSelectComponent
  ],
  templateUrl: './category-form-dialog.component.html'
})
export class CategoryFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoriesService = inject(CategoriesService);
  private dialogRef = inject(MatDialogRef<CategoryFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject<CategoryDto | null>(MAT_DIALOG_DATA);

  categories: CategoryDto[] = [];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parentCategoryId: [null as string | null]
  });

  get isEdit(): boolean { return !!this.data; }

  ngOnInit(): void {
    this.categoriesService.getAll().subscribe(cats => {
      this.categories = cats.filter(c => c.id !== this.data?.id);
    });
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        parentCategoryId: this.data.parentCategoryId
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
      parentCategoryId: value.parentCategoryId || undefined
    };

    if (this.isEdit) {
      this.categoriesService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Categoría actualizada', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.categoriesService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Categoría creada', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
