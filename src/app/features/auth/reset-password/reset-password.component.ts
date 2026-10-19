import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

/** Coincide con el backend (password-recovery.dto.ts): ≥8, mayúscula, minúscula y número. */
export function passwordSegura(control: AbstractControl): ValidationErrors | null {
  const valor = control.value ?? '';
  const cumple = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(valor);
  return cumple ? null : { passwordSegura: true };
}

function contrasenasCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const nueva = grupo.get('newPassword')?.value;
  const confirmacion = grupo.get('confirmPassword')?.value;
  return nueva && confirmacion && nueva !== confirmacion ? { noCoinciden: true } : null;
}

// RF-01: restablecer contraseña desde el enlace del correo (POST /auth/reset-password)
@Component({
  selector: 'sigma-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal(false);
  readonly token = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, passwordSegura]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: contrasenasCoinciden },
  );

  constructor() {
    // El token llega como query param del enlace del correo: /reset-password?token=...
    this.route.queryParamMap.subscribe((params) => this.token.set(params.get('token')));
  }

  get tokenInvalido(): boolean {
    return !this.token();
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.token();
    if (!token) {
      this.error.set('El enlace de recuperación no es válido o está incompleto. Solicita uno nuevo.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const { newPassword, confirmPassword } = this.form.getRawValue();
    this.auth.resetPassword({ token, newPassword, confirmPassword }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);
      },
      error: (err) => {
        this.cargando.set(false);
        if (err.status === 401) {
          this.error.set('El enlace de recuperación expiró o ya fue utilizado. Solicita uno nuevo.');
        } else if (err.status === 400) {
          const msg = err.error?.message;
          if (Array.isArray(msg)) {
            this.error.set(msg[0]);
          } else if (typeof msg === 'string') {
            this.error.set(msg);
          } else {
            this.error.set('Los datos ingresados no son válidos.');
          }
        } else if (err.status === 429) {
          this.error.set('Demasiados intentos. Espera unos minutos antes de intentarlo nuevamente.');
        } else if (err.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Intenta más tarde.');
        } else {
          this.error.set('Ocurrió un error inesperado. Intenta nuevamente.');
        }
      },
    });
  }

  solicitarOtroEnlace(): void {
    this.router.navigate(['/forgot-password']);
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }
}
