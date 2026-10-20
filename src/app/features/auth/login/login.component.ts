import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

// RF-01: Autenticación y Control de Accesos (RBAC)
@Component({
  selector: 'sigma-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  @ViewChild('googleBtn', { static: false }) googleBtnRef?: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.iniciarGoogleAuth();
  }

  private iniciarGoogleAuth(): void {
    if (typeof window === 'undefined') return;

    const intervalo = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        clearInterval(intervalo);
        google.accounts.id.initialize({
          client_id: (environment as any).googleClientId,
          callback: (response: any) => this.handleGoogleCredential(response),
        });

        const btnElement = document.getElementById('googleSignInBtn');
        if (btnElement) {
          google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'pill',
          });
        }
      }
    }, 200);

    // Timeout safety
    setTimeout(() => clearInterval(intervalo), 10000);
  }

  private handleGoogleCredential(response: any): void {
    if (!response?.credential) return;

    this.cargando.set(true);
    this.error.set(null);

    this.auth.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message || 'Error al autenticar con Google.');
      },
    });
  }

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false);
        // El Dashboard adapta su contenido al rol recibido en el token (RF-01: "redirige... a su rol").
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Correo o contraseña incorrectos.');
      },
    });
  }
}
