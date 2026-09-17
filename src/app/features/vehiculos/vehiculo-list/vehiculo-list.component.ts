import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, map, of } from 'rxjs';
import { VehiculoService } from '../../../core/services/vehiculo.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Vehiculo } from '../../../core/models/vehiculo.model';

// GET /vehiculos (vehiculos.controller.ts) no filtra por cliente/rol en el backend,
// así que para el rol CLIENTE se filtra en el frontend a sus propios vehículos.
// También soporta ?clienteId= en la URL para "Ver vehículos" desde la ficha de un cliente.
@Component({
  selector: 'sigma-vehiculo-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vehiculo-list.component.html',
  styleUrl: './vehiculo-list.component.scss',
})
export class VehiculoListComponent {
  private readonly vehiculoService = inject(VehiculoService);
  private readonly clienteService = inject(ClienteService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly cargando = signal(true);
  readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  readonly filtroClienteId = signal<number | null>(null);
  readonly filtroClienteNombre = signal<string | null>(null);

  constructor() {
    const clienteIdParam = this.route.snapshot.queryParamMap.get('clienteId');
    if (clienteIdParam) this.filtroClienteId.set(Number(clienteIdParam));
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);

    const idsPermitidos$ = this.esCliente() ? this.resolverIdsVehiculosPropios() : of<number[] | null>(null);

    idsPermitidos$
      .pipe(
        switchMap((idsPermitidos) =>
          this.vehiculoService
            .listar()
            .pipe(map((lista) => (idsPermitidos ? lista.filter((v) => idsPermitidos.includes(v.id)) : lista))),
        ),
      )
      .subscribe({
        next: (data) => {
          const filtroCliente = this.filtroClienteId();
          const lista = filtroCliente ? data.filter((v) => v.clienteId === filtroCliente) : data;
          this.vehiculos.set(lista);
          this.filtroClienteNombre.set(lista[0]?.clienteNombre ?? null);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  eliminar(vehiculo: Vehiculo): void {
    if (!confirm(`¿Eliminar el vehículo ${vehiculo.patente}?`)) return;

    this.vehiculoService.eliminar(vehiculo.id).subscribe(() => {
      this.vehiculos.update((lista) => lista.filter((v) => v.id !== vehiculo.id));
    });
  }

  private resolverIdsVehiculosPropios() {
    const usuarioId = this.auth.usuario()?.id;
    if (!usuarioId) return of<number[]>([]);

    return this.clienteService.obtenerPorUsuarioId(usuarioId).pipe(
      switchMap((miCliente) => {
        if (!miCliente) return of<number[]>([]);
        return this.vehiculoService
          .listar()
          .pipe(map((vehiculos) => vehiculos.filter((v) => v.clienteId === miCliente.id).map((v) => v.id)));
      }),
    );
  }
}
