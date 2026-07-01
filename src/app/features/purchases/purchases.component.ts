import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PurchaseFormDialogComponent } from './purchase-form-dialog.component';
import { PurchasesService } from '../../core/services/purchases.service';
import { PurchaseDto, PurchaseInstallmentDto } from '../../core/models';
import { formatDisplayedAmount } from '../../shared/utils/amount-display.util';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderComponent
  ],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.scss'
})
export class PurchasesComponent implements OnInit {
  private purchasesService = inject(PurchasesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  purchases = signal<PurchaseDto[]>([]);
  installmentsMap = signal<Record<string, PurchaseInstallmentDto[]>>({});
  loadingInstallments = new Set<string>();
  searchText = '';

  get filtered(): PurchaseDto[] {
    const f = this.searchText.toLowerCase();
    return this.purchases().filter(p =>
      !f || p.name.toLowerCase().includes(f)
    );
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.purchasesService.getAll().subscribe({
      next: purchases => { this.purchases.set(purchases); this.loading.set(false); },
      error: () => { this.snackBar.open('Error al cargar', 'Cerrar', { duration: 3000 }); this.loading.set(false); }
    });
  }

  loadInstallments(purchaseId: string): void {
    if (this.installmentsMap()[purchaseId] || this.loadingInstallments.has(purchaseId)) return;
    this.loadingInstallments.add(purchaseId);
    this.purchasesService.getInstallments(purchaseId).subscribe({
      next: items => {
        this.installmentsMap.update(m => ({ ...m, [purchaseId]: items }));
        this.loadingInstallments.delete(purchaseId);
      },
      error: () => this.loadingInstallments.delete(purchaseId)
    });
  }

  toggleInstallment(purchase: PurchaseDto, inst: PurchaseInstallmentDto): void {
    const newPaid = !inst.isPaid;
    this.purchasesService.updateInstallment(purchase.id, inst.id, { isPaid: newPaid }).subscribe({
      next: updated => {
        this.installmentsMap.update(m => ({
          ...m,
          [purchase.id]: m[purchase.id].map(i => i.id === updated.id ? updated : i)
        }));
        const delta = updated.isPaid ? 1 : -1;
        this.purchases.update(list => list.map(p => p.id !== purchase.id ? p : {
          ...p,
          paidInstallments: p.paidInstallments + delta,
          pendingInstallments: p.pendingInstallments - delta,
          remainingBalance: p.remainingBalance + (updated.isPaid ? -p.netPerInstallment : p.netPerInstallment)
        }));
      },
      error: () => this.snackBar.open('Error al actualizar cuota', 'Cerrar', { duration: 3000 })
    });
  }

  openCreate(): void {
    this.dialog.open(PurchaseFormDialogComponent, { data: null, width: '620px' })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(purchase: PurchaseDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(PurchaseFormDialogComponent, { data: purchase, width: '620px' })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openDelete(purchase: PurchaseDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(ConfirmDialogComponent, { data: { message: `¿Desactivar "${purchase.name}"?` } })
      .afterClosed().subscribe(ok => {
        if (!ok) return;
        this.purchasesService.delete(purchase.id).subscribe({
          next: () => { this.snackBar.open('Desactivado', 'Cerrar', { duration: 3000 }); this.load(); },
          error: () => this.snackBar.open('Error al desactivar', 'Cerrar', { duration: 3000 })
        });
      });
  }

  progress(p: PurchaseDto): number {
    return p.totalInstallments === 0 ? 0 : Math.round((p.paidInstallments / p.totalInstallments) * 100);
  }

  fmt(amount: number): string {
    return formatDisplayedAmount(amount);
  }

  fmtDate(date: string): string {
    if (!date) return '—';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  }

  installmentsFor(purchaseId: string): PurchaseInstallmentDto[] {
    return this.installmentsMap()[purchaseId] ?? [];
  }

  isLoadingInst(purchaseId: string): boolean {
    return this.loadingInstallments.has(purchaseId) && !this.installmentsMap()[purchaseId];
  }
}
