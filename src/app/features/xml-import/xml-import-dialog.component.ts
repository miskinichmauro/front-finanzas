import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { XmlParseService } from '../../core/services/xml-parse.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { SharedCommitmentsService } from '../../core/services/shared-commitments.service';
import { SharingGroupsService } from '../../core/services/sharing-groups.service';
import { CategoriesService } from '../../core/services/categories.service';
import { CommercesService } from '../../core/services/commerces.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { FriendsService } from '../../core/services/friends.service';
import { DebtsService } from '../../core/services/debts.service';
import { AuthService } from '../../core/services/auth.service';
import {
  XmlInvoiceDto,
  SharingGroupDto, SharingGroupMemberDto,
  CategoryDto, CommerceDto, PaymentMethodDto
} from '../../core/models';
import { FriendDto } from '../../core/models/friend.model';

export interface XmlImportDialogData {
  mode: 'transaction' | 'commitment';
}

interface FriendColumn {
  userId: string;
  name: string;
  collectorUserId: string;
  splits: number[];
}

@Component({
  selector: 'app-xml-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppSelectComponent
  ],
  templateUrl: './xml-import-dialog.component.html',
  styleUrl: './xml-import-dialog.component.scss'
})
export class XmlImportDialogComponent implements OnInit {
  private readonly http                 = inject(HttpClient);
  private readonly xmlParseService      = inject(XmlParseService);
  private readonly transactionsService  = inject(TransactionsService);
  private readonly commitmentsService   = inject(SharedCommitmentsService);
  private readonly sharingGroupsService = inject(SharingGroupsService);
  private readonly categoriesService    = inject(CategoriesService);
  private readonly commercesService     = inject(CommercesService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly friendsService       = inject(FriendsService);
  private readonly debtsService         = inject(DebtsService);
  private readonly auth                 = inject(AuthService);
  private readonly snackBar             = inject(MatSnackBar);
  private readonly dialogRef            = inject(MatDialogRef<XmlImportDialogComponent>);
  readonly data = inject<XmlImportDialogData>(MAT_DIALOG_DATA);

  parsing     = signal(false);
  saving      = signal(false);
  downloading = signal(false);

  invoice: XmlInvoiceDto | null = null;
  selectedFile: File | null = null;

  sharingGroups: SharingGroupDto[] = [];
  selectedGroupId: string | null = null;
  members: SharingGroupMemberDto[] = [];
  paidByUserId: string | null = null;

  groupSplits: number[] = [];
  groupPercents: number[] = [];

  allFriends: (FriendDto & { displayName: string })[] = [];
  friendColumns: FriendColumn[] = [];
  friendPickerValue: string | null = null;

  categories:     (CategoryDto & { displayName: string })[] = [];
  commerces:      (CommerceDto & { displayName: string })[] = [];
  paymentMethods: (PaymentMethodDto & { displayName: string })[] = [];
  selectedCommerceId:      string | null = null;
  selectedCategoryId:      string | null = null;
  selectedPaymentMethodId: string | null = null;

  get isTransaction(): boolean { return this.data.mode === 'transaction'; }
  get selectedGroup(): SharingGroupDto | null {
    return this.sharingGroups.find(g => g.id === this.selectedGroupId) ?? null;
  }

  get canCreate(): boolean {
    if (!this.invoice) return false;
    if (this.isTransaction) return !!this.selectedCategoryId && !!this.selectedPaymentMethodId;
    return !!this.selectedGroupId && !!this.selectedCategoryId && !!this.paidByUserId;
  }

  get memberOptions(): { id: string; name: string }[] {
    return this.members.map(m => ({ id: m.userId, name: m.userName }));
  }

  get availableFriendsToAdd(): (FriendDto & { displayName: string })[] {
    const addedIds = new Set(this.friendColumns.map(f => f.userId));
    return this.allFriends.filter(f => !addedIds.has(f.friendUserId));
  }

  ngOnInit(): void {
    this.sharingGroupsService.getAll(false).subscribe(g => this.sharingGroups = g);
    this.categoriesService.getAll().subscribe(c =>
      this.categories = c.map(x => ({ ...x, displayName: x.name })));
    this.commercesService.getAll().subscribe(c =>
      this.commerces = c.map(x => ({
        ...x,
        displayName: x.address ? `${x.name} - ${x.address}` : x.name
      })));
    this.paymentMethodsService.getAll().subscribe(p =>
      this.paymentMethods = p.map(m => ({
        ...m,
        displayName: [m.name, m.lastDigits || null, m.bankName || null].filter(Boolean).join(' - ')
      })));
    this.friendsService.getMyFriends().subscribe(friends =>
      this.allFriends = friends.map(f => ({ ...f, displayName: f.friendName })));
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.invoice = null;
    this.groupSplits = [];
    this.groupPercents = [];
    this.friendColumns.forEach(fc => fc.splits = []);
    if (file) this.parseFile();
  }

  parseFile(): void {
    if (!this.selectedFile) return;
    this.parsing.set(true);
    this.xmlParseService.parseXml(this.selectedFile).subscribe({
      next: inv => {
        this.invoice = inv;
        this.initSplits();
        this.parsing.set(false);
      },
      error: () => {
        this.snackBar.open('Error al procesar el XML', 'Cerrar', { duration: 3000 });
        this.parsing.set(false);
      }
    });
  }

  onGroupChange(): void {
    const group = this.sharingGroups.find(g => g.id === this.selectedGroupId) ?? null;
    this.members = group?.members ?? [];
    this.paidByUserId = this.members.length === 1 ? this.members[0].userId : null;
    this.initSplits();
  }

  private initSplits(): void {
    const itemCount = this.invoice?.items.length ?? 0;
    this.groupSplits  = new Array(itemCount).fill(0);
    this.groupPercents = new Array(this.members.length > 0 ? 1 : 0).fill(0);
    this.friendColumns.forEach(fc => { fc.splits = new Array(itemCount).fill(0); });
  }

  onFriendSelected(friendUserId: string | null): void {
    if (!friendUserId) return;
    const friend = this.allFriends.find(f => f.friendUserId === friendUserId);
    if (!friend) return;

    const itemCount = this.invoice?.items.length ?? 0;
    this.friendColumns.push({
      userId:          friend.friendUserId,
      name:            friend.friendName,
      collectorUserId: this.members[0]?.userId ?? '',
      splits:          new Array(itemCount).fill(0)
    });
    this.friendPickerValue = null;
  }

  removeFriend(userId: string): void {
    this.friendColumns = this.friendColumns.filter(f => f.userId !== userId);
  }

  getGroupSplit(i: number): number  { return this.groupSplits[i] ?? 0; }
  getFriendSplit(fc: FriendColumn, i: number): number { return fc.splits[i] ?? 0; }

  formatSplit(val: number): string {
    return val > 0 ? Math.round(val).toLocaleString('es-PY') : '';
  }

  onGroupSplitInput(i: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const num = this.parseAndFormatInput(input);
    this.groupSplits[i] = num;
  }

  onFriendSplitInput(fc: FriendColumn, i: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const num = this.parseAndFormatInput(input);
    fc.splits[i] = num;
  }

  private parseAndFormatInput(input: HTMLInputElement): number {
    const raw = input.value;
    const pos = input.selectionStart ?? raw.length;
    const digitsAfterCursor = (raw.substring(pos).match(/\d/g) ?? []).length;
    const stripped = raw.replace(/\./g, '').replace(/[^\d]/g, '');
    const num = stripped === '' ? 0 : parseInt(stripped, 10);
    const formatted = num > 0 ? num.toLocaleString('es-PY') : '';
    input.value = formatted;
    let cursor = formatted.length;
    if (digitsAfterCursor > 0) {
      let count = 0;
      for (let k = formatted.length - 1; k >= 0; k--) {
        if (/\d/.test(formatted[k])) {
          count++;
          if (count === digitsAfterCursor) { cursor = k; break; }
        }
      }
    }
    input.setSelectionRange(cursor, cursor);
    return num;
  }

  onGroupPercentInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const percent = Math.max(0, Math.min(100, parseFloat(input.value) || 0));
    if (!this.invoice) return;
    this.invoice.items.forEach((item, i) => {
      this.groupSplits[i] = Math.round(item.total * percent / 100);
    });
  }

  onFriendPercentInput(fc: FriendColumn, event: Event): void {
    const input = event.target as HTMLInputElement;
    const percent = Math.max(0, Math.min(100, parseFloat(input.value) || 0));
    if (!this.invoice) return;
    this.invoice.items.forEach((item, i) => {
      fc.splits[i] = Math.round(item.total * percent / 100);
    });
  }

  assignGroupAll(): void {
    if (!this.invoice) return;
    const alreadyAll = this.invoice.items.every((item, i) => this.getGroupSplit(i) === item.total);
    this.invoice.items.forEach((item, i) => {
      this.groupSplits[i] = alreadyAll ? 0 : item.total;
    });
  }

  assignFriendAll(fc: FriendColumn): void {
    if (!this.invoice) return;
    const alreadyAll = this.invoice.items.every((item, i) => this.getFriendSplit(fc, i) === item.total);
    this.invoice.items.forEach((item, i) => {
      fc.splits[i] = alreadyAll ? 0 : item.total;
    });
  }

  assignGroupItem(i: number): void {
    if (!this.invoice) return;
    this.groupSplits[i] = this.invoice.items[i].total;
    this.friendColumns.forEach(fc => { fc.splits[i] = 0; });
  }

  assignFriendItem(fc: FriendColumn, i: number): void {
    if (!this.invoice) return;
    fc.splits[i] = this.invoice.items[i].total;
    this.groupSplits[i] = 0;
    this.friendColumns.filter(f => f !== fc).forEach(f => { f.splits[i] = 0; });
  }

  splitEquallyByQuantity(i: number): void {
    if (!this.invoice) return;
    const item = this.invoice.items[i];
    const qty = item.cantidad;
    if (!qty || qty <= 0) return;
    const unitPrice = item.total / qty;

    const columns = [
      { qty: Math.round(this.getGroupSplit(i) / unitPrice), isGroup: true, fc: null as FriendColumn | null },
      ...this.friendColumns.map(fc => ({
        qty: Math.round(this.getFriendSplit(fc, i) / unitPrice),
        isGroup: false,
        fc
      }))
    ];

    const hasAny = columns.some(c => c.qty > 0);
    if (!hasAny) return;

    columns.forEach(c => {
      const amount = Math.round(c.qty * unitPrice);
      if (c.isGroup) this.groupSplits[i] = amount;
      else if (c.fc) c.fc.splits[i] = amount;
    });
  }

  clearAll(): void {
    this.initSplits();
  }

  getRemainder(i: number): number {
    if (!this.invoice) return 0;
    const item = this.invoice.items[i];
    const assigned = this.getGroupSplit(i) + this.friendColumns.reduce((s, fc) => s + this.getFriendSplit(fc, i), 0);
    return item.total - assigned;
  }

  getGroupTotal(): number {
    return this.groupSplits.reduce((s, v) => s + v, 0);
  }

  getFriendTotal(fc: FriendColumn): number {
    return fc.splits.reduce((s, v) => s + v, 0);
  }

  formatAmount(n: number): string {
    return Math.round(n).toLocaleString('es-PY');
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return iso; }
  }

  createTransaction(): void {
    if (!this.invoice || !this.canCreate || this.saving()) return;
    this.saving.set(true);

    const userId = this.auth.currentUser()?.userId;
    if (!userId) { this.saving.set(false); return; }

    const dateStr = this.invoice.fechaEmision
      ? new Date(this.invoice.fechaEmision).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const dto = {
      date:            dateStr,
      userId,
      commerceId:      this.selectedCommerceId!,
      categoryId:      this.selectedCategoryId!,
      paymentMethodId: this.selectedPaymentMethodId!,
      grossAmount:     this.invoice.totalGeneral,
      netAmount:       this.invoice.totalGeneral,
      invoiceId:       this.invoice.invoiceId,
      notes:           `Importado desde: ${this.invoice.emisor}`
    };

    this.transactionsService.create(dto).subscribe({
      next: result => {
        this.snackBar.open('Transacción creada', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: () => {
        this.snackBar.open('Error al crear la transacción', 'Cerrar', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  createCommitment(): void {
    if (!this.invoice || !this.canCreate || this.saving()) return;
    this.saving.set(true);

    const dateStr = this.invoice.fechaEmision
      ? new Date(this.invoice.fechaEmision).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const groupTotal = this.getGroupTotal() || this.invoice.totalGeneral;

    const commitmentDto = {
      sharingGroupId:  this.selectedGroupId!,
      date:            dateStr,
      description:     this.invoice.emisor,
      categoryId:      this.selectedCategoryId!,
      commerceId:      this.selectedCommerceId || undefined,
      paymentMethodId: this.selectedPaymentMethodId || undefined,
      paidByUserId:    this.paidByUserId!,
      grossAmount:     groupTotal,
      discountPercent: 0,
      isActive:        true,
      notes:           `Importado desde XML · CDC: ${this.invoice.invoiceId}`
    };

    const debtDtos = this.friendColumns
      .filter(fc => this.getFriendTotal(fc) > 0)
      .map(fc => ({
        creditorUserId: fc.collectorUserId,
        debtorUserId:   fc.userId,
        amount:         this.getFriendTotal(fc),
        description:    this.invoice!.emisor,
        date:           dateStr
      }));

    const commitment$ = this.commitmentsService.create(commitmentDto);
    const debts$ = debtDtos.map(d => this.debtsService.create(d));

    forkJoin([commitment$, ...debts$]).subscribe({
      next: ([commitment]) => {
        const debtCount = debts$.length;
        const msg = debtCount > 0
          ? `Compromiso creado + ${debtCount} deuda${debtCount > 1 ? 's' : ''} registrada${debtCount > 1 ? 's' : ''}`
          : 'Compromiso creado';
        this.snackBar.open(msg, 'Cerrar', { duration: 3500 });
        this.dialogRef.close(commitment);
      },
      error: () => {
        this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  downloadExcel(): void {
    if (!this.selectedFile || this.downloading()) return;
    this.downloading.set(true);
    const form = new FormData();
    form.append('File', this.selectedFile);
    this.http.post(`${environment.apiUrl}/xml-to-excel`, form, { responseType: 'blob', observe: 'response' })
      .subscribe({
        next: response => {
          const blob = response.body!;
          const disposition = response.headers.get('content-disposition') ?? '';
          const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
          const filename = match ? match[1].replace(/['"]/g, '') : 'factura.xlsx';
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          this.downloading.set(false);
        },
        error: () => {
          this.snackBar.open('Error al generar el Excel', 'Cerrar', { duration: 3000 });
          this.downloading.set(false);
        }
      });
  }
}
