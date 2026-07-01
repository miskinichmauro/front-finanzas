import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { ThousandsDirective } from '../../shared/directives/thousands.directive';
import { PurchasesService } from '../../core/services/purchases.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { PurchaseDto, PaymentMethodDto } from '../../core/models';

@Component({
  selector: 'app-purchase-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    AppSelectComponent,
    ThousandsDirective
  ],
  templateUrl: './purchase-form-dialog.component.html',
  styles: [`
    .discount-row {
      display: flex;
      gap: calc(6px * var(--ui-scale));
      align-items: center;
    }
    .type-toggle {
      display: flex;
      border: 1.5px solid var(--border-input);
      border-radius: calc(8px * var(--ui-scale));
      overflow: hidden;
      flex-shrink: 0;
      height: calc(30px * var(--ui-scale));
      button {
        width: calc(34px * var(--ui-scale));
        padding: 0;
        border: none;
        background: var(--bg-input);
        font-size: calc(11px * var(--ui-scale));
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        height: 100%;
        &.active {
          background: #6366f1;
          color: #fff;
        }
      }
    }
    .discount-row input {
      flex: 1;
      padding: calc(6px * var(--ui-scale)) calc(10px * var(--ui-scale));
      min-height: calc(30px * var(--ui-scale));
      border: 1.5px solid var(--border-input);
      border-radius: calc(8px * var(--ui-scale));
      font-size: calc(11.5px * var(--ui-scale));
      font-family: Roboto, "Helvetica Neue", sans-serif;
      color: var(--text-primary);
      background: var(--bg-input);
      outline: none;
      box-sizing: border-box;
      width: 100%;
      &:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      }
    }
  `]
})
export class PurchaseFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly purchasesService = inject(PurchasesService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly dialogRef = inject(MatDialogRef<PurchaseFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  data = inject<PurchaseDto | null>(MAT_DIALOG_DATA);

  paymentMethods: PaymentMethodDto[] = [];
  discountType = signal<'gs' | 'pct'>('gs');

  form = this.fb.group({
    name: ['', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(1)]],
    discountAmount: [0, [Validators.min(0)]],
    discountPct: [0, [Validators.min(0), Validators.max(100)]],
    totalInstallments: [1, [Validators.required, Validators.min(1)]],
    dueDay: [10, [Validators.required, Validators.min(1), Validators.max(28)]],
    paymentMethodId: [null as string | null],
    notes: [''],
    isActive: [true]
  });

  private readonly totalAmount = signal(0);
  private readonly discountAmountGs = signal(0);
  private readonly discountPctVal = signal(0);
  private readonly totalInstallments = signal(1);

  readonly discountAmount = computed(() =>
    this.discountType() === 'gs'
      ? this.discountAmountGs()
      : Math.round(this.totalAmount() * this.discountPctVal() / 100)
  );

  readonly installmentAmount = computed(() => {
    const n = this.totalInstallments();
    return n > 0 ? this.totalAmount() / n : 0;
  });

  readonly discountPerInstallment = computed(() => {
    const n = this.totalInstallments();
    return n > 0 ? this.discountAmount() / n : 0;
  });

  readonly netPerInstallment = computed(() => this.installmentAmount() - this.discountPerInstallment());

  get isEdit(): boolean { return !!this.data; }

  setDiscountType(type: 'gs' | 'pct'): void {
    if (type === this.discountType()) return;
    if (type === 'pct' && this.totalAmount() > 0) {
      const pct = Math.round((this.discountAmountGs() / this.totalAmount()) * 1000) / 10;
      this.form.patchValue({ discountPct: pct });
    } else if (type === 'gs') {
      this.form.patchValue({ discountAmount: Math.round(this.totalAmount() * this.discountPctVal() / 100) });
    }
    this.discountType.set(type);
  }

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(v => {
      this.totalAmount.set(Number(v.totalAmount) || 0);
      this.discountAmountGs.set(Number(v.discountAmount) || 0);
      this.discountPctVal.set(Number(v.discountPct) || 0);
      this.totalInstallments.set(Number(v.totalInstallments) || 1);
    });
  }

  ngOnInit(): void {
    this.paymentMethodsService.getAll().subscribe(pm => this.paymentMethods = pm);

    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        totalAmount: this.data.totalAmount,
        discountAmount: this.data.discountAmount,
        totalInstallments: this.data.totalInstallments,
        dueDay: this.data.dueDay,
        paymentMethodId: this.data.paymentMethodId ?? null,
        notes: this.data.notes ?? '',
        isActive: this.data.isActive
      });
      this.form.get('totalInstallments')?.disable();
      this.form.get('dueDay')?.disable();
    }
  }

  saving = false;

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const resolvedDiscount = this.discountAmount();

    if (this.isEdit) {
      this.purchasesService.update(this.data!.id, {
        name: v.name!,
        totalAmount: v.totalAmount ?? 0,
        discountAmount: resolvedDiscount,
        paymentMethodId: v.paymentMethodId ?? undefined,
        notes: v.notes ?? undefined,
        isActive: v.isActive ?? true
      }).subscribe({
        next: r => { this.snackBar.open('Actualizado', 'Cerrar', { duration: 3000 }); this.dialogRef.close(r); },
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.purchasesService.create({
        name: v.name!,
        totalAmount: v.totalAmount ?? 0,
        discountAmount: resolvedDiscount,
        totalInstallments: v.totalInstallments ?? 1,
        dueDay: v.dueDay ?? 10,
        paymentMethodId: v.paymentMethodId ?? undefined,
        notes: v.notes ?? undefined
      }).subscribe({
        next: r => { this.snackBar.open('Creado', 'Cerrar', { duration: 3000 }); this.dialogRef.close(r); },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
