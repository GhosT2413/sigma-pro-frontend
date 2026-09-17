import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { UsuarioService } from '../../core/services/usuario.service';
import { ROLE_LABELS, Usuario } from '../../core/models/usuario.model';

// RF-16: Gestión de Sucursales y Talleres / "Mi Equipo" (exclusivo rol Taller y Administrador)
@Component({
  selector: 'sigma-mi-equipo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-equipo.component.html',
  styleUrl: './mi-equipo.component.scss',
})
export class MiEquipoComponent {
  private readonly usuarioService = inject(UsuarioService);

  readonly equipo = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly roleLabels = ROLE_LABELS;

  constructor() {
    this.usuarioService.miEquipo().subscribe({
      next: (data) => {
        this.equipo.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
