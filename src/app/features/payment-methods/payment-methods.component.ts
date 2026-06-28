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
import { PaymentMethodFormDialogComponent } from './payment-method-form-dialog.component';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { PaymentMethodDto } from '../../core/models';

@Component({
  selector: 'app-payment-methods',
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
  templateUrl: './payment-methods.component.html'
})
export class PaymentMethodsComponent implements OnInit {
  private paymentMethodsService = inject(PaymentMethodsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  displayedColumns = ['name', 'type', 'bankName', 'lastDigits', 'isActive', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<PaymentMethodDto>([]);
  searchText = '';

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.loadData();
  }


  loadData(): void {
    this.loading.set(true);
    this.dataSource.data = [];
    this.paymentMethodsService.getAll().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar medios de pago', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openCreate(): void {
    const ref = this.dialog.open(PaymentMethodFormDialogComponent, { data: null, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: PaymentMethodDto): void {
    const ref = this.dialog.open(PaymentMethodFormDialogComponent, { data: item, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(item: PaymentMethodDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Medio de Pago', message: `¿Eliminar "${item.name}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.paymentMethodsService.delete(item.id).subscribe({
          next: () => {
            this.snackBar.open('Medio de pago eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
