import { Component, ElementRef, HostListener, Input, computed, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppSelectComponent),
    multi: true
  }],
  template: `
    <div class="asel" [class.asel--open]="open()" [class.asel--disabled]="componentDisabled">
      <button type="button" class="asel__trigger" [disabled]="componentDisabled" (click)="toggle()">
        <span class="asel__value" [class.asel__value--placeholder]="isPlaceholder()">{{ displayLabel() }}</span>
        <svg class="asel__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      @if (open()) {
        <div class="asel__panel" [style.top]="panelTop" [style.left]="panelLeft" [style.width]="panelWidth">
          <div class="asel__search">
            <input #searchInput type="text" [ngModel]="searchText()" (ngModelChange)="onSearchChange($event)"
              placeholder="Buscar..." (click)="$event.stopPropagation()" (keydown)="onKeydown($event)" />
          </div>
          <div class="asel__options">
            @if (showNullOption()) {
              <button type="button" class="asel__option"
                [class.asel__option--selected]="value() === null || value() === undefined"
                [class.asel__option--highlighted]="highlightedIndex() === 0"
                (click)="select(null)">
                <span>{{ nullLabel }}</span>
                @if (value() === null || value() === undefined) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 13.5 4 9"/></svg>
                }
              </button>
            }
            @for (item of filteredItems(); track getItemValue(item); let i = $index) {
              <button type="button" class="asel__option"
                [class.asel__option--selected]="isSelected(item)"
                [class.asel__option--highlighted]="isItemHighlighted(i)"
                (click)="select(getItemValue(item))">
                <span>{{ getItemLabel(item) }}</span>
                @if (isSelected(item)) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 13.5 4 9"/></svg>
                }
              </button>
            }
            @if (filteredItems().length === 0 && !showNullOption()) {
              <div class="asel__empty">Sin resultados</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .asel {
      position: relative;
      width: 100%;

      &__trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: calc(28px * var(--ui-scale));
        padding: 0 calc(8px * var(--ui-scale)) 0 calc(10px * var(--ui-scale));
        border: 1.5px solid var(--border-input);
        border-radius: calc(7px * var(--ui-scale));
        background: var(--bg-input);
        font-size: calc(11.5px * var(--ui-scale));
        font-weight: 400;
        font-family: Roboto, "Helvetica Neue", sans-serif;
        color: var(--text-primary);
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
        text-align: left;
        gap: calc(6px * var(--ui-scale));
        box-sizing: border-box;
        line-height: 1;
        &:hover { border-color: var(--text-subtle); }
      }

      &--open .asel__trigger {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
      }

      &--disabled .asel__trigger {
        background: var(--bg-input-dis);
        color: var(--text-subtle);
        cursor: not-allowed;
        &:hover { border-color: var(--border-input); }
      }

      &__value {
        flex: 1;
        display: flex;
        align-items: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        &--placeholder { color: var(--text-subtle); }
      }

      &__arrow {
        width: calc(14px * var(--ui-scale));
        height: calc(14px * var(--ui-scale));
        color: var(--text-muted);
        flex-shrink: 0;
        transition: transform 0.15s;
      }
      &--open .asel__arrow { transform: rotate(180deg); }

      &__panel {
        position: fixed;
        z-index: 9999;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: calc(12px * var(--ui-scale));
        box-shadow: var(--dialog-shadow);
        overflow: hidden;
        min-width: calc(160px * var(--ui-scale));
      }

      &__search {
        padding: calc(4px * var(--ui-scale)) calc(4px * var(--ui-scale)) calc(3px * var(--ui-scale));
        border-bottom: 1px solid var(--border-light);
        input {
          width: 100%;
          height: calc(26px * var(--ui-scale));
          padding: 0 calc(7px * var(--ui-scale));
          line-height: calc(26px * var(--ui-scale));
          border: 1.5px solid var(--border-input);
          border-radius: calc(7px * var(--ui-scale));
          font-size: calc(11px * var(--ui-scale));
          font-weight: 400;
          font-family: Roboto, "Helvetica Neue", sans-serif;
          color: var(--text-primary);
          background: var(--bg-surface-alt);
          outline: none;
          box-sizing: border-box;
          &:focus { border-color: #6366f1; background: var(--bg-input); }
        }
      }

      &__options {
        max-height: calc(180px * var(--ui-scale));
        overflow-y: auto;
        padding: calc(3px * var(--ui-scale));
      }

      &__option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-height: calc(38px * var(--ui-scale));
        padding: calc(6px * var(--ui-scale)) calc(10px * var(--ui-scale));
        border: none;
        border-radius: calc(7px * var(--ui-scale));
        background: transparent;
        font-size: calc(11.5px * var(--ui-scale));
        font-weight: 400;
        font-family: Roboto, "Helvetica Neue", sans-serif;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        gap: calc(6px * var(--ui-scale));
        transition: background 0.1s, color 0.1s;

        span {
          flex: 1;
          text-align: left;
          white-space: normal;
          line-height: 1.25;
        }
        svg {
          width: calc(14px * var(--ui-scale));
          height: calc(14px * var(--ui-scale));
          color: #6366f1;
          flex-shrink: 0;
          margin-top: calc(2px * var(--ui-scale));
        }

        &:hover { background: var(--bg-hover); }

        &--highlighted {
          background: var(--bg-hover);
          outline: 2px solid rgba(99, 102, 241, 0.35);
          outline-offset: -2px;
        }

        &--selected {
          background: transparent;
          font-weight: 500;
          color: var(--text-primary);

          &:hover { background: var(--bg-hover); }
          &.asel__option--highlighted { background: var(--bg-hover); }
        }
      }

      &__empty {
        padding: calc(9px * var(--ui-scale)) calc(8px * var(--ui-scale));
        font-size: calc(11px * var(--ui-scale));
        color: var(--text-subtle);
        text-align: center;
      }
    }
  `]
})
export class AppSelectComponent implements ControlValueAccessor {
  @Input() set items(v: any[] | null | undefined) {
    this.itemsReady.set(v !== null && v !== undefined);
    this._items.set(v ?? []);
  }
  @Input() loading = false;
  @Input() valueKey = 'id';
  @Input() labelKey = 'name';
  @Input() placeholder = 'Seleccionar...';
  @Input() nullLabel: string | null = null;

  private readonly _items = signal<any[]>([]);
  private readonly itemsReady = signal(false);
  value = signal<any>(null);
  isDisabled = false;
  open = signal(false);
  searchText = signal('');
  highlightedIndex = signal(-1);
  panelTop = '0px';
  panelLeft = '0px';
  panelWidth = '0px';
  private readonly estimatedPanelHeight = 300;

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly el: ElementRef) {}

  get componentDisabled(): boolean {
    return this.isDisabled || this.loading || !this.itemsReady();
  }

  private get totalOptions(): number {
    return (this.showNullOption() ? 1 : 0) + this.filteredItems().length;
  }

  filteredItems = computed(() => {
    const s = this.normalize(this.searchText());
    return s ? this._items().filter(i => this.normalize(this.getItemLabel(i)).includes(s)) : this._items();
  });

  showNullOption = computed(() => {
    if (this.nullLabel === null) return false;
    const s = this.normalize(this.searchText());
    return !s || this.normalize(this.nullLabel).includes(s);
  });

  displayLabel = computed(() => {
    const v = this.value();
    if (v === null || v === undefined) {
      return this.nullLabel ?? this.placeholder;
    }
    const item = this._items().find(i => this.getItemValue(i) == v);
    return item ? this.getItemLabel(item) : this.placeholder;
  });

  isPlaceholder = computed(() => {
    const v = this.value();
    return (v === null || v === undefined) && this.nullLabel === null;
  });

  isItemHighlighted(itemIndex: number): boolean {
    const offset = this.showNullOption() ? 1 : 0;
    return this.highlightedIndex() === itemIndex + offset;
  }

  private normalize(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  getItemValue(item: any): any {
    return typeof item === 'string' ? item : item[this.valueKey];
  }

  getItemLabel(item: any): string {
    return typeof item === 'string' ? item : String(item[this.labelKey] ?? '');
  }

  isSelected(item: any): boolean {
    return this.getItemValue(item) == this.value();
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.highlightedIndex.set(-1);
  }

  onKeydown(event: KeyboardEvent): void {
    const total = this.totalOptions;
    if (total === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update(i => (i + 1) % total);
        this.scrollHighlightedIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update(i => (i - 1 + total) % total);
        this.scrollHighlightedIntoView();
        break;
      case 'Enter':
        event.preventDefault();
        this.selectHighlighted();
        break;
      case 'Escape':
        event.preventDefault();
        this.open.set(false);
        break;
    }
  }

  private selectHighlighted(): void {
    const idx = this.highlightedIndex();
    if (idx < 0) return;
    if (this.showNullOption() && idx === 0) {
      this.select(null);
    } else {
      const itemIdx = this.showNullOption() ? idx - 1 : idx;
      const item = this.filteredItems()[itemIdx];
      if (item) this.select(this.getItemValue(item));
    }
  }

  private scrollHighlightedIntoView(): void {
    setTimeout(() => {
      const el = this.el.nativeElement.querySelector('.asel__option--highlighted') as HTMLElement | null;
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  toggle(): void {
    if (this.componentDisabled) return;
    if (!this.open()) {
      const rect = (this.el.nativeElement.querySelector('.asel__trigger') as HTMLElement).getBoundingClientRect();
      const belowSpace = window.innerHeight - rect.bottom;
      const aboveSpace = rect.top;
      const shouldOpenUp = belowSpace < this.estimatedPanelHeight && aboveSpace > belowSpace;
      this.panelTop = shouldOpenUp
        ? `${Math.max(8, rect.top - this.estimatedPanelHeight - 4)}px`
        : `${rect.bottom + 4}px`;
      this.panelLeft = `${rect.left}px`;
      this.panelWidth = `${rect.width}px`;
    }
    this.open.update(v => !v);
    if (this.open()) {
      this.searchText.set('');
      this.highlightedIndex.set(-1);
      setTimeout(() => this.el.nativeElement.querySelector('.asel__search input')?.focus());
    }
  }

  select(val: any): void {
    this.value.set(val);
    this.onChange(val);
    this.onTouched();
    this.open.set(false);
  }

  writeValue(val: any): void { this.value.set(val ?? null); }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled = d; }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.el.nativeElement.contains(e.target)) this.open.set(false);
  }
}
