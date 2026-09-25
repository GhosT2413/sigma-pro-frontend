import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Valida un RUT chileno con dígito verificador (módulo 11).
 * Admite formatos como 12345678-K, 12345678-9, etc.
 */
export function validarRutChileno(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (!valor || typeof valor !== 'string') {
    return null; // Si está vacío, los validadores Validators.required se encargan si aplica
  }

  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 2) {
    return { rutInvalido: true };
  }

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  // Módulo 11
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const resto = suma % 11;
  const dvEsperadoCalculado = 11 - resto;
  let dvEsperado = '';
  if (dvEsperadoCalculado === 11) dvEsperado = '0';
  else if (dvEsperadoCalculado === 10) dvEsperado = 'K';
  else dvEsperado = dvEsperadoCalculado.toString();

  if (dv !== dvEsperado) {
    return { rutInvalido: true };
  }

  return null;
}

/** Formatea un string en formato de RUT con guión (ej: 12345678-9 o 1234567-K). */
export function formatearRut(valor: string): string {
  if (!valor) return '';
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length <= 1) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
}
