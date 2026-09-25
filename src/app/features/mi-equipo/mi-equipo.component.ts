import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/auth/auth.service';
import { ROLE_LABELS, Usuario, Rol, CreateUsuarioPayload } from '../../core/models/usuario.model';

// RF-16: Gestión de Sucursales y Talleres / "Mi Equipo" (exclusivo rol Taller y Administrador)
@Component({
  selector: 'sigma-mi-equipo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-equipo.component.html',
  styleUrl: './mi-equipo.component.scss',
})
export class MiEquipoComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly equipo = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly roleLabels = ROLE_LABELS;
  readonly tallerId = computed(() => this.authService.usuario()?.tallerId ?? null);
  readonly esTaller = computed(() => this.authService.rol() === 'TALLER');
  readonly esAdmin = computed(() => this.authService.rol() === 'ADMINISTRADOR');

  // Modal state
  readonly mostrarModal = signal(false);
  readonly editando = signal<Usuario | null>(null);
  readonly cargandoGuardar = signal(false);
  readonly errorModal = signal<string | null>(null);

  // Roles permitidos para agregar al equipo (MECANICO=5, RECEPCIONISTA=6)
  readonly rolesEquipo = [
    { id: 5, label: 'Mecánico' },
    { id: 6, label: 'Recepcionista' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: [''],
    role_id: [5, Validators.required],
    hasAcceptedTerms: [true, Validators.requiredTrue],
  });

  constructor() {
    this.cargarEquipo();
  }

  cargarEquipo(): void {
    this.cargando.set(true);
    const tid = this.tallerId();
    if (!tid) {
      this.equipo.set([]);
      this.cargando.set(false);
      return;
    }
    this.usuarioService.equipoTaller(tid).subscribe({
      next: (data) => {
        this.equipo.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.equipo.set([]);
        this.cargando.set(false);
      },
    });
  }

  abrirModalCrear(): void {
    this.editando.set(null);
    this.form.reset({
      nombre_completo: '',
      email: '',
      password: '',
      telefono: '',
      role_id: 5,
      hasAcceptedTerms: true,
    });
    this.errorModal.set(null);
    this.mostrarModal.set(true);
  }

  abrirModalEditar(usuario: Usuario): void {
    this.editando.set(usuario);
    this.form.patchValue({
      nombre_completo: usuario.nombreCompleto,
      email: usuario.email,
      password: '',
      telefono: usuario.telefono ?? '',
      role_id: usuario.roleId,
      hasAcceptedTerms: true,
    });
    this.errorModal.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.editando.set(null);
    this.errorModal.set(null);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargandoGuardar.set(true);
    this.errorModal.set(null);

    try {
      const raw = this.form.getRawValue();
      const tid = this.tallerId();

      if (!tid && !this.esAdmin()) {
        this.errorModal.set('No se pudo determinar el taller. Contacte al administrador.');
        this.cargandoGuardar.set(false);
        return;
      }

      const payload: CreateUsuarioPayload = {
        nombre_completo: raw.nombre_completo,
        email: raw.email,
        password_hash: raw.password,
        telefono: raw.telefono || undefined,
        role_id: Number(raw.role_id),
        hasAcceptedTerms: raw.hasAcceptedTerms,
        taller_id: tid ?? undefined,
      };

      if (this.editando()) {
        // Editar: solo actualizamos campos permitidos (no password por seguridad)
        await this.usuarioService.actualizar(this.editando()!.id, {
          nombre_completo: raw.nombre_completo,
          telefono: raw.telefono || undefined,
          role_id: Number(raw.role_id),
          activo: this.editando()!.activo,
        }).toPromise();
      } else {
        // Crear
        await this.usuarioService.crear(payload).toPromise();
      }

      this.cerrarModal();
      this.cargarEquipo();
    } catch (err: any) {
      this.cargandoGuardar.set(false);
      if (err.status === 400) {
        const msg = err.error?.message;
        this.errorModal.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Datos inválidos'));
      } else if (err.status === 0) {
        this.errorModal.set('No se pudo conectar con el servidor');
      } else {
        this.errorModal.set('Error inesperado. Intente nuevamente.');
      }
    }
  }

  async eliminar(usuario: Usuario): Promise<void> {
    if (!confirm(`¿Eliminar a ${usuario.nombreCompleto}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await this.usuarioService.eliminar(usuario.id).toPromise();
      this.cargarEquipo();
    } catch {
      alert('No se pudo eliminar el usuario');
    }
  }

  toggleActivo(usuario: Usuario): void {
    this.usuarioService.actualizar(usuario.id, { activo: !usuario.activo }).subscribe({
      next: () => this.cargarEquipo(),
      error: () => alert('No se pudo actualizar el estado'),
    });
  }
}
