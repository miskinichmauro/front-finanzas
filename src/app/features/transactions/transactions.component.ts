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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { TransactionFormDialogComponent } from './transaction-form-dialog.component';
import { TransactionsService } from '../../core/services/transactions.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriesService } from '../../core/services/categories.service';
import { CommercesService } from '../../core/services/commerces.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { TransactionDto, UserDto, CategoryDto, CommerceDto, PaymentMethodDto } from '../../core/models';

@Component({
  selector: 'app-transactions',
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
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    PageHeaderComponent
  ],
  templateUrl: './transactions.component.html'
})
export class TransactionsComponent implements OnInit {
  private transactionsService = inject(TransactionsService);
  private usersService = inject(UsersService);
  private categoriesService = inject(CategoriesService);
  private commercesService = inject(CommercesService);
  private paymentMethodsService = inject(PaymentMethodsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['date', 'commerceName', 'categoryName', 'userName', 'grossAmount', 'netAmount', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<TransactionDto>([]);

  users: UserDto[] = [];
  categories: CategoryDto[] = [];
  commerces: CommerceDto[] = [];
  paymentMethods: PaymentMethodDto[] = [];

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
    this.commercesService.getAll().subscribe(c => this.commerces = c);
    this.paymentMethodsService.getAll().subscribe(p => this.paymentMethods = p);
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.transactionsService.getAll({ year: this.filterYear, month: this.filterMonth }).subscribe({
      next: data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar transacciones', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  getUserName(userId: string): string {
    return this.users.find(u => u.id === userId)?.name ?? '—';
  }

  getCategoryName(id: string | null): string {
    if (!id) return '—';
    return this.categories.find(c => c.id === id)?.name ?? '—';
  }

  getCommerceName(id: string | null): string {
    if (!id) return '—';
    return this.commerces.find(c => c.id === id)?.name ?? '—';
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('es-PY');
  }

  openCreate(): void {
    const ref = this.dialog.open(TransactionFormDialogComponent, { data: null, width: '600px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: TransactionDto): void {
    const ref = this.dialog.open(TransactionFormDialogComponent, { data: item, width: '600px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(item: TransactionDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Transacción', message: `¿Eliminar esta transacción?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.transactionsService.delete(item.id).subscribe({
          next: () => {
            this.snackBar.open('Transacción eliminada', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
