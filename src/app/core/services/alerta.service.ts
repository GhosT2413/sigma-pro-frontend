import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alerta, AlertaBackend, EstadoAlerta, TipoAlerta, mapAlertaBackend, CreateAlertaPayload } from '../models/alerta.model';

// GET /alertas (nuevo, agregado a alertas.controller.ts). Filtros opcionales por query params.
@Injectable({ providedIn: 'root' })
export class AlertaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/alertas`;

  listar(filtros?: { vehiculoId?: number; estado?: EstadoAlerta; tipo?: TipoAlerta }): Observable<Alerta[]> {
    const params: Record<string, string | number> = {};
    if (filtros?.vehiculoId) params['vehiculo_id'] = filtros.vehiculoId;
    if (filtros?.estado) params['estado'] = filtros.estado;

    return this.http.get<AlertaBackend[]>(this.baseUrl, { params }).pipe(
      map((lista) => lista.map(mapAlertaBackend)),
      // El backend no filtra por 'tipo' (Amarillo/Rojo) todavía, así que si se pide, se filtra acá.
      map((lista) => (filtros?.tipo ? lista.filter((a) => a.tipo === filtros.tipo) : lista)),
    );
  }

  /** POST /alertas — crear alerta para el cliente */
  crear(payload: CreateAlertaPayload): Observable<AlertaBackend> {
    return this.http.post<AlertaBackend>(this.baseUrl, payload);
  }

  /** PATCH /alertas/:id (nuevo) — cambiar el estado, ej. marcarla Atendida al terminar el trabajo. */
  actualizarEstado(id: number, estado: EstadoAlerta): Observable<AlertaBackend> {
    return this.http.patch<AlertaBackend>(`${this.baseUrl}/${id}`, { estado });
  }
}
