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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { IncomeFormDialogComponent } from './income-form-dialog.component';
import { IncomesService } from '../../core/services/incomes.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriesService } from '../../core/services/categories.service';
import { IncomeDto, UserDto, CategoryDto } from '../../core/models';

@Component({
  selector: 'app-incomes',
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
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    PageHeaderComponent
  ],
  templateUrl: './incomes.component.html'
})
export class IncomesComponent implements OnInit {
  private incomesService = inject(IncomesService);
  private usersService = inject(UsersService);
  private categoriesService = inject(CategoriesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['date', 'description', 'userName', 'categoryName', 'amount', 'isRecurring', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<IncomeDto>([]);
  users: UserDto[] = [];
  categories: CategoryDto[] = [];

  filterYear = new Date().getFullYear();
  filterMonth = new Date().getMonth() + 1;
  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  ngOnInit(): void {
    this.usersService.getAll().subscribe(u => this.users = u);
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.incomesService.getAll(this.filterYear, this.filterMonth).subscribe({
      next: data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar ingresos', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  getUserName(userId: string): string {
    return this.users.find(u => u.id === userId)?.name ?? '—';
  }

  getCategoryName(categoryId: string | null): string {
    if (!categoryId) return '—';
    return this.categories.find(c => c.id === categoryId)?.name ?? '—';
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('es-PY');
  }

  openCreate(): void {
    const ref = this.dialog.open(IncomeFormDialogComponent, { data: null, width: '500px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: IncomeDto): void {
    const ref = this.dialog.open(IncomeFormDialogComponent, { data: item, width: '500px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(item: IncomeDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Ingreso', message: `¿Eliminar "${item.description}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.incomesService.delete(item.id).subscribe({
          next: () => {
            this.snackBar.open('Ingreso eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
