import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { AlertaService } from '../../core/services/alerta.service';
import { VehiculoService } from '../../core/services/vehiculo.service';
import { ClienteService } from '../../core/services/cliente.service';
import { AuthService } from '../../core/auth/auth.service';
import { Alerta, EstadoAlerta } from '../../core/models/alerta.model';

// GET /alertas (alertas.controller.ts) no filtra por cliente/rol en el backend,
// así que para el rol CLIENTE se filtra en el frontend a sus propios vehículos.
// PATCH /alertas/:id (nuevo) permite al personal de taller marcar el estado.
@Component({
  selector: 'sigma-alertas-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './alertas-list.component.html',
  styleUrl: './alertas-list.component.scss',
})
export class AlertasListComponent {
  private readonly alertaService = inject(AlertaService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly clienteService = inject(ClienteService);
  private readonly auth = inject(AuthService);

  readonly alertas = signal<Alerta[]>([]);
  readonly cargando = signal(true);
  readonly filtroEstado = signal<EstadoAlerta | null>(null);
  readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  // Solo el personal de taller puede cambiar el estado de una alerta (marcarla atendida, etc.).
  readonly puedeGestionar = computed(() => !this.esCliente());
  readonly guardandoId = signal<number | null>(null);

  constructor() {
    this.cargar();
  }

  filtrarPor(estado: EstadoAlerta | null): void {
    this.filtroEstado.set(estado);
    this.cargar();
  }

  cambiarEstado(alerta: Alerta, nuevoEstado: EstadoAlerta): void {
    if (alerta.estado === nuevoEstado) return;
    this.guardandoId.set(alerta.id);
    this.alertaService.actualizarEstado(alerta.id, nuevoEstado).subscribe({
      next: () => {
        this.guardandoId.set(null);
        this.alertas.update((lista) => lista.map((a) => (a.id === alerta.id ? { ...a, estado: nuevoEstado } : a)));
      },
      error: () => this.guardandoId.set(null),
    });
  }

  private cargar(): void {
    this.cargando.set(true);

    // Rol Cliente: primero resolver sus propios vehículos (por usuario_id -> cliente -> vehículos).
    const idsVehiculosPropios$ = this.esCliente()
      ? this.resolverIdsVehiculosPropios()
      : of<number[] | null>(null); // null = sin restricción (personal de taller ve todo)

    idsVehiculosPropios$
      .pipe(
        switchMap((idsPermitidos) =>
          this.alertaService
            .listar({ estado: this.filtroEstado() ?? undefined })
            .pipe(map((alertas) => (idsPermitidos ? alertas.filter((a) => idsPermitidos.includes(a.vehiculoId)) : alertas))),
        ),
      )
      .subscribe({
        next: (data) => {
          this.alertas.set(data);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
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
