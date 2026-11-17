import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { RutFormatDirective } from '../../../shared/directives/rut-format.directive';
import { validarRutChileno } from '../../../shared/validators/rut.validator';
import { LegalModalComponent } from '../../../shared/components/legal-modal/legal-modal.component';

@Component({
  selector: 'sigma-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RutFormatDirective, LegalModalComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild(LegalModalComponent) legalModal!: LegalModalComponent;

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly terminosAbiertos = signal(false);

  readonly roles = [
    { id: 1, label: 'Cliente' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: [''],
    role_id: [1, Validators.required],
    hasAcceptedTerms: [false, Validators.requiredTrue],
    // Cliente fields
    rut: ['', [Validators.required, validarRutChileno]],
  });

  async abrirTerminos(): Promise<void> {
    this.terminosAbiertos.set(true);
    const acepto = await this.legalModal.abrir();
    this.terminosAbiertos.set(false);
    if (acepto) {
      this.form.controls.hasAcceptedTerms.setValue(true);
      this.form.controls.hasAcceptedTerms.markAsTouched();
    }
  }

  async enviar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();

    const payload = {
      nombre_completo: raw.nombre_completo,
      email: raw.email,
      password_hash: raw.password,
      telefono: raw.telefono || undefined,
      role_id: 1,
      hasAcceptedTerms: raw.hasAcceptedTerms,
      rut: raw.rut?.trim().toUpperCase(),
    };

    this.auth.register(payload as any).subscribe({
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
