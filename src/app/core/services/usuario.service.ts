import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUsuarioPayload, Usuario, UsuarioBackend, mapUsuarioBackend } from '../models/usuario.model';

// PATCH /usuarios/:id agregado a usuarios.controller.ts (editar / activar / desactivar).
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<UsuarioBackend[]>(this.baseUrl).pipe(map((lista) => lista.map(mapUsuarioBackend)));
  }

  /** RF-16 "Mi Equipo" — hoy el backend devuelve siempre los usuarios con role_id = 2. */
  miEquipo(): Observable<Usuario[]> {
    return this.http
      .get<UsuarioBackend[]>(`${this.baseUrl}/equipo`)
      .pipe(map((lista) => lista.map(mapUsuarioBackend)));
  }

  crear(payload: CreateUsuarioPayload): Observable<UsuarioBackend> {
    return this.http.post<UsuarioBackend>(this.baseUrl, payload);
  }

  actualizar(
    id: number,
    payload: { nombre_completo?: string; telefono?: string; activo?: boolean; role_id?: number },
  ): Observable<UsuarioBackend> {
    return this.http.patch<UsuarioBackend>(`${this.baseUrl}/${id}`, payload);
  }
}
