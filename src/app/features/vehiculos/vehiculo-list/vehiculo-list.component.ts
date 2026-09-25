import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink, Router, NavigationEnd } from '@angular/router';
import { switchMap, map, of, Subject, takeUntil, filter } from 'rxjs';
import { VehiculoService } from '../../../core/services/vehiculo.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Vehiculo } from '../../../core/models/vehiculo.model';

@Component({
  selector: 'sigma-vehiculo-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vehiculo-list.component.html',
  styleUrl: './vehiculo-list.component.scss',
})
export class VehiculoListComponent implements OnInit, OnDestroy {
  private readonly vehiculoService = inject(VehiculoService);
  private readonly clienteService = inject(ClienteService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly cargando = signal(true);
  readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  readonly filtroClienteId = signal<number | null>(null);
  readonly filtroClienteNombre = signal<string | null>(null);
  readonly rutaBase = computed(() => (this.route.snapshot.pathFromRoot.some((r) => r.routeConfig?.path === 'admin') ? '/admin/vehiculos' : '/vehiculos'));

  ngOnInit(): void {
    // Cargar inicial
    this.cargar();

    // Recargar cuando cambien los query params (ej. ?clienteId=)
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const clienteIdParam = params.get('clienteId');
      this.filtroClienteId.set(clienteIdParam ? Number(clienteIdParam) : null);
      this.cargar();
    });

    // Recargar cuando se navega A esta ruta (ej. volver de /vehiculos/nuevo)
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.urlAfterRedirects.startsWith(this.rutaBase())),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cargar();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    const userEmail = this.auth.usuario()?.email;
    if (!usuarioId || !userEmail) return of<number[]>([]);

    return this.clienteService.obtenerPorUsuarioId(usuarioId).pipe(
      switchMap((miCliente) => {
        if (miCliente) {
          return this.vehiculoService
            .listar()
            .pipe(map((vehiculos) => vehiculos.filter((v) => v.clienteId === miCliente.id).map((v) => v.id)));
        }
        // Fallback: buscar por email
        return this.clienteService.obtenerPorEmail(userEmail).pipe(
          switchMap((clientePorEmail) => {
            if (!clientePorEmail) return of<number[]>([]);
            return this.vehiculoService
              .listar()
              .pipe(map((vehiculos) => vehiculos.filter((v) => v.clienteId === clientePorEmail.id).map((v) => v.id)));
          }),
        );
      }),
    );
  }
}
