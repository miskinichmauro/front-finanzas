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
    <div class="asel" [class.asel--open]="open()" [class.asel--disabled]="isDisabled">
      <button type="button" class="asel__trigger" (click)="toggle()">
        <span class="asel__value" [class.asel__value--placeholder]="isPlaceholder()">{{ displayLabel() }}</span>
        <svg class="asel__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      @if (open()) {
        <div class="asel__panel" [style.top]="panelTop" [style.left]="panelLeft" [style.width]="panelWidth">
          <div class="asel__search">
            <input #searchInput type="text" [ngModel]="searchText()" (ngModelChange)="searchText.set($event)"
              placeholder="Buscar..." (click)="$event.stopPropagation()" />
          </div>
          <div class="asel__options">
            @if (showNullOption()) {
              <button type="button" class="asel__option" [class.asel__option--selected]="value() === null || value() === undefined" (click)="select(null)">
                <span>{{ nullLabel }}</span>
                @if (value() === null || value() === undefined) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 13.5 4 9"/></svg>
                }
              </button>
            }
            @for (item of filteredItems(); track getItemValue(item)) {
              <button type="button" class="asel__option" [class.asel__option--selected]="isSelected(item)" (click)="select(getItemValue(item))">
                <span>{{ getItemLabel(item) }}</span>
                @if (isSelected(item)) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 13.5 4 9"/></svg>
                }
              </button>
            }
            @if (filteredItems().length === 0) {
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
        width: 100%;
        height: 42px;
        padding: 0 12px 0 14px;
        border: 1.5px solid var(--border-input);
        border-radius: 10px;
        background: var(--bg-input);
        font-size: 14px;
        font-weight: 400;
        font-family: Roboto, "Helvetica Neue", sans-serif;
        color: var(--text-primary);
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
        text-align: left;
        gap: 8px;
        box-sizing: border-box;
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
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        &--placeholder { color: var(--text-subtle); }
      }

      &__arrow {
        width: 16px;
        height: 16px;
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
        border-radius: 12px;
        box-shadow: var(--dialog-shadow);
        overflow: hidden;
        min-width: 160px;
      }

      &__search {
        padding: 8px 8px 4px;
        border-bottom: 1px solid var(--border-light);
        input {
          width: 100%;
          height: 34px;
          padding: 0 10px;
          border: 1.5px solid var(--border-input);
          border-radius: 8px;
          font-size: 13px;
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
        max-height: 220px;
        overflow-y: auto;
        padding: 4px;
      }

      &__option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-height: 38px;
        padding: 0 10px;
        border: none;
        border-radius: 8px;
        background: transparent;
        font-size: 14px;
        font-weight: 400;
        font-family: Roboto, "Helvetica Neue", sans-serif;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        gap: 8px;
        transition: background 0.1s, color 0.1s;

        span { flex: 1; text-align: left; }
        svg { width: 16px; height: 16px; color: #6366f1; flex-shrink: 0; }

        &:hover { background: var(--bg-hover); }

        &--selected {
          background: transparent;
          font-weight: 500;
          color: var(--text-primary);

          &:hover { background: var(--bg-hover); }
        }
      }

      &__empty {
        padding: 12px 10px;
        font-size: 13px;
        color: var(--text-subtle);
        text-align: center;
      }
    }
  `]
})
export class AppSelectComponent implements ControlValueAccessor {
  @Input() set items(v: any[]) { this._items.set(v || []); }
  @Input() valueKey = 'id';
  @Input() labelKey = 'name';
  @Input() placeholder = 'Seleccionar...';
  @Input() nullLabel: string | null = null;

  private readonly _items = signal<any[]>([]);
  value = signal<any>(null);
  isDisabled = false;
  open = signal(false);
  searchText = signal('');
  panelTop = '0px';
  panelLeft = '0px';
  panelWidth = '0px';

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly el: ElementRef) {}

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

  private normalize(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
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

  toggle(): void {
    if (this.isDisabled) return;
    if (!this.open()) {
      const rect = (this.el.nativeElement.querySelector('.asel__trigger') as HTMLElement).getBoundingClientRect();
      this.panelTop = `${rect.bottom + 4}px`;
      this.panelLeft = `${rect.left}px`;
      this.panelWidth = `${rect.width}px`;
    }
    this.open.update(v => !v);
    if (this.open()) {
      this.searchText.set('');
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
