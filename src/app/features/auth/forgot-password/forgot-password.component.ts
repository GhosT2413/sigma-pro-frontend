import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

// RF-01: recuperación de contraseña por correo (POST /auth/forgot-password)
@Component({
  selector: 'sigma-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.auth.forgotPassword(this.form.controls.email.value.trim()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.enviado.set(true);
      },
      error: (err) => {
        this.cargando.set(false);
        if (err.status === 429) {
          this.error.set('Demasiados intentos. Espera unos minutos antes de volver a solicitar el correo.');
        } else if (err.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Intenta más tarde.');
        } else {
          this.error.set('Ocurrió un error inesperado. Intenta nuevamente.');
        }
      },
    });
  }

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
