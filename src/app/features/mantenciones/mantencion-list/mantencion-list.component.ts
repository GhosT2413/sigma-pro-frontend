import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MantencionService } from '../../../core/services/mantencion.service';
import { Ficha } from '../../../core/models/mantencion.model';

// GET /fichas (agregado a fichas.controller.ts). Soporta ?vehiculoId= para
// "Ver fichas" desde la ficha de un vehículo.
@Component({
  selector: 'sigma-mantencion-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mantencion-list.component.html',
  styleUrl: './mantencion-list.component.scss',
})
export class MantencionListComponent {
  private readonly mantencionService = inject(MantencionService);
  private readonly route = inject(ActivatedRoute);

  readonly fichas = signal<Ficha[]>([]);
  readonly cargando = signal(true);
  readonly filtroVehiculoId = signal<number | null>(null);

  constructor() {
    const vehiculoIdParam = this.route.snapshot.queryParamMap.get('vehiculoId');
    if (vehiculoIdParam) this.filtroVehiculoId.set(Number(vehiculoIdParam));

    this.mantencionService.listar(this.filtroVehiculoId() ?? undefined).subscribe({
      next: (data) => {
        this.fichas.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
