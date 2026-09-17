import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ROLE_LABELS, Usuario } from '../../../core/models/usuario.model';

// PATCH /usuarios/:id agregado — ya se puede activar/desactivar.
@Component({
  selector: 'sigma-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent {
  private readonly usuarioService = inject(UsuarioService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly roleLabels = ROLE_LABELS;

  constructor() {
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
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
}
