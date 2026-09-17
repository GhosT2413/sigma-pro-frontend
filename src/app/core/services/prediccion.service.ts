import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GenerarPrediccionPayload, PrediccionIa } from '../models/prediccion.model';

/**
 * predicciones.controller.ts: un solo endpoint, POST /predicciones/generar.
 * Llama a Gemini en el momento (puede demorar unos segundos) y devuelve UN
 * componente con diagnóstico — no hay GET para traer predicciones pasadas.
 */
@Injectable({ providedIn: 'root' })
export class PrediccionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/predicciones`;

  generar(payload: GenerarPrediccionPayload): Observable<PrediccionIa> {
    return this.http.post<PrediccionIa>(`${this.baseUrl}/generar`, payload);
  }
}
