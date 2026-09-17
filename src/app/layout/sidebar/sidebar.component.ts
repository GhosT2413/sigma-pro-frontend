import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Rol } from '../../core/models/usuario.model';

interface ItemMenu {
  ruta: string;
  etiqueta: string;
  icono: string;
  roles: Rol[];
}

const TODOS: Rol[] = ['CLIENTE', 'MECANICO_INDEPENDIENTE', 'TALLER', 'ADMINISTRADOR'];
const PERSONAL_TALLER: Rol[] = ['MECANICO_INDEPENDIENTE', 'TALLER', 'ADMINISTRADOR'];
const TALLER_ADMIN: Rol[] = ['TALLER', 'ADMINISTRADOR'];
const SOLO_ADMIN: Rol[] = ['ADMINISTRADOR'];

const MENU: ItemMenu[] = [
  { ruta: '/dashboard', etiqueta: 'Dashboard', icono: '📊', roles: TODOS },
  { ruta: '/vehiculos', etiqueta: 'Vehículos', icono: '🚗', roles: TODOS },
  { ruta: '/clientes', etiqueta: 'Clientes', icono: '👥', roles: PERSONAL_TALLER },
  { ruta: '/mantenciones', etiqueta: 'Fichas de mantención', icono: '🛠️', roles: PERSONAL_TALLER },
  { ruta: '/alertas', etiqueta: 'Alertas', icono: '🔔', roles: TODOS },
  { ruta: '/mi-equipo', etiqueta: 'Mi Equipo', icono: '🧑‍🔧', roles: TALLER_ADMIN },
  { ruta: '/administracion/usuarios', etiqueta: 'Usuarios', icono: '⚙️', roles: SOLO_ADMIN },
];

@Component({
  selector: 'sigma-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  exportAs: 'sidebar',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  readonly abierto = signal(false);

  readonly itemsVisibles = computed(() => {
    const rol = this.auth.rol();
    if (!rol) return [];
    return MENU.filter((item) => item.roles.includes(rol));
  });

  abrir(): void {
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
  }
}
