import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { CategoryFormDialogComponent } from './category-form-dialog.component';
import { CategoriesService } from '../../core/services/categories.service';
import { CategoryDto } from '../../core/models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent
  ],
  templateUrl: './categories.component.html'
})
export class CategoriesComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  displayedColumns = ['name', 'parentCategoryId', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<CategoryDto>([]);
  allCategories: CategoryDto[] = [];
  searchText = '';

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.loadData();
  }


  loadData(): void {
    this.loading.set(true);
    this.dataSource.data = [];
    this.categoriesService.getAll().subscribe({
      next: data => {
        this.allCategories = data;
        this.dataSource.data = data;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar categorías', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  getParentName(parentId: string | null): string {
    if (!parentId) return '—';
    return this.allCategories.find(c => c.id === parentId)?.name ?? '—';
  }

  openCreate(): void {
    const ref = this.dialog.open(CategoryFormDialogComponent, { data: null, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(cat: CategoryDto): void {
    const ref = this.dialog.open(CategoryFormDialogComponent, { data: cat, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(cat: CategoryDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Categoría', message: `¿Eliminar la categoría "${cat.name}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.categoriesService.delete(cat.id).subscribe({
          next: () => {
            this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
