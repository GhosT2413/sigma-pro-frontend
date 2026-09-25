import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, ClienteBackend, CreateClientePayload, mapClienteBackend } from '../models/cliente.model';

interface CrearClienteResponse {
  mensaje: string;
  cliente: ClienteBackend;
}

interface ActualizarClienteResponse {
  mensaje: string;
  cliente: ClienteBackend;
}

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

  crear(payload: CreateClientePayload): Observable<CrearClienteResponse> {
    return this.http.post<CrearClienteResponse>(this.baseUrl, payload);
  }

  actualizar(id: number, payload: Partial<CreateClientePayload>): Observable<ActualizarClienteResponse> {
    return this.http.patch<ActualizarClienteResponse>(`${this.baseUrl}/${id}`, payload);
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

  /**
   * Busca cliente por email del usuario (fallback si usuario_id no coincide)
   */
  obtenerPorEmail(email: string): Observable<Cliente | undefined> {
    return this.http.get<ClienteBackend[]>(this.baseUrl).pipe(
      map((lista) => lista.find((c) => c.email?.toLowerCase() === email.toLowerCase())),
      map((c) => (c ? mapClienteBackend(c) : undefined)),
    );
  }
}
