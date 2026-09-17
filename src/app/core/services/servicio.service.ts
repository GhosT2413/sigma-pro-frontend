import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServicioCatalogo } from '../models/servicio.model';

// servicios.controller.ts: CRUD completo, todo detrás de JwtAuthGuard.
@Injectable({ providedIn: 'root' })
export class ServicioCatalogoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/servicios`;

  listar(): Observable<ServicioCatalogo[]> {
    return this.http.get<ServicioCatalogo[]>(this.baseUrl);
  }

  obtener(id: number): Observable<ServicioCatalogo> {
    return this.http.get<ServicioCatalogo>(`${this.baseUrl}/${id}`);
  }

  crear(payload: Partial<ServicioCatalogo>): Observable<ServicioCatalogo> {
    return this.http.post<ServicioCatalogo>(this.baseUrl, payload);
  }

  actualizar(id: number, payload: Partial<ServicioCatalogo>): Observable<ServicioCatalogo> {
    return this.http.patch<ServicioCatalogo>(`${this.baseUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.baseUrl}/${id}`);
  }
}
