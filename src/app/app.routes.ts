import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';
import { Rol } from './core/models/usuario.model';

// Grupos de roles reutilizados en las rutas (según ERS 2.3 - Características de los Usuarios)
const TODOS: Rol[] = ['CLIENTE', 'MECANICO_INDEPENDIENTE', 'TALLER', 'ADMINISTRADOR'];
const PERSONAL_TALLER: Rol[] = ['MECANICO_INDEPENDIENTE', 'TALLER', 'ADMINISTRADOR'];
const TALLER_ADMIN: Rol[] = ['TALLER', 'ADMINISTRADOR'];
const SOLO_ADMIN: Rol[] = ['ADMINISTRADOR'];
const CLIENTE_Y_MECANICO: Rol[] = ['CLIENTE', 'MECANICO_INDEPENDIENTE'];
const CLIENTE_Y_MECANICO_TALLER: Rol[] = ['CLIENTE', 'MECANICO_INDEPENDIENTE', 'TALLER', 'ADMINISTRADOR'];
const CLIENTE_MECANICO_ADMIN: Rol[] = ['CLIENTE', 'MECANICO_INDEPENDIENTE', 'ADMINISTRADOR'];

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
        // CU-01 / RF-03: Cliente ve/gestiona sus propios vehículos; Admin puede ver todos
        path: 'vehiculos',
        data: { roles: ['CLIENTE', 'ADMINISTRADOR'], titulo: 'Vehículos' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/vehiculos/vehiculo-list/vehiculo-list.component').then(
            (m) => m.VehiculoListComponent,
          ),
      },
      {
        path: 'vehiculos/nuevo',
        data: { roles: CLIENTE_Y_MECANICO, titulo: 'Nuevo vehículo' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/vehiculos/vehiculo-form/vehiculo-form.component').then(
            (m) => m.VehiculoFormComponent,
          ),
      },
      {
        path: 'vehiculos/:id/editar',
        data: { roles: ['CLIENTE', 'ADMINISTRADOR'], titulo: 'Editar vehículo' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/vehiculos/vehiculo-form/vehiculo-form.component').then(
            (m) => m.VehiculoFormComponent,
          ),
      },
      {
        // RF-02: Gestión de Clientes (solo Administrador)
        path: 'clientes',
        data: { roles: SOLO_ADMIN, titulo: 'Clientes' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/clientes/cliente-list/cliente-list.component').then(
            (m) => m.ClienteListComponent,
          ),
      },
      {
        path: 'clientes/nuevo',
        data: { roles: SOLO_ADMIN, titulo: 'Nuevo cliente' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/clientes/cliente-form/cliente-form.component').then(
            (m) => m.ClienteFormComponent,
          ),
      },
      {
        path: 'clientes/:id/editar',
        data: { roles: SOLO_ADMIN, titulo: 'Editar cliente' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/clientes/cliente-form/cliente-form.component').then(
            (m) => m.ClienteFormComponent,
          ),
      },
      {
        // CU-03 / RF-05: Fichas de mantención (personal de taller + Cliente solo lectura)
        path: 'mantenciones',
        data: { roles: TODOS, titulo: 'Fichas de mantención' },
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
        // CLIENTE: ver ficha en modo solo lectura
        path: 'mantenciones/:id/ver',
        data: { roles: ['CLIENTE'], titulo: 'Ver ficha de mantención' },
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
        // Perfil del usuario — accesible para Cliente, Mecánico Independiente y Administrador (NO TALLER)
        path: 'perfil',
        data: { roles: CLIENTE_MECANICO_ADMIN, titulo: 'Perfil' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
      {
        // ERS 2.2: Módulo de Administración — exclusivo Administrador
        path: 'administracion/usuarios',
        data: { roles: SOLO_ADMIN, titulo: 'Usuarios del sistema' },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/administracion/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },

      // ==========================================
      // RUTAS CLONADAS EXCLUSIVAS PARA ADMINISTRADOR (/admin/*)
      // Permiten al admin auditar, probar y testear el funcionamiento de la app
      // ==========================================
      {
        path: 'admin',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Dashboard' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
          },
          {
            path: 'vehiculos',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Vehículos' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/vehiculos/vehiculo-list/vehiculo-list.component').then(
                (m) => m.VehiculoListComponent,
              ),
          },
          {
            path: 'vehiculos/nuevo',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Nuevo vehículo' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/vehiculos/vehiculo-form/vehiculo-form.component').then(
                (m) => m.VehiculoFormComponent,
              ),
          },
          {
            path: 'vehiculos/:id/editar',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Editar vehículo' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/vehiculos/vehiculo-form/vehiculo-form.component').then(
                (m) => m.VehiculoFormComponent,
              ),
          },
          {
            path: 'clientes',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Clientes' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/clientes/cliente-list/cliente-list.component').then(
                (m) => m.ClienteListComponent,
              ),
          },
          {
            path: 'clientes/nuevo',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Nuevo cliente' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/clientes/cliente-form/cliente-form.component').then(
                (m) => m.ClienteFormComponent,
              ),
          },
          {
            path: 'clientes/:id/editar',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Editar cliente' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/clientes/cliente-form/cliente-form.component').then(
                (m) => m.ClienteFormComponent,
              ),
          },
          {
            path: 'mantenciones',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Fichas de mantención' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/mantenciones/mantencion-list/mantencion-list.component').then(
                (m) => m.MantencionListComponent,
              ),
          },
          {
            path: 'mantenciones/nueva',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Nueva ficha de mantención' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/mantenciones/mantencion-form/mantencion-form.component').then(
                (m) => m.MantencionFormComponent,
              ),
          },
          {
            path: 'mantenciones/:id/editar',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Editar ficha de mantención' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/mantenciones/mantencion-form/mantencion-form.component').then(
                (m) => m.MantencionFormComponent,
              ),
          },
          {
            path: 'alertas',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Alertas' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/alertas/alertas-list.component').then((m) => m.AlertasListComponent),
          },
          {
            path: 'mi-equipo',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Mi Equipo' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/mi-equipo/mi-equipo.component').then((m) => m.MiEquipoComponent),
          },
          {
            path: 'perfil',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Perfil' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/perfil/perfil.component').then((m) => m.PerfilComponent),
          },
          {
            path: 'usuarios',
            data: { roles: SOLO_ADMIN, titulo: 'Admin - Usuarios' },
            canActivate: [roleGuard],
            loadComponent: () =>
              import('./features/administracion/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
