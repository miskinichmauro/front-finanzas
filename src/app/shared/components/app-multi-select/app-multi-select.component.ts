import { Component, ElementRef, HostListener, Input, computed, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppMultiSelectComponent),
    multi: true
  }],
  template: `
    <div class="amsel" [class.amsel--open]="open()" [class.amsel--disabled]="isDisabled">
      <button type="button" class="amsel__trigger" (click)="toggle()">
        <span class="amsel__value" [class.amsel__value--placeholder]="selectedValues().length === 0">
          {{ displayLabel() }}
        </span>
        <svg class="amsel__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      @if (open()) {
        <div class="amsel__panel" [style.top]="panelTop" [style.left]="panelLeft" [style.width]="panelWidth">
          <div class="amsel__search">
            <input type="text" [ngModel]="searchText()" (ngModelChange)="searchText.set($event)"
              placeholder="Buscar..." (click)="$event.stopPropagation()" />
          </div>
          <div class="amsel__options">
            @for (item of filteredItems(); track getItemValue(item)) {
              <button type="button" class="amsel__option" [class.amsel__option--selected]="isSelected(item)"
                (click)="toggleItem(item)">
                <span class="amsel__checkbox" [class.amsel__checkbox--checked]="isSelected(item)">
                  @if (isSelected(item)) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 13.5 4 9"/>
                    </svg>
                  }
                </span>
                <span>{{ getItemLabel(item) }}</span>
              </button>
            }
            @if (filteredItems().length === 0) {
              <div class="amsel__empty">Sin resultados</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .amsel {
      position: relative;
      width: 100%;

      &__trigger {
        display: flex;
        align-items: center;
        width: 100%;
        min-height: 42px;
        padding: 6px 12px 6px 14px;
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

      &--open .amsel__trigger {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
      }

      &--disabled .amsel__trigger {
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
      &--open .amsel__arrow { transform: rotate(180deg); }

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
          font-family: Roboto, "Helvetica Neue", sans-serif;
          color: var(--text-primary);
          background: var(--bg-surface-alt);
          outline: none;
          box-sizing: border-box;
          &:focus { border-color: #6366f1; background: var(--bg-input); }
        }
      }

      &__options {
        max-height: 240px;
        overflow-y: auto;
        padding: 4px;
      }

      &__option {
        display: flex;
        align-items: center;
        width: 100%;
        min-height: 38px;
        padding: 0 10px;
        border: none;
        border-radius: 8px;
        background: transparent;
        font-size: 14px;
        font-family: Roboto, "Helvetica Neue", sans-serif;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        gap: 10px;
        transition: background 0.1s;

        span:last-child { flex: 1; }
        &:hover { background: var(--bg-hover); }
        &--selected { font-weight: 500; }
      }

      &__checkbox {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border: 1.5px solid var(--border-input);
        border-radius: 4px;
        flex-shrink: 0;
        transition: border-color 0.1s, background 0.1s;

        svg { width: 12px; height: 12px; color: white; }

        &--checked {
          border-color: #6366f1;
          background: #6366f1;
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
export class AppMultiSelectComponent implements ControlValueAccessor {
  @Input() set items(v: any[]) { this._items.set(v || []); }
  @Input() valueKey = 'id';
  @Input() labelKey = 'name';
  @Input() placeholder = 'Seleccionar...';

  private readonly _items = signal<any[]>([]);
  selectedValues = signal<string[]>([]);
  isDisabled = false;
  open = signal(false);
  searchText = signal('');
  panelTop = '0px';
  panelLeft = '0px';
  panelWidth = '0px';

  private onChange: (v: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly el: ElementRef) {}

  filteredItems = computed(() => {
    const s = this.normalize(this.searchText());
    return s ? this._items().filter(i => this.normalize(this.getItemLabel(i)).includes(s)) : this._items();
  });

  displayLabel = computed(() => {
    const vals = this.selectedValues();
    if (vals.length === 0) return this.placeholder;
    if (vals.length === 1) {
      const item = this._items().find(i => this.getItemValue(i) === vals[0]);
      return item ? this.getItemLabel(item) : '1 seleccionado';
    }
    return `${vals.length} seleccionados`;
  });

  private normalize(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  getItemValue(item: any): string {
    return typeof item === 'string' ? item : String(item[this.valueKey]);
  }

  getItemLabel(item: any): string {
    return typeof item === 'string' ? item : String(item[this.labelKey] ?? '');
  }

  isSelected(item: any): boolean {
    return this.selectedValues().includes(this.getItemValue(item));
  }

  toggle(): void {
    if (this.isDisabled) return;
    if (!this.open()) {
      const rect = (this.el.nativeElement.querySelector('.amsel__trigger') as HTMLElement).getBoundingClientRect();
      this.panelTop = `${rect.bottom + 4}px`;
      this.panelLeft = `${rect.left}px`;
      this.panelWidth = `${rect.width}px`;
    }
    this.open.update(v => !v);
    if (this.open()) {
      this.searchText.set('');
      setTimeout(() => this.el.nativeElement.querySelector('.amsel__search input')?.focus());
    }
  }

  toggleItem(item: any): void {
    const val = this.getItemValue(item);
    const current = this.selectedValues();
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    this.selectedValues.set(next);
    this.onChange(next);
    this.onTouched();
  }

  writeValue(vals: string[] | null): void {
    this.selectedValues.set(vals ?? []);
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled = d; }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.el.nativeElement.contains(e.target)) this.open.set(false);
  }
}
