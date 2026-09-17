import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Clase base para servicios CRUD contra la API REST del backend NestJS.
 * Evita repetir los mismos 5 métodos en cada servicio de dominio.
 */
export abstract class CrudBaseService<T, TId = number> {
  protected readonly baseUrl: string;

  protected constructor(
    protected readonly http: HttpClient,
    resourcePath: string,
  ) {
    this.baseUrl = `${environment.apiUrl}/${resourcePath}`;
  }

  listar(params?: Record<string, string | number | boolean>): Observable<T[]> {
    return this.http.get<T[]>(this.baseUrl, { params });
  }

  obtener(id: TId): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`);
  }

  crear(payload: Partial<T>): Observable<T> {
    return this.http.post<T>(this.baseUrl, payload);
  }

  actualizar(id: TId, payload: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${id}`, payload);
  }

  eliminar(id: TId): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
