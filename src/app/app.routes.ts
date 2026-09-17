import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';
import { Rol } from './core/models/usuario.model';

// Grupos de roles reutilizados en las rutas (según ERS 2.3 - Características de los Usuarios)
const TODOS: Rol[] = ['CLIENTE', 'MECANICO_INDEPENDIENTE', 'TALLER', 'ADMINISTRADOR'];
const PERSONAL_TALLER: Rol[] = ['MECANICO_INDEPENDIENTE', 'TALLER', 'ADMINISTRADOR'];
const TALLER_ADMIN: Rol[] = ['TALLER', 'ADMINISTRADOR'];
const SOLO_ADMIN: Rol[] = ['ADMINISTRADOR'];

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        data: { roles: TODOS, titulo: 'Dashboard' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        // CU-01 / RF-03: Cliente ve/gestiona sus propios vehículos; personal de taller gestiona los de sus clientes
        path: 'vehiculos',
        data: { roles: TODOS, titulo: 'Vehículos' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/vehiculos/vehiculo-list/vehiculo-list.component').then(
            (m) => m.VehiculoListComponent,
          ),
      },
      {
        path: 'vehiculos/nuevo',
        data: { roles: TODOS, titulo: 'Nuevo vehículo' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/vehiculos/vehiculo-form/vehiculo-form.component').then(
            (m) => m.VehiculoFormComponent,
          ),
      },
      {
        path: 'vehiculos/:id/editar',
        data: { roles: TODOS, titulo: 'Editar vehículo' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/vehiculos/vehiculo-form/vehiculo-form.component').then(
            (m) => m.VehiculoFormComponent,
          ),
      },
      {
        // RF-02: Gestión de Clientes (Mecánico Independiente, Taller, Administrador)
        path: 'clientes',
        data: { roles: PERSONAL_TALLER, titulo: 'Clientes' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/clientes/cliente-list/cliente-list.component').then(
            (m) => m.ClienteListComponent,
          ),
      },
      {
        path: 'clientes/nuevo',
        data: { roles: PERSONAL_TALLER, titulo: 'Nuevo cliente' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/clientes/cliente-form/cliente-form.component').then(
            (m) => m.ClienteFormComponent,
          ),
      },
      {
        path: 'clientes/:id/editar',
        data: { roles: PERSONAL_TALLER, titulo: 'Editar cliente' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/clientes/cliente-form/cliente-form.component').then(
            (m) => m.ClienteFormComponent,
          ),
      },
      {
        // CU-03 / RF-05: Fichas de mantención (personal de taller)
        path: 'mantenciones',
        data: { roles: PERSONAL_TALLER, titulo: 'Fichas de mantención' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/mantenciones/mantencion-list/mantencion-list.component').then(
            (m) => m.MantencionListComponent,
          ),
      },
      {
        path: 'mantenciones/nueva',
        data: { roles: PERSONAL_TALLER, titulo: 'Nueva ficha de mantención' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/mantenciones/mantencion-form/mantencion-form.component').then(
            (m) => m.MantencionFormComponent,
          ),
      },
      {
        path: 'mantenciones/:id/editar',
        data: { roles: PERSONAL_TALLER, titulo: 'Editar ficha de mantención' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/mantenciones/mantencion-form/mantencion-form.component').then(
            (m) => m.MantencionFormComponent,
          ),
      },
      {
        // RF-09: Alertas — visibles para todos los roles, con datos filtrados por el backend
        path: 'alertas',
        data: { roles: TODOS, titulo: 'Alertas' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/alertas/alertas-list.component').then((m) => m.AlertasListComponent),
      },
      {
        // RF-16: "Mi Equipo" — exclusivo Taller y Administrador
        path: 'mi-equipo',
        data: { roles: TALLER_ADMIN, titulo: 'Mi Equipo' },
        canActivate: [roleGuard],
        loadComponent: () => import('./features/mi-equipo/mi-equipo.component').then((m) => m.MiEquipoComponent),
      },
      {
        // ERS 2.2: Módulo de Administración — exclusivo Administrador
        path: 'administracion/usuarios',
        data: { roles: SOLO_ADMIN, titulo: 'Usuarios del sistema' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/administracion/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
