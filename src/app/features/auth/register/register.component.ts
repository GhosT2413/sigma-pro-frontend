import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'sigma-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly roles = [
    { id: 1, label: 'Cliente' },
    { id: 2, label: 'Mecánico Independiente' },
    { id: 3, label: 'Taller' },
    { id: 4, label: 'Administrador' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: [''],
    role_id: [1, Validators.required],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();

    this.auth
      .register({
        nombre_completo: raw.nombre_completo,
        email: raw.email,
        password_hash: raw.password,
        telefono: raw.telefono || undefined,
        role_id: Number(raw.role_id),
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.cargando.set(false);
          if (err.status === 400) {
            const msg = err.error?.message;
            if (Array.isArray(msg)) {
              this.error.set(msg[0]);
            } else if (typeof msg === 'string') {
              this.error.set(msg);
            } else {
              this.error.set('Los datos ingresados no son válidos.');
            }
          } else if (err.status === 0) {
            this.error.set('No se pudo conectar con el servidor. Intenta más tarde.');
          } else {
            this.error.set('Ocurrió un error inesperado. Intenta nuevamente.');
          }
        },
      });
  }
}
