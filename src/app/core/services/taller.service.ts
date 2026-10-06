import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Taller, TallerBackend, mapTallerBackend } from '../models/taller.model';

// Endpoints disponibles en talleres.controller.ts: GET /talleres, GET /talleres/:id,
// GET /talleres/usuario/:usuarioId.
@Injectable({ providedIn: 'root' })
export class TallerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/talleres`;

  listar(): Observable<Taller[]> {
    return this.http.get<TallerBackend[]>(this.baseUrl).pipe(map((lista) => lista.map(mapTallerBackend)));
  }

  obtener(id: number): Observable<Taller> {
    return this.http.get<TallerBackend>(`${this.baseUrl}/${id}`).pipe(map(mapTallerBackend));
  }

  /** Taller asociado a un usuario (null si no tiene taller registrado). */
  buscarPorUsuario(usuarioId: number): Observable<Taller | null> {
    return this.http
      .get<TallerBackend | null>(`${this.baseUrl}/usuario/${usuarioId}`)
      .pipe(map((t) => (t ? mapTallerBackend(t) : null)));
  }
}
