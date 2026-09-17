import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateFichaPayload, Ficha, FichaMantencionBackend, mapFichaBackend } from '../models/mantencion.model';

// CRUD (agregado en fichas.controller.ts: GET, GET:id, PATCH, además del POST original).
@Injectable({ providedIn: 'root' })
export class MantencionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/fichas`;

  listar(vehiculoId?: number): Observable<Ficha[]> {
    return this.http
      .get<FichaMantencionBackend[]>(this.baseUrl, {
        params: vehiculoId ? { vehiculo_id: vehiculoId } : {},
      })
      .pipe(map((lista) => lista.map(mapFichaBackend)));
  }

  obtener(id: number): Observable<Ficha> {
    return this.http.get<FichaMantencionBackend>(`${this.baseUrl}/${id}`).pipe(map(mapFichaBackend));
  }

  crear(payload: CreateFichaPayload): Observable<FichaMantencionBackend> {
    return this.http.post<FichaMantencionBackend>(this.baseUrl, payload);
  }

  actualizar(id: number, payload: Partial<CreateFichaPayload>): Observable<FichaMantencionBackend> {
    return this.http.patch<FichaMantencionBackend>(`${this.baseUrl}/${id}`, payload);
  }
}
