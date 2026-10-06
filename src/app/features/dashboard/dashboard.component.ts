import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardMetricas } from '../../core/models/alerta.model';
import { ROLE_LABELS } from '../../core/models/usuario.model';
import { InicioClienteComponent } from '../inicio-cliente/inicio-cliente.component';

// RF-11: Dashboard Estadístico — GET /dashboard/metricas (dashboard.controller.ts)
@Component({
  selector: 'sigma-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, InicioClienteComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  readonly auth = inject(AuthService);

  readonly roleLabels = ROLE_LABELS;
  readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  readonly metricas = signal<DashboardMetricas | null>(null);
  readonly cargando = signal(true);

  constructor() {
    if (this.esCliente()) {
      this.cargando.set(false);
      return;
    }

    this.dashboardService.obtenerMetricas().subscribe({
      next: (res) => {
        this.metricas.set(res);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
