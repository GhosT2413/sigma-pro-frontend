import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from '../models/usuario.model';

/** Bloquea el acceso a rutas privadas si no hay sesión iniciada. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) return true;

  router.navigate(['/login']);
  return false;
};

/**
 * RBAC (RF-01): cada ruta declara en `data.roles` qué roles pueden verla.
 * Ej: { path: 'mi-equipo', data: { roles: ['TALLER', 'ADMINISTRADOR'] } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rolesPermitidos = route.data['roles'] as Rol[] | undefined;

  if (!rolesPermitidos || rolesPermitidos.length === 0) return true;

  const rolActual = auth.rol();
  if (rolActual && rolesPermitidos.includes(rolActual)) return true;

  router.navigate(['/dashboard']);
  return false;
};
