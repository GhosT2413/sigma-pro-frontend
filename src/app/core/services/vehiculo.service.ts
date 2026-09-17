import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateVehiculoPayload,
  UpdateKilometrajePayload,
  UpdateVehiculoPayload,
  Vehiculo,
  VehiculoBackend,
  mapVehiculoBackend,
} from '../models/vehiculo.model';
import { environment } from '../../../environments/environment';

// CRUD completo (agregado en vehiculos.controller.ts: GET:id, PATCH general, DELETE).
@Injectable({ providedIn: 'root' })
export class VehiculoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vehiculos`;

  listar(): Observable<Vehiculo[]> {
    return this.http.get<VehiculoBackend[]>(this.baseUrl).pipe(map((lista) => lista.map(mapVehiculoBackend)));
  }

  obtener(id: number): Observable<Vehiculo> {
    return this.http.get<VehiculoBackend>(`${this.baseUrl}/${id}`).pipe(map(mapVehiculoBackend));
  }

  crear(payload: CreateVehiculoPayload): Observable<VehiculoBackend> {
    return this.http.post<VehiculoBackend>(this.baseUrl, payload);
  }

  /** Edición general (marca/modelo/patente/tipo_uso/estado/cliente) — NO toca el kilometraje. */
  actualizar(id: number, payload: UpdateVehiculoPayload): Observable<VehiculoBackend> {
    return this.http.patch<VehiculoBackend>(`${this.baseUrl}/${id}`, payload);
  }

  actualizarKilometraje(id: number, payload: UpdateKilometrajePayload): Observable<VehiculoBackend> {
    return this.http.patch<VehiculoBackend>(`${this.baseUrl}/${id}/kilometraje`, payload);
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.baseUrl}/${id}`);
  }

  /** Stub en el backend: genera un PDF con solo el título, sin historial real todavía. */
  exportarFichaPdf(vehiculoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${vehiculoId}/pdf`, { responseType: 'blob' });
  }
}
