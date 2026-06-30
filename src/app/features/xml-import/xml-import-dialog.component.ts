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
import { AppMultiSelectComponent } from '../../shared/components/app-multi-select/app-multi-select.component';
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
  initialFile?: File | null;
  initialInvoice?: XmlInvoiceDto | null;
}

interface FriendColumn {
  userId: string;
  name: string;
  collectorUserId: string;
  splits: number[];
}

interface MemberOption {
  id: string;
  name: string;
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
    AppSelectComponent,
    AppMultiSelectComponent
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

  sharingGroups: SharingGroupDto[] = null as any;
  selectedGroupId: string | null = null;
  members: SharingGroupMemberDto[] = null as any;
  paidByUserId: string | null = null;

  groupSplits: number[] = [];
  groupPercents: number[] = [];

  allFriends: (FriendDto & { displayName: string })[] = null as any;
  friendColumns: FriendColumn[] = [];
  friendPickerValues: string[] = [];

  categories:     (CategoryDto & { displayName: string })[] = null as any;
  commerces:      (CommerceDto & { displayName: string })[] = null as any;
  paymentMethods: (PaymentMethodDto & { displayName: string })[] = null as any;
  selectedCommerceId:      string | null = null;
  selectedCategoryId:      string | null = null;
  selectedPaymentMethodId: string | null = null;
  discountPercent:         number = 0;

  get isTransaction(): boolean { return this.data.mode === 'transaction'; }
  get selectedGroup(): SharingGroupDto | null {
    return (this.sharingGroups ?? []).find(g => g.id === this.selectedGroupId) ?? null;
  }

  get allItemsFullyAssigned(): boolean {
    if (!this.invoice) return false;
    return this.invoice.items.every((_, i) => this.getRemainder(i) === 0);
  }

  get canCreate(): boolean {
    if (!this.invoice) return false;
    if (this.isTransaction) return !!this.selectedCategoryId && !!this.selectedPaymentMethodId;
    return !!this.selectedGroupId && !!this.selectedCategoryId && !!this.paidByUserId && this.allItemsFullyAssigned;
  }

  get currentUserOption(): MemberOption | null {
    const user = this.auth.currentUser();
    if (!user) return null;

    return {
      id: user.userId,
      name: user.userName
    };
  }

  get memberOptions(): MemberOption[] {
    const options = (this.members ?? []).map(m => ({ id: m.userId, name: m.userName }));
    const currentUser = this.currentUserOption;

    if (!currentUser || options.some(option => option.id === currentUser.id)) {
      return options;
    }

    return [currentUser, ...options];
  }

  get availableFriendsToAdd(): (FriendDto & { displayName: string })[] {
    const addedIds = new Set(this.friendColumns.map(f => f.userId));
    const memberIds = new Set((this.members ?? []).map(member => member.userId));

    return (this.allFriends ?? []).filter(friend =>
      !addedIds.has(friend.friendUserId) &&
      !memberIds.has(friend.friendUserId)
    );
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

    if (this.data.initialInvoice) {
      this.selectedFile = this.data.initialFile ?? null;
      this.invoice = this.data.initialInvoice;
      this.initSplits();
    } else if (this.data.initialFile) {
      this.selectedFile = this.data.initialFile;
      this.parseFile();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file && !this.invoice) {
      this.dialogRef.close(false);
      return;
    }

    this.selectedFile = file;
    this.invoice = null;
    this.groupSplits = [];
    this.groupPercents = [];
    this.friendColumns.forEach(fc => fc.splits = []);
    if (file) this.parseFile();
  }

  openFilePicker(fileInput: HTMLInputElement): void {
    fileInput.click();
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
    const group = (this.sharingGroups ?? []).find(g => g.id === this.selectedGroupId) ?? null;
    this.members = group?.members ?? [];
    const memberIds = new Set((this.members ?? []).map(member => member.userId));
    this.friendColumns = this.friendColumns.filter(friend => !memberIds.has(friend.userId));

    this.friendPickerValues = this.friendPickerValues.filter(friendUserId => !memberIds.has(friendUserId));

    const availableMemberIds = new Set(this.memberOptions.map(option => option.id));

    if (!this.paidByUserId || !availableMemberIds.has(this.paidByUserId)) {
      this.paidByUserId = this.currentUserOption?.id
        ?? this.members[0]?.userId
        ?? null;
    }
    this.initSplits();
  }

  private initSplits(): void {
    const itemCount = this.invoice?.items.length ?? 0;
    this.groupSplits  = new Array(itemCount).fill(0);
    this.groupPercents = new Array((this.members ?? []).length > 0 ? 1 : 0).fill(0);
    this.friendColumns.forEach(fc => { fc.splits = new Array(itemCount).fill(0); });
  }

  onFriendsSelected(friendUserIds: string[]): void {
    if (friendUserIds.length === 0) return;

    const existingIds = new Set(this.friendColumns.map(friend => friend.userId));
    const itemCount = this.invoice?.items.length ?? 0;

    for (const friendUserId of friendUserIds) {
      if (existingIds.has(friendUserId)) continue;

      const friend = (this.allFriends ?? []).find(f => f.friendUserId === friendUserId);
      if (!friend) continue;

      this.friendColumns.push({
        userId: friend.friendUserId,
        name: friend.friendName,
        collectorUserId: this.paidByUserId ?? this.currentUserOption?.id ?? this.memberOptions[0]?.id ?? '',
        splits: new Array(itemCount).fill(0)
      });

      existingIds.add(friendUserId);
    }

    this.friendPickerValues = [];
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

  onGroupQuantityInput(i: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.groupSplits[i] = this.parseQuantityAndResolveAmount(i, input);
  }

  onFriendQuantityInput(fc: FriendColumn, i: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    fc.splits[i] = this.parseQuantityAndResolveAmount(i, input);
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

  private parseQuantityAndResolveAmount(i: number, input: HTMLInputElement): number {
    if (!this.invoice) return 0;

    const raw = input.value.replace(',', '.');
    const qty = Math.max(0, Number.parseFloat(raw) || 0);
    const maxQty = Math.max(0, this.invoice.items[i].cantidad || 0);
    const normalizedQty = Math.min(qty, maxQty);
    input.value = normalizedQty > 0 ? this.formatQuantity(normalizedQty) : '';

    const unitPrice = this.getItemUnitPrice(i);
    return unitPrice > 0 ? Math.round(unitPrice * normalizedQty) : 0;
  }

  getItemUnitPrice(i: number): number {
    if (!this.invoice) return 0;
    const item = this.invoice.items[i];
    return item.cantidad > 0 ? item.total / item.cantidad : 0;
  }

  getGroupQuantity(i: number): string {
    return this.formatQuantityFromAmount(this.getGroupSplit(i), i);
  }

  getFriendQuantity(fc: FriendColumn, i: number): string {
    return this.formatQuantityFromAmount(this.getFriendSplit(fc, i), i);
  }

  private formatQuantityFromAmount(amount: number, i: number): string {
    const unitPrice = this.getItemUnitPrice(i);
    if (!unitPrice || amount <= 0) return '';

    return this.formatQuantity(amount / unitPrice);
  }

  private formatQuantity(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '');
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
    this.selectedGroupId = this.isTransaction ? null : null;
    this.members = [];
    this.paidByUserId = null;
    this.friendColumns = [];
    this.friendPickerValues = [];
    this.initSplits();
  }

  clearGroupItemOnCtrl(i: number, event: MouseEvent): void {
    if (!event.ctrlKey) return;
    event.preventDefault();
    this.groupSplits[i] = 0;
  }

  clearFriendItemOnCtrl(fc: FriendColumn, i: number, event: MouseEvent): void {
    if (!event.ctrlKey) return;
    event.preventDefault();
    fc.splits[i] = 0;
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

  getPreviewBaseAmount(): number {
    if (!this.invoice) return 0;
    return this.isTransaction ? this.invoice.totalGeneral : (this.getGroupTotal() || this.invoice.totalGeneral);
  }

  getPreviewDiscountAmount(): number {
    return Math.round(this.getPreviewBaseAmount() * this.discountPercent / 100);
  }

  getPreviewNetAmount(): number {
    return this.getPreviewBaseAmount() - this.getPreviewDiscountAmount();
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
      discountPercent: this.discountPercent,
      discountAmount:  Math.round(this.invoice.totalGeneral * this.discountPercent / 100),
      netAmount:       Math.round(this.invoice.totalGeneral * (1 - this.discountPercent / 100)),
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
      discountPercent: this.discountPercent,
      isActive:        true,
      notes:           `Importado desde XML · CDC: ${this.invoice.invoiceId}`
    };

    const discountFactor = 1 - this.discountPercent / 100;

    const debtDtos = this.friendColumns
      .filter(fc => this.getFriendTotal(fc) > 0)
      .map(fc => ({
        creditorUserId: fc.collectorUserId || this.paidByUserId!,
        debtorUserId:   fc.userId,
        amount:         Math.round(this.getFriendTotal(fc) * discountFactor),
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
