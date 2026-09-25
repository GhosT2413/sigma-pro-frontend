import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatearRut } from '../validators/rut.validator';

@Directive({
  selector: 'input[sigmaRutFormat]',
  standalone: true,
})
export class RutFormatDirective {
  constructor(
    private readonly el: ElementRef<HTMLInputElement>,
    private readonly ngControl: NgControl,
  ) {}

  @HostListener('input')
  onInput(): void {
    const valorOriginal = this.el.nativeElement.value || '';
    const formateado = formatearRut(valorOriginal);

    if (valorOriginal !== formateado) {
      this.el.nativeElement.value = formateado;
    }

    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(formateado, { emitEvent: false });
    }
  }

  @HostListener('blur')
  onBlur(): void {
    const valorOriginal = this.el.nativeElement.value || '';
    const formateado = formatearRut(valorOriginal);
    this.el.nativeElement.value = formateado;
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(formateado, { emitEvent: false });
    }
  }
}
