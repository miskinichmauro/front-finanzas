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
import { CommerceFormDialogComponent } from './commerce-form-dialog.component';
import { CommercesService } from '../../core/services/commerces.service';
import { CommerceDto } from '../../core/models';

@Component({
  selector: 'app-commerces',
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
  templateUrl: './commerces.component.html'
})
export class CommercesComponent implements OnInit {
  private commercesService = inject(CommercesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['name', 'address', 'isFavorite', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<CommerceDto>([]);

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.commercesService.getAll().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar comercios', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(CommerceFormDialogComponent, { data: null, width: '450px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: CommerceDto): void {
    const ref = this.dialog.open(CommerceFormDialogComponent, { data: item, width: '450px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(item: CommerceDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Comercio', message: `¿Eliminar el comercio "${item.name}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.commercesService.delete(item.id).subscribe({
          next: () => {
            this.snackBar.open('Comercio eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
