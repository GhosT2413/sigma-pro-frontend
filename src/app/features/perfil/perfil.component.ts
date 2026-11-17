import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ClienteService } from '../../core/services/cliente.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { Cliente } from '../../core/models/cliente.model';
import { Usuario } from '../../core/models/usuario.model';
import { validarRutChileno } from '../../shared/validators/rut.validator';

@Component({
  selector: 'sigma-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  readonly usuarioActual = this.auth.usuario;
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly cliente = signal<Cliente | null>(null);
  readonly fotoPreview = signal<string | null>(null);
  readonly editando = signal(false);

  readonly esCliente = computed(() => this.usuarioActual()?.rol === 'CLIENTE');
  readonly esMecanicoIndependiente = computed(() => this.usuarioActual()?.rol === 'MECANICO_INDEPENDIENTE');
  readonly mostrarRut = computed(() => {
    const rol = this.usuarioActual()?.rol;
    return rol === 'CLIENTE' || rol === 'MECANICO_INDEPENDIENTE';
  });

  readonly esGoogleUser = computed(() => !!this.usuarioActual()?.googleId);

  readonly form = this.fb.nonNullable.group({
    nombre_completo: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    telefono: [{ value: '', disabled: true }],
    rut: [{ value: '', disabled: true }, [validarRutChileno]],
  });

  constructor() {
    this.cargarDatos();

    // Reactivar/desactivar controles según modo edición
    effect(() => {
      const editando = this.editando();
      const esGoogle = this.esGoogleUser();
      
      // Email y teléfono siempre editables al editar
      const controlesBase = ['email', 'telefono'];
      controlesBase.forEach((key) => {
        const control = this.form.get(key);
        if (control) {
          editando ? control.enable() : control.disable();
        }
      });

      // Si es usuario Google (o si edita), puede modificar nombre completo y rut
      const controlesGoogle = ['nombre_completo', 'rut'];
      controlesGoogle.forEach((key) => {
        const control = this.form.get(key);
        if (control) {
          (editando && esGoogle) ? control.enable() : control.disable();
        }
      });
    });
  }

  cargarDatos(): void {
    this.cargando.set(true);
    const usuario = this.usuarioActual();
    if (!usuario) {
      this.cargando.set(false);
      return;
    }

    this.form.patchValue({
      nombre_completo: usuario.nombreCompleto,
      email: usuario.email,
      telefono: usuario.telefono ?? '',
      rut: usuario.rut ?? '',
    });

    if (usuario.fotoPerfilUrl) {
      this.fotoPreview.set(usuario.fotoPerfilUrl);
    }

    if (usuario.rol === 'CLIENTE') {
      this.clienteService.obtenerPorUsuarioId(usuario.id).pipe(
        switchMap((cliente) => {
          if (cliente) return of(cliente);
          return this.clienteService.obtenerPorEmail(usuario.email);
        }),
        switchMap((cliente) => {
          if (cliente) {
            this.cliente.set(cliente);
            this.form.patchValue({ rut: cliente.rut ?? '' });
          } else {
            // Fallback: usar RUT del usuario autenticado (guardado en localStorage tras registro)
            const rutUsuario = this.usuarioActual()?.rut;
            if (rutUsuario) {
              this.form.patchValue({ rut: rutUsuario });
            }
          }
          return this.usuarioService.obtener(usuario.id);
        })
      ).subscribe({
        next: (u) => {
          if (u.rut && !this.form.get('rut')?.value) {
            this.form.patchValue({ rut: u.rut });
          }
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
    } else {
      this.usuarioService.obtener(usuario.id).subscribe({
        next: (propio) => {
          if (propio.rut) {
            this.form.patchValue({ rut: propio.rut });
          }
          if (propio.telefono) {
            this.form.patchValue({ telefono: propio.telefono });
          }
          if (propio.fotoPerfilUrl) {
            this.fotoPreview.set(propio.fotoPerfilUrl);
          }
          this.cargando.set(false);
        },
        error: () => {
          this.usuarioService.listar().subscribe({
            next: (usuarios) => {
              const propio = usuarios.find((u) => u.id === usuario.id);
              if (propio?.rut) {
                this.form.patchValue({ rut: propio.rut });
              }
              if (propio?.telefono) {
                this.form.patchValue({ telefono: propio.telefono });
              }
              if (propio?.fotoPerfilUrl) {
                this.fotoPreview.set(propio.fotoPerfilUrl);
              }
              this.cargando.set(false);
            },
            error: () => this.cargando.set(false),
          });
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.error.set('El archivo debe ser una imagen.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.error.set('La imagen no debe superar 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  toggleEditar(): void {
    this.editando.set(!this.editando());
    if (!this.editando()) {
      this.cargarDatos();
      this.error.set(null);
      this.mensajeExito.set(null);
    }
  }

  guardar(): void {
    this.error.set(null);
    this.mensajeExito.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completa los campos requeridos correctamente.');
      return;
    }

    this.guardando.set(true);
    const raw = this.form.getRawValue();
    const usuario = this.usuarioActual();

    if (!usuario) {
      this.guardando.set(false);
      this.error.set('No hay usuario autenticado.');
      return;
    }

    const payload: any = {
      email: raw.email.trim(),
      telefono: raw.telefono?.trim() || undefined,
      foto_perfil_url: this.fotoPreview() || undefined,
    };

    if (raw.nombre_completo?.trim()) {
      payload.nombre_completo = raw.nombre_completo.trim();
    }
    if (raw.rut?.trim()) {
      payload.rut = raw.rut.trim().toUpperCase();
    }

    this.usuarioService.actualizar(usuario.id, payload).subscribe({
      next: (res) => {
        const usuarioActualizado: Usuario = {
          ...usuario,
          nombreCompleto: res.nombre_completo || usuario.nombreCompleto,
          email: res.email,
          telefono: res.telefono,
          fotoPerfilUrl: res.foto_perfil_url,
          rut: res.rut || usuario.rut,
        };
        this.auth['usuarioSignal'].set(usuarioActualizado);
        localStorage.setItem('sigma_pro_usuario', JSON.stringify(usuarioActualizado));

        // Si es rol CLIENTE, sincronizar también la tabla clientes
        if (usuario.rol === 'CLIENTE') {
          const clienteExistente = this.cliente();
          if (clienteExistente) {
            this.clienteService.actualizar(clienteExistente.id, {
              nombre_completo: usuarioActualizado.nombreCompleto,
              rut: usuarioActualizado.rut,
              email: usuarioActualizado.email,
              telefono: usuarioActualizado.telefono,
            }).subscribe({
              next: (cRes) => {
                if (cRes?.cliente) {
                  this.cliente.set({
                    ...clienteExistente,
                    nombreCompleto: usuarioActualizado.nombreCompleto,
                    rut: usuarioActualizado.rut || clienteExistente.rut,
                    email: usuarioActualizado.email,
                    telefono: usuarioActualizado.telefono,
                  });
                }
              },
              error: (cErr) => console.warn('No se pudo actualizar registro en clientes:', cErr),
            });
          } else if (usuarioActualizado.rut) {
            this.clienteService.crear({
              usuario_id: usuario.id,
              nombre_completo: usuarioActualizado.nombreCompleto,
              rut: usuarioActualizado.rut,
              email: usuarioActualizado.email,
              telefono: usuarioActualizado.telefono,
            }).subscribe({
              next: () => this.cargarDatos(),
              error: (cErr) => console.warn('No se pudo crear cliente:', cErr),
            });
          }
        }

        this.guardando.set(false);
        this.mensajeExito.set('Perfil actualizado correctamente.');
        this.editando.set(false);
      },
      error: (err) => {
        this.guardando.set(false);
        const errorMsg = err?.error?.message;
        if (err?.status === 400) {
          if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('email')) {
            this.error.set('El correo electrónico ya está en uso.');
          } else if (Array.isArray(errorMsg)) {
            this.error.set(errorMsg.join('. '));
          } else {
            this.error.set(errorMsg || 'Error al actualizar el perfil.');
          }
        } else {
          this.error.set('Error al actualizar el perfil. Intente nuevamente.');
        }
      },
    });
  }

  cancelar(): void {
    this.editando.set(false);
    this.cargarDatos();
    this.error.set(null);
    this.mensajeExito.set(null);
  }
}