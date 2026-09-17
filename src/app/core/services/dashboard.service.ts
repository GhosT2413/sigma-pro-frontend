import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardMetricas, DashboardMetricasBackend, mapDashboardMetricas } from '../models/alerta.model';

// dashboard.controller.ts: un solo endpoint, GET /dashboard/metricas.
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  obtenerMetricas(): Observable<DashboardMetricas> {
    return this.http
      .get<DashboardMetricasBackend>(`${environment.apiUrl}/dashboard/metricas`)
      .pipe(map(mapDashboardMetricas));
  }
}
