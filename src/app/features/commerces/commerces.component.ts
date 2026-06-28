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
    FormsModule,
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

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  displayedColumns = ['name', 'address', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<CommerceDto>([]);
  searchText = '';

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.loadData();
  }


  loadData(): void {
    this.loading.set(true);
    this.dataSource.data = [];
    this.commercesService.getAll().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar comercios', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openCreate(): void {
    const ref = this.dialog.open(CommerceFormDialogComponent, { data: null, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: CommerceDto): void {
    const ref = this.dialog.open(CommerceFormDialogComponent, { data: item, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  toggleFavorite(item: CommerceDto): void {
    const data = [...this.dataSource.data];
    const idx = data.findIndex(c => c.id === item.id);
    if (idx === -1) return;
    data[idx] = { ...item, isFavorite: !item.isFavorite };
    this.dataSource.data = data;

    this.commercesService.update(item.id, {
      name: item.name,
      address: item.address,
      isFavorite: !item.isFavorite
    }).subscribe({
      next: () => {},
      error: () => {
        const reverted = [...this.dataSource.data];
        reverted[idx] = item;
        this.dataSource.data = reverted;
        this.snackBar.open('Error al actualizar favorito', 'Cerrar', { duration: 3000 });
      }
    });
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
