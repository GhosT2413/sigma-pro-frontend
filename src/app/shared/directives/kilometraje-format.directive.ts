import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[sigmaKilometraje]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KilometrajeFormatDirective),
      multi: true,
    },
  ],
})
export class KilometrajeFormatDirective implements ControlValueAccessor {
  private onChange: (val: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly el: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput(): void {
    const rawValue = this.el.nativeElement.value || '';
    // Eliminar todo lo que no sea dígito
    const digitsOnly = rawValue.replace(/\D/g, '');

    if (!digitsOnly) {
      this.el.nativeElement.value = '';
      this.onChange(null);
      return;
    }

    const numericValue = parseInt(digitsOnly, 10);
    // Formatear con separador de miles con punto (1.000, 100.000)
    const formatted = numericValue.toLocaleString('es-CL');
    this.el.nativeElement.value = formatted;
    this.onChange(numericValue);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Bloquear explícitamente el signo menos (-) y el más (+) o exponentes (e, E)
    if (['-', '+', 'e', 'E', '.'].includes(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: number | null | undefined): void {
    if (value === null || value === undefined || isNaN(value)) {
      this.el.nativeElement.value = '';
      return;
    }
    const val = Math.max(0, Math.floor(value));
    this.el.nativeElement.value = val.toLocaleString('es-CL');
  }

  registerOnChange(fn: (val: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }
}
