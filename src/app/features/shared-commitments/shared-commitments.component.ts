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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SharedCommitmentFormDialogComponent } from './shared-commitment-form-dialog.component';
import { SharedCommitmentsService } from '../../core/services/shared-commitments.service';
import { SharingGroupsService } from '../../core/services/sharing-groups.service';
import { SharedCommitmentDto, SharingGroupDto } from '../../core/models';

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
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    PageHeaderComponent
  ],
  templateUrl: './shared-commitments.component.html'
})
export class SharedCommitmentsComponent implements OnInit {
  private sharedCommitmentsService = inject(SharedCommitmentsService);
  private sharingGroupsService = inject(SharingGroupsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['description', 'section', 'groupName', 'amount', 'isActive', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<SharedCommitmentDto>([]);
  sharingGroups: SharingGroupDto[] = [];
  selectedGroupId = '';

  ngOnInit(): void {
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
    const groupId = this.selectedGroupId || undefined;
    this.sharedCommitmentsService.getAll(groupId, undefined, true).subscribe({
      next: data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar compromisos', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  getGroupName(groupId: string): string {
    return this.sharingGroups.find(g => g.id === groupId)?.name ?? '—';
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('es-PY');
  }

  openCreate(): void {
    const ref = this.dialog.open(SharedCommitmentFormDialogComponent, { data: null, width: '550px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: SharedCommitmentDto): void {
    const ref = this.dialog.open(SharedCommitmentFormDialogComponent, { data: item, width: '550px' });
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
