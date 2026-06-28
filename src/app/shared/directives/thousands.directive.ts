import { Directive, ElementRef, forwardRef, HostListener, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appThousands]',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ThousandsDirective),
    multi: true
  }]
})
export class ThousandsDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.el.nativeElement.type = 'text';
    this.el.nativeElement.setAttribute('inputmode', 'numeric');
  }

  writeValue(value: number | null): void {
    this.el.nativeElement.value =
      value != null && !isNaN(value) ? this.format(value) : '';
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    const pos = input.selectionStart ?? raw.length;

    // Count digits to the RIGHT of cursor — stable anchor after reformatting
    const digitsAfterCursor = (raw.substring(pos).match(/\d/g) ?? []).length;

    const stripped = raw.replace(/\./g, '').replace(/[^\d-]/g, '');
    const num = stripped === '' || stripped === '-' ? null : parseInt(stripped, 10);
    const formatted = num != null ? this.format(num) : (stripped === '-' ? '-' : '');
    input.value = formatted;

    // Restore cursor: walk from right until we've passed digitsAfterCursor digits
    let cursor = formatted.length;
    if (digitsAfterCursor > 0) {
      let count = 0;
      for (let i = formatted.length - 1; i >= 0; i--) {
        if (/\d/.test(formatted[i])) {
          count++;
          if (count === digitsAfterCursor) { cursor = i; break; }
        }
      }
    }
    input.setSelectionRange(cursor, cursor);

    this.onChange(num);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private format(value: number): string {
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
