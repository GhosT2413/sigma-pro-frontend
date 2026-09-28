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

  readonly edad = computed(() => {
    const fechaNac = this.form.get('fecha_nacimiento')?.value;
    if (!fechaNac) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  });

  readonly form = this.fb.nonNullable.group({
    nombre_completo: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    telefono: [{ value: '', disabled: true }],
    fecha_nacimiento: [{ value: '', disabled: true }],
    rut: [{ value: '', disabled: true }, [validarRutChileno]],
  });

  constructor() {
    this.cargarDatos();

    // Reactivar/desactivar controles según modo edición
    effect(() => {
      const editando = this.editando();
      const controlesEditables = ['email', 'telefono'];
      controlesEditables.forEach((key) => {
        const control = this.form.get(key);
        if (control) {
          editando ? control.enable() : control.disable();
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

    // Formatear fecha a YYYY-MM-DD para input[type=date]
    const formatearFecha = (fecha: string | undefined): string => {
      if (!fecha) return '';
      // Si ya está en formato YYYY-MM-DD, devolverlo
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
      // Intentar parsear otros formatos
      const date = new Date(fecha);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return '';
    };

    this.form.patchValue({
      nombre_completo: usuario.nombreCompleto,
      email: usuario.email,
      telefono: usuario.telefono ?? '',
      fecha_nacimiento: formatearFecha(usuario.fechaNacimiento),
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
          if (u.fechaNacimiento) {
            this.form.patchValue({ fecha_nacimiento: formatearFecha(u.fechaNacimiento) });
          }
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
    } else {
      this.usuarioService.listar().subscribe({
        next: (usuarios) => {
          const propio = usuarios.find((u) => u.id === usuario.id);
          if (propio?.telefono) {
            this.form.patchValue({ telefono: propio.telefono });
          }
          if (propio?.fechaNacimiento) {
            this.form.patchValue({ fecha_nacimiento: formatearFecha(propio.fechaNacimiento) });
          }
          if (propio?.fotoPerfilUrl) {
            this.fotoPreview.set(propio.fotoPerfilUrl);
          }
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
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

    const payload = {
      email: raw.email.trim(),
      telefono: raw.telefono?.trim() || undefined,
      foto_perfil_url: this.fotoPreview() || undefined,
    };

    this.usuarioService.actualizar(usuario.id, payload).subscribe({
      next: (res) => {
        const usuarioActualizado: Usuario = {
          ...usuario,
          email: res.email,
          telefono: res.telefono,
          fechaNacimiento: res.fecha_nacimiento,
          fotoPerfilUrl: res.foto_perfil_url,
        };
        this.auth['usuarioSignal'].set(usuarioActualizado);
        localStorage.setItem('sigma_pro_usuario', JSON.stringify(usuarioActualizado));
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