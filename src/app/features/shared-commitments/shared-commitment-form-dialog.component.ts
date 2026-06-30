import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';
import { ThousandsDirective } from '../../shared/directives/thousands.directive';
import { SharedCommitmentsService } from '../../core/services/shared-commitments.service';
import { SharingGroupsService } from '../../core/services/sharing-groups.service';
import { CategoriesService } from '../../core/services/categories.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { CommercesService } from '../../core/services/commerces.service';
import { SharedCommitmentDto, SharingGroupDto, CategoryDto, PaymentMethodDto, CommerceDto } from '../../core/models';

@Component({
  selector: 'app-shared-commitment-form-dialog',
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
  templateUrl: './shared-commitment-form-dialog.component.html'
})
export class SharedCommitmentFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sharedCommitmentsService = inject(SharedCommitmentsService);
  private readonly sharingGroupsService = inject(SharingGroupsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly commercesService = inject(CommercesService);
  private readonly dialogRef = inject(MatDialogRef<SharedCommitmentFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  data = inject<SharedCommitmentDto | null>(MAT_DIALOG_DATA);

  sharingGroups: SharingGroupDto[] = null as any;
  categories: CategoryDto[] = null as any;
  paymentMethods: (PaymentMethodDto & { displayName: string })[] = null as any;
  commerces: (CommerceDto & { displayName: string })[] = null as any;

  commitmentTypeOptions = [
    { id: false, name: 'Gasto' },
    { id: true, name: 'Destinado a Categoría' }
  ];

  form = this.fb.group({
    sharingGroupId: ['', [Validators.required]],
    date: [new Date().toISOString().substring(0, 10), [Validators.required]],
    description: ['', [Validators.required]],
    commerceId: [null as string | null],
    categoryId: [null as string | null, [Validators.required]],
    paymentMethodId: [null as string | null],
    grossAmount: [0, [Validators.required, Validators.min(0)]],
    netAmount: [0, [Validators.required, Validators.min(0)]],
    discountAmount: [0],
    discountPercent: [0],
    notes: [''],
    paidByUserId: [null as string | null],
    displayOrder: [0],
    isActive: [true],
    isVariableBudget: [false],
    monthlyBudget: [null as number | null],
    linkedCategoryId: [null as string | null]
  });

  get isVariableBudget(): boolean {
    return !!this.form.get('isVariableBudget')?.value;
  }

  get isEdit(): boolean { return !!this.data; }

  get commitmentTypeHint(): string {
    return this.isVariableBudget
      ? 'El monto se calcula según el gasto real del mes en una categoría y el presupuesto configurado.'
      : 'Cargás un monto manual que se reparte entre los miembros del grupo.';
  }

  get categoryLabel(): string {
    return this.isVariableBudget ? 'Categoría del compromiso' : 'Categoría';
  }

  get groupMembers(): { id: string; name: string }[] {
    const groupId = this.form.get('sharingGroupId')?.value;
    const group = (this.sharingGroups ?? []).find(g => g.id === groupId);
    return group?.members.map(m => ({ id: m.userId, name: m.userName })) ?? [];
  }

  ngOnInit(): void {
    this.sharingGroupsService.getAll().subscribe(g => this.sharingGroups = g);
    this.categoriesService.getAll().subscribe(c => this.categories = c);
    this.paymentMethodsService.getAll().subscribe(p => {
      this.paymentMethods = p.map(m => ({
        ...m,
        displayName: [m.name, m.lastDigits || null, m.bankName || null].filter(Boolean).join(' - ')
      }));
    });
    this.commercesService.getAll().subscribe(c => {
      this.commerces = c.map(x => ({
        ...x,
        displayName: x.address ? `${x.name} - ${x.address}` : x.name
      }));
    });

    if (this.data) {
      this.form.patchValue({
        sharingGroupId: this.data.sharingGroupId,
        date: this.data.date,
        description: this.data.description,
        commerceId: this.data.commerceId,
        categoryId: this.data.categoryId,
        paymentMethodId: this.data.paymentMethodId,
        grossAmount: this.data.grossAmount,
        netAmount: this.data.netAmount,
        discountAmount: this.data.discountAmount,
        discountPercent: this.data.discountPercent,
        notes: this.data.notes,
        paidByUserId: this.data.paidByUserId,
        displayOrder: this.data.displayOrder,
        isActive: this.data.isActive,
        isVariableBudget: this.data.isVariableBudget,
        monthlyBudget: this.data.monthlyBudget,
        linkedCategoryId: this.data.linkedCategoryId
      });
    }

    this.form.get('isVariableBudget')?.valueChanges.subscribe(() => {
      this.updateCommitmentTypeState();
      this.recalculateForCurrentType();
    });

    this.form.get('monthlyBudget')?.valueChanges.subscribe(() => {
      if (this.isVariableBudget) {
        this.syncVariableBudgetAmounts();
      }
    });

    this.updateCommitmentTypeState();
    this.recalculateForCurrentType();
  }

  onGrossAmountChange(): void {
    if (!this.isVariableBudget) {
      this.recalcFromPercent();
    }
  }

  onDiscountPercentChange(): void {
    if (!this.isVariableBudget) {
      this.recalcFromPercent();
    }
  }

  onDiscountAmountChange(): void {
    if (this.isVariableBudget) return;
    const gross = this.form.get('grossAmount')?.value ?? 0;
    const discount = this.form.get('discountAmount')?.value ?? 0;
    const pct = gross > 0 ? Math.round(discount / gross * 100) : 0;
    this.form.patchValue({ discountPercent: pct, netAmount: gross - discount }, { emitEvent: false });
  }

  private updateCommitmentTypeState(): void {
    const grossAmount = this.form.get('grossAmount')!;
    const monthlyBudget = this.form.get('monthlyBudget')!;
    const linkedCategoryId = this.form.get('linkedCategoryId')!;

    if (this.isVariableBudget) {
      if (!(monthlyBudget.value ?? 0) && (grossAmount.value ?? 0) > 0) {
        monthlyBudget.patchValue(grossAmount.value, { emitEvent: false });
      }
      grossAmount.clearValidators();
      grossAmount.addValidators([Validators.min(0)]);
      monthlyBudget.setValidators([Validators.required, Validators.min(0)]);
      linkedCategoryId.setValidators([Validators.required]);
    } else {
      if (!(grossAmount.value ?? 0) && (monthlyBudget.value ?? 0) > 0) {
        grossAmount.patchValue(monthlyBudget.value, { emitEvent: false });
      }
      grossAmount.setValidators([Validators.required, Validators.min(0)]);
      monthlyBudget.clearValidators();
      linkedCategoryId.clearValidators();
    }

    grossAmount.updateValueAndValidity({ emitEvent: false });
    monthlyBudget.updateValueAndValidity({ emitEvent: false });
    linkedCategoryId.updateValueAndValidity({ emitEvent: false });
  }

  private recalculateForCurrentType(): void {
    if (this.isVariableBudget) {
      this.syncVariableBudgetAmounts();
      return;
    }

    this.recalcFromPercent();
  }

  private syncVariableBudgetAmounts(): void {
    const budget = this.form.get('monthlyBudget')?.value ?? 0;
    this.form.patchValue({
      grossAmount: budget,
      discountPercent: 0,
      discountAmount: 0,
      netAmount: budget
    }, { emitEvent: false });
  }

  private recalcFromPercent(): void {
    const gross = this.form.get('grossAmount')?.value ?? 0;
    const pct = this.form.get('discountPercent')?.value ?? 0;
    const discountAmt = Math.round(gross * pct / 100);
    this.form.patchValue({ discountAmount: discountAmt, netAmount: gross - discountAmt }, { emitEvent: false });
  }

  saving = false;

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const value = this.form.getRawValue();
    const isVariableBudget = value.isVariableBudget ?? false;
    const effectiveGrossAmount = isVariableBudget ? (value.monthlyBudget ?? 0) : (value.grossAmount ?? 0);
    const effectiveDiscountPercent = isVariableBudget ? 0 : (value.discountPercent ?? 0);

    const dto = {
      sharingGroupId: value.sharingGroupId!,
      date: value.date!,
      description: value.description!,
      commerceId: value.commerceId || undefined,
      categoryId: value.categoryId!,
      paymentMethodId: value.paymentMethodId || undefined,
      grossAmount: effectiveGrossAmount,
      discountPercent: effectiveDiscountPercent,
      paidByUserId: value.paidByUserId || undefined,
      displayOrder: value.displayOrder ?? 0,
      notes: value.notes ?? '',
      isActive: value.isActive ?? true,
      isVariableBudget,
      monthlyBudget: isVariableBudget ? (value.monthlyBudget ?? undefined) : undefined,
      linkedCategoryId: isVariableBudget ? (value.linkedCategoryId || undefined) : undefined
    };

    if (this.isEdit) {
      this.sharedCommitmentsService.update(this.data!.id, dto).subscribe({
        next: result => {
          this.snackBar.open('Compromiso actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); }
      });
    } else {
      this.sharedCommitmentsService.create(dto).subscribe({
        next: result => {
          this.snackBar.open('Compromiso creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(result);
        },
        error: () => { this.saving = false; this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 }); }
      });
    }
  }
}
