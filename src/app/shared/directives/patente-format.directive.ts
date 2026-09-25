import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[sigmaPatenteFormat]',
  standalone: true,
})
export class PatenteFormatDirective {
  constructor(
    private readonly el: ElementRef<HTMLInputElement>,
    private readonly ngControl: NgControl,
  ) {}

  @HostListener('input')
  onInput(): void {
    const valorOriginal = this.el.nativeElement.value || '';
    const formateado = this.formatearPatente(valorOriginal);

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
    const formateado = this.formatearPatente(valorOriginal);
    this.el.nativeElement.value = formateado;
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(formateado, { emitEvent: false });
    }
  }

  private formatearPatente(valor: string): string {
    if (!valor) return '';
    return valor.replace(/[^A-Z0-9]/g, '').toUpperCase();
  }
}