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
import { XmlParseService } from '../../core/services/xml-parse.service';
import { SharedCommitmentDto, SharingGroupDto } from '../../core/models';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { RowActionsComponent } from '../../shared/components/row-actions/row-actions.component';
import { formatDisplayedAmount } from '../../shared/utils/amount-display.util';

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
    PageHeaderComponent,
    RowActionsComponent
  ],
  templateUrl: './shared-commitments.component.html'
})
export class SharedCommitmentsComponent implements OnInit {
  private sharedCommitmentsService = inject(SharedCommitmentsService);
  private sharingGroupsService = inject(SharingGroupsService);
  private xmlParseService = inject(XmlParseService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  displayedColumns = ['type', 'description', 'categoryName', 'groupName', 'budgetAmount', 'discountAmount', 'grossAmount', 'netAmount', 'isActive', 'actions'];
  loading = signal(false);
  importingXml = signal(false);
  dataSource = new MatTableDataSource<SharedCommitmentDto>([]);
  sharingGroups: SharingGroupDto[] = null as any;
  selectedGroupId: string | null = null;
  searchText = '';

  get total(): number {
    return this.dataSource.data.reduce((sum, row) => sum + row.netAmount, 0);
  }

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.sharingGroupsService.getAll().subscribe(g => this.sharingGroups = g);
  }

  loadData(): void {
    if (!this.selectedGroupId) {
      this.loading.set(false);
      this.dataSource.data = [];
      return;
    }

    this.loading.set(true);
    this.dataSource.data = [];
    this.sharedCommitmentsService.getAll(this.selectedGroupId, true).subscribe({
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

  onGroupChange(): void {
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.loadData();
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  getGroupName(groupId: string): string {
    return (this.sharingGroups ?? []).find(g => g.id === groupId)?.name ?? '—';
  }

  getCommitmentTypeLabel(row: Pick<SharedCommitmentDto, 'isVariableBudget'>): string {
    return row.isVariableBudget ? 'Por categoría' : 'Fijo';
  }

  getBudgetAmount(row: Pick<SharedCommitmentDto, 'isVariableBudget' | 'monthlyBudget' | 'grossAmount'>): number | null {
    return row.isVariableBudget ? (row.monthlyBudget ?? row.grossAmount) : null;
  }

  formatAmount(amount: number): string {
    return formatDisplayedAmount(amount);
  }

  openXmlImport(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      this.importingXml.set(true);
      this.xmlParseService.parseXml(file).subscribe({
        next: invoice => {
          this.importingXml.set(false);
          const ref = this.dialog.open(XmlImportDialogComponent, {
            data: { mode: 'commitment', initialFile: file, initialInvoice: invoice },
            width: '95vw',
            maxWidth: '1100px',
            maxHeight: '95vh'
          });
          ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
        },
        error: () => {
          this.importingXml.set(false);
          this.snackBar.open('Error al procesar el XML', 'Cerrar', { duration: 3000 });
        }
      });
    };
    input.click();
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


