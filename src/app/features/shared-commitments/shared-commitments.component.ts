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
import { SharedCommitmentFormDialogComponent } from './shared-commitment-form-dialog.component';
import { XmlImportDialogComponent } from '../xml-import/xml-import-dialog.component';
import { SharedCommitmentsService } from '../../core/services/shared-commitments.service';
import { SharingGroupsService } from '../../core/services/sharing-groups.service';
import { SharedCommitmentDto, SharingGroupDto } from '../../core/models';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';

@Component({
  selector: 'app-shared-commitments',
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
  templateUrl: './shared-commitments.component.html'
})
export class SharedCommitmentsComponent implements OnInit {
  private sharedCommitmentsService = inject(SharedCommitmentsService);
  private sharingGroupsService = inject(SharingGroupsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  displayedColumns = ['description', 'categoryName', 'groupName', 'amount', 'isActive', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<SharedCommitmentDto>([]);
  sharingGroups: SharingGroupDto[] = [];
  selectedGroupId = '';
  searchText = '';

  get total(): number {
    return this.dataSource.data.reduce((sum, row) => sum + row.netAmount, 0);
  }

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.sharingGroupsService.getAll().subscribe(g => {
      this.sharingGroups = g;
      if (g.length > 0) {
        this.selectedGroupId = g[0].id;
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.dataSource.data = [];
    const groupId = this.selectedGroupId || undefined;
    this.sharedCommitmentsService.getAll(groupId, true).subscribe({
      next: data => {
        this.dataSource.data = data;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar compromisos', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  getGroupName(groupId: string): string {
    return this.sharingGroups.find(g => g.id === groupId)?.name ?? '—';
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('es-PY');
  }

  openXmlImport(): void {
    this.dialog.open(XmlImportDialogComponent, {
      data: { mode: 'commitment' },
      width: '95vw',
      maxWidth: '1100px',
      maxHeight: '95vh'
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(SharedCommitmentFormDialogComponent, { data: null, width: '600px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: SharedCommitmentDto): void {
    const ref = this.dialog.open(SharedCommitmentFormDialogComponent, { data: item, width: '600px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(item: SharedCommitmentDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Compromiso', message: `¿Eliminar "${item.description}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sharedCommitmentsService.delete(item.id).subscribe({
          next: () => {
            this.snackBar.open('Compromiso eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
