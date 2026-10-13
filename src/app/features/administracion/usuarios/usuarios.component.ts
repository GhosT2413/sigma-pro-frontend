import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { RolOption, RolesService } from '../../../core/services/roles.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ROLE_LABELS, Usuario } from '../../../core/models/usuario.model';

// El ADMINISTRADOR puede cambiar el rol de cualquier usuario, pero NUNCA se
// guarda solo: la selección queda pendiente y solo se envía al pulsar "Guardar".
// (El rol actual se muestra con [selected] en la <option>, no con [value] en el
// <select>: Angular aplica ese binding antes de insertar las opciones y el
// navegador terminaba mostrando la primera — Cliente — como si fuera el valor.)
@Component({
  selector: 'sigma-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly rolesService = inject(RolesService);
  private readonly authService = inject(AuthService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly roleLabels = ROLE_LABELS;
  readonly rolesDisponibles = signal<RolOption[]>([]);
  readonly esAdmin = computed(() => this.authService.rol() === 'ADMINISTRADOR');
  readonly miId = computed(() => this.authService.usuario()?.id ?? null);

  /** Cambios de rol elegidos en la tabla y aún NO guardados (usuarioId → roleId). */
  readonly pendientes = signal<Record<number, number>>({});
  readonly guardandoId = signal<number | null>(null);
  readonly guardadoOkId = signal<number | null>(null);

  constructor() {
    this.cargarUsuarios();
    this.rolesService.listar().subscribe({
      next: (roles) => this.rolesDisponibles.set(roles),
      error: () => this.rolesDisponibles.set([]),
    });
  }

  private cargarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Vuelve a leer la lista desde el servidor para verificar qué hay realmente guardado. */
  recargar(): void {
    if (
      Object.keys(this.pendientes()).length > 0 &&
      !confirm('Hay cambios de rol sin guardarse. ¿Descartarlos y recargar desde el servidor?')
    ) {
      return;
    }
    this.pendientes.set({});
    this.guardadoOkId.set(null);
    this.cargando.set(true);
    this.cargarUsuarios();
  }

  /** Rol que debe mostrar el selector: el pendiente si hay uno, si no el real de la BD. */
  rolElegido(usuario: Usuario): number {
    return this.pendientes()[usuario.id] ?? usuario.roleId;
  }

  tienePendiente(usuario: Usuario): boolean {
    return this.pendientes()[usuario.id] !== undefined;
  }

  seleccionarRol(usuario: Usuario, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const roleId = Number(select.value);
    if (!this.rolesDisponibles().some((r) => r.id === roleId)) return;

    this.pendientes.update((actual) => {
      const { [usuario.id]: _omitido, ...resto } = actual;
      if (roleId === usuario.roleId) return resto;
      return { ...resto, [usuario.id]: roleId };
    });
  }

  guardarRol(usuario: Usuario): void {
    const roleId = this.pendientes()[usuario.id];
    if (roleId === undefined) return;

    const rolNuevo = this.rolesDisponibles().find((r) => r.id === roleId);
    if (!rolNuevo) return;

    // Protección: cambiar el propio rol puede costar el acceso de administrador.
    if (usuario.id === this.miId()) {
      const avisos: string[] = [
        `Vas a cambiar TU propio rol de "${ROLE_LABELS[usuario.rol]}" a "${rolNuevo.label}".`,
      ];
      if (rolNuevo.nombre !== 'ADMINISTRADOR') {
        avisos.push('Perderás el acceso de administrador en tu próximo inicio de sesión.');
      }
      avisos.push('¿Continuar?');
      if (!confirm(avisos.join('\n\n'))) return;
    }

    this.guardandoId.set(usuario.id);
    this.usuarioService.actualizar(usuario.id, { role_id: roleId }).subscribe({
      next: () => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.id === usuario.id ? { ...u, roleId, rol: rolNuevo.nombre } : u)),
        );
        this.pendientes.update(({ [usuario.id]: _omitido, ...resto }) => resto);
        this.guardandoId.set(null);
        this.guardadoOkId.set(usuario.id);
        setTimeout(() => {
          if (this.guardadoOkId() === usuario.id) this.guardadoOkId.set(null);
        }, 3000);
      },
      error: (err) => {
        this.guardandoId.set(null);
        const msg = err?.error?.message;
        const texto = Array.isArray(msg) ? msg[0] : typeof msg === 'string' ? msg : null;
        alert(texto ?? 'No se pudo guardar el rol. Verifica que el servidor esté disponible.');
      },
    });
  }

  cambiarEstado(usuario: Usuario): void {
    const nuevoEstado = !usuario.activo;
    this.usuarioService.actualizar(usuario.id, { activo: nuevoEstado }).subscribe(() => {
      this.usuarios.update((lista) =>
        lista.map((u) => (u.id === usuario.id ? { ...u, activo: nuevoEstado } : u)),
      );
    });
  }

  eliminar(usuario: Usuario): void {
    if (!confirm(`¿Eliminar al usuario "${usuario.nombreCompleto}"?`)) return;
    this.usuarioService.eliminar(usuario.id).subscribe(() => {
      this.usuarios.update((lista) => lista.filter((u) => u.id !== usuario.id));
    });
  }
}
