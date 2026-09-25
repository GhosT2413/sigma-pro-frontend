import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink, Router, NavigationEnd } from '@angular/router';
import { MantencionService } from '../../../core/services/mantencion.service';
import { Ficha } from '../../../core/models/mantencion.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { VehiculoService } from '../../../core/services/vehiculo.service';
import { switchMap, of, map, Subject, takeUntil, filter } from 'rxjs';

// GET /fichas (agregado a fichas.controller.ts). Soporta ?vehiculoId= para
// "Ver fichas" desde la ficha de un vehículo.
@Component({
  selector: 'sigma-mantencion-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mantencion-list.component.html',
  styleUrl: './mantencion-list.component.scss',
})
export class MantencionListComponent implements OnInit, OnDestroy {
  private readonly mantencionService = inject(MantencionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly clienteService = inject(ClienteService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly destroy$ = new Subject<void>();

  readonly fichas = signal<Ficha[]>([]);
  readonly cargando = signal(true);
  readonly filtroVehiculoId = signal<number | null>(null);
  readonly eliminandoId = signal<number | null>(null);

  readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  readonly puedeCrear = computed(() => !this.esCliente());
  readonly puedeEliminar = computed(() => {
    const rol = this.auth.rol();
    return rol === 'TALLER' || rol === 'MECANICO_INDEPENDIENTE' || rol === 'ADMINISTRADOR';
  });

  ngOnInit(): void {
    const vehiculoIdParam = this.route.snapshot.queryParamMap.get('vehiculoId');
    if (vehiculoIdParam) this.filtroVehiculoId.set(Number(vehiculoIdParam));

    this.cargar();

    // Recargar cuando se navega A esta ruta (ej. volver de edición de ficha)
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.urlAfterRedirects.startsWith('/mantenciones')),
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
    if (this.esCliente()) {
      this.cargarFichasCliente();
    } else {
      this.cargarTodas();
    }
  }

  private cargarFichasCliente(): void {
    const usuarioId = this.auth.usuario()?.id;
    const userEmail = this.auth.usuario()?.email;
    if (!usuarioId || !userEmail) {
      this.fichas.set([]);
      this.cargando.set(false);
      return;
    }

    this.clienteService.obtenerPorUsuarioId(usuarioId).pipe(
      switchMap((cliente) => {
        // Fallback: buscar por email si no se encuentra por usuario_id
        if (cliente) {
          return of(cliente);
        }
        return this.clienteService.obtenerPorEmail(userEmail);
      }),
      switchMap((cliente) => {
        if (!cliente) return of<Ficha[]>([]);
        return this.vehiculoService.listar().pipe(
          switchMap((vehiculos) => {
            const misVehiculosIds = vehiculos.filter(v => v.clienteId === cliente.id).map(v => v.id);
            if (misVehiculosIds.length === 0) return of<Ficha[]>([]);
            return this.mantencionService.listar().pipe(
              map((fichas) => fichas.filter(f => 
                misVehiculosIds.includes(f.vehiculoId) && 
                (f.estado === 'LISTO' || f.estado === 'CANCELADO')
              ))
            );
          })
        );
      })
    ).subscribe({
      next: (data) => {
        this.fichas.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private cargarTodas(): void {
    this.mantencionService.listar(this.filtroVehiculoId() ?? undefined).subscribe({
      next: (data) => {
        this.fichas.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  eliminarFicha(id: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar esta ficha de mantención?')) return;
    this.eliminandoId.set(id);
    this.mantencionService.eliminar(id).subscribe({
      next: () => {
        this.fichas.update(f => f.filter(ficha => ficha.id !== id));
        this.eliminandoId.set(null);
      },
      error: () => {
        this.eliminandoId.set(null);
        alert('No se pudo eliminar la ficha.');
      },
    });
  }
}
