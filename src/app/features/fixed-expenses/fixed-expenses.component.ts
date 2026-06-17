import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { FixedExpenseFormDialogComponent } from './fixed-expense-form-dialog.component';
import { FixedExpensesService } from '../../core/services/fixed-expenses.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriesService } from '../../core/services/categories.service';
import { FixedExpenseDto, UserDto, CategoryDto } from '../../core/models';

@Component({
  selector: 'app-fixed-expenses',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    PageHeaderComponent
  ],
  templateUrl: './fixed-expenses.component.html'
})
export class FixedExpensesComponent implements OnInit {
  private fixedExpensesService = inject(FixedExpensesService);
  private usersService = inject(UsersService);
  private categoriesService = inject(CategoriesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['description', 'userName', 'categoryName', 'amount', 'dueDay', 'isActive', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<FixedExpenseDto>([]);
  users: UserDto[] = [];
  categories: CategoryDto[] = [];

  ngOnInit(): void {
    this.usersService.getAll().subscribe(u => this.users = u);
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.fixedExpensesService.getAll(undefined, true).subscribe({
      next: data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar gastos fijos', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  getUserName(userId: string): string {
    return this.users.find(u => u.id === userId)?.name ?? '—';
  }

  getCategoryName(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.name ?? '—';
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('es-PY');
  }

  openCreate(): void {
    const ref = this.dialog.open(FixedExpenseFormDialogComponent, { data: null, width: '500px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: FixedExpenseDto): void {
    const ref = this.dialog.open(FixedExpenseFormDialogComponent, { data: item, width: '500px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(item: FixedExpenseDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Gasto Fijo', message: `¿Eliminar "${item.description}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.fixedExpensesService.delete(item.id).subscribe({
          next: () => {
            this.snackBar.open('Gasto fijo eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
