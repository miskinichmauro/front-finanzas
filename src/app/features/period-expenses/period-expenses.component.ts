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
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PeriodExpenseFormDialogComponent } from './period-expense-form-dialog.component';
import { PeriodExpensesService } from '../../core/services/period-expenses.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriesService } from '../../core/services/categories.service';
import { PeriodExpenseDto } from '../../core/models/period-expense.model';
import { UserDto, CategoryDto } from '../../core/models';

@Component({
  selector: 'app-period-expenses',
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
    AppSelectComponent,
    PageHeaderComponent
  ],
  templateUrl: './period-expenses.component.html'
})
export class PeriodExpensesComponent implements OnInit {
  private periodExpensesService = inject(PeriodExpensesService);
  private usersService = inject(UsersService);
  private categoriesService = inject(CategoriesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  displayedColumns = ['description', 'userName', 'amount', 'isPaid', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<PeriodExpenseDto>([]);
  users: UserDto[] = [];
  categories: CategoryDto[] = [];
  searchText = '';

  filterYear = new Date().getFullYear();
  filterMonth = new Date().getMonth() + 1;
  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.usersService.getAll().subscribe(u => this.users = u);
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.dataSource.data = [];
    this.periodExpensesService.getAll(undefined, this.filterYear, this.filterMonth).subscribe({
      next: data => {
        this.dataSource.data = data;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar gastos del período', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  getUserName(userId: string): string {
    return this.users.find(u => u.id === userId)?.name ?? '—';
  }

  get total(): number {
    return this.dataSource.data.reduce((sum, row) => sum + row.amount, 0);
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('es-PY');
  }

  openCreate(): void {
    const ref = this.dialog.open(PeriodExpenseFormDialogComponent, { data: null, width: '600px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: PeriodExpenseDto): void {
    const ref = this.dialog.open(PeriodExpenseFormDialogComponent, { data: item, width: '600px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(item: PeriodExpenseDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Gasto', message: `¿Eliminar "${item.description}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.periodExpensesService.delete(item.id).subscribe({
          next: () => {
            this.snackBar.open('Gasto eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
