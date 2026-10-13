import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ROLE_LABELS, Rol } from '../models/usuario.model';

/** Opción de rol tal como se ofrece en los selectores (id + etiqueta legible). */
export interface RolOption {
  id: number;
  nombre: Rol;
  label: string;
}

// GET /roles (roles.controller.ts) — catálogo de roles activos de la tabla `roles`.
@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/roles`;

  listar(): Observable<RolOption[]> {
    return this.http
      .get<{ id: number; nombre: string }[]>(this.baseUrl)
      .pipe(
        map((roles) =>
          roles.map((r) => ({
            id: r.id,
            nombre: r.nombre as Rol,
            label: ROLE_LABELS[r.nombre as Rol] ?? r.nombre,
          })),
        ),
      );
  }
}
