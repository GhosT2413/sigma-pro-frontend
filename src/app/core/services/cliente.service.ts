import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, ClienteBackend, CreateClientePayload, mapClienteBackend } from '../models/cliente.model';

// CRUD completo (agregado en clientes.controller.ts: GET, GET:id, PATCH, DELETE, además del POST original).
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clientes`;

  listar(): Observable<Cliente[]> {
    return this.http.get<ClienteBackend[]>(this.baseUrl).pipe(map((lista) => lista.map(mapClienteBackend)));
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<ClienteBackend>(`${this.baseUrl}/${id}`).pipe(map(mapClienteBackend));
  }

  crear(payload: CreateClientePayload): Observable<ClienteBackend> {
    return this.http.post<ClienteBackend>(this.baseUrl, payload);
  }

  actualizar(id: number, payload: Partial<CreateClientePayload>): Observable<ClienteBackend> {
    return this.http.patch<ClienteBackend>(`${this.baseUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Resuelve el registro de Cliente ligado a un usuario logueado con rol CLIENTE
   * (via cliente.usuario_id), para que el formulario de Vehículo pueda auto-asignar
   * el dueño sin dejar que el propio Cliente elija o cambie el cliente_id.
   * GET /clientes no filtra por usuario_id en el backend, así que se resuelve en el cliente.
   */
  obtenerPorUsuarioId(usuarioId: number): Observable<Cliente | undefined> {
    return this.http.get<ClienteBackend[]>(this.baseUrl).pipe(
      map((lista) => lista.find((c) => c.usuario_id === usuarioId)),
      map((c) => (c ? mapClienteBackend(c) : undefined)),
    );
  }
}
