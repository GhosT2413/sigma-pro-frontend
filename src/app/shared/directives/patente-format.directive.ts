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
    // Permitir letras (mayúsculas y minúsculas) y números sin forzar toUpperCase al teclear
    const formateado = valorOriginal.replace(/[^a-zA-Z0-9]/g, '');

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
    const formateado = valorOriginal.replace(/[^a-zA-Z0-9]/g, '');
    this.el.nativeElement.value = formateado;
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(formateado, { emitEvent: false });
    }
  }
}