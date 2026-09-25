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
const SOLO_CLIENTE: Rol[] = ['CLIENTE'];
const SOLO_MECANICO_INDEPENDIENTE: Rol[] = ['MECANICO_INDEPENDIENTE'];
const SOLO_TALLER: Rol[] = ['TALLER'];
const CLIENTE_Y_MECANICO: Rol[] = ['CLIENTE', 'MECANICO_INDEPENDIENTE'];
const CLIENTE_MECANICO_ADMIN: Rol[] = ['CLIENTE', 'MECANICO_INDEPENDIENTE', 'ADMINISTRADOR'];

const MENU: ItemMenu[] = [
  { ruta: '/dashboard', etiqueta: 'Dashboard', icono: '📊', roles: TODOS },
  // Cliente ve "Mis Vehículos"
  { ruta: '/vehiculos', etiqueta: 'Mis Vehículos', icono: '🚗', roles: SOLO_CLIENTE },
  // Clientes: solo ADMINISTRADOR (ni MECANICO_INDEPENDIENTE ni TALLER lo ven)
  { ruta: '/clientes', etiqueta: 'Clientes', icono: '👥', roles: SOLO_ADMIN },
  { ruta: '/mantenciones', etiqueta: 'Fichas de mantención', icono: '🛠️', roles: TODOS },
  { ruta: '/alertas', etiqueta: 'Alertas', icono: '🔔', roles: TODOS },
  { ruta: '/mi-equipo', etiqueta: 'Mi Equipo', icono: '🧑‍🔧', roles: TALLER_ADMIN },
  // Perfil: CLIENTE, MECANICO_INDEPENDIENTE, ADMINISTRADOR (NO TALLER)
  { ruta: '/perfil', etiqueta: 'Perfil', icono: '👤', roles: CLIENTE_MECANICO_ADMIN },
  { ruta: '/administracion/usuarios', etiqueta: 'Usuarios', icono: '⚙️', roles: SOLO_ADMIN },
];

const MENU_ADMIN_TEST: ItemMenu[] = [
  { ruta: '/admin/dashboard', etiqueta: 'Dashboard (Admin)', icono: '🛡️', roles: SOLO_ADMIN },
  { ruta: '/admin/vehiculos', etiqueta: 'Vehículos (Admin)', icono: '🚘', roles: SOLO_ADMIN },
  { ruta: '/admin/clientes', etiqueta: 'Clientes (Admin)', icono: '👤', roles: SOLO_ADMIN },
  { ruta: '/admin/mantenciones', etiqueta: 'Fichas (Admin)', icono: '🔧', roles: SOLO_ADMIN },
  { ruta: '/admin/alertas', etiqueta: 'Alertas (Admin)', icono: '⚠️', roles: SOLO_ADMIN },
  { ruta: '/admin/mi-equipo', etiqueta: 'Mi Equipo (Admin)', icono: '👥', roles: SOLO_ADMIN },
  { ruta: '/admin/usuarios', etiqueta: 'Usuarios (Admin)', icono: '🔒', roles: SOLO_ADMIN },
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
  readonly auth = inject(AuthService);

  readonly abierto = signal(false);
  readonly esAdmin = computed(() => this.auth.rol() === 'ADMINISTRADOR');

  readonly itemsVisibles = computed(() => {
    const rol = this.auth.rol();
    if (!rol) return [];
    return MENU.filter((item) => item.roles.includes(rol));
  });

  readonly itemsAdminTest = computed(() => {
    if (!this.esAdmin()) return [];
    return MENU_ADMIN_TEST;
  });

  abrir(): void {
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  cerrarSesion(): void {
    this.auth.logout();
  }
}
