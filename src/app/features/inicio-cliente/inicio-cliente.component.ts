import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ClienteService } from '../../core/services/cliente.service';
import { VehiculoService } from '../../core/services/vehiculo.service';
import { AlertaService } from '../../core/services/alerta.service';
import { MantencionService } from '../../core/services/mantencion.service';
import { Vehiculo, normalizarFechaVencimiento } from '../../core/models/vehiculo.model';
import { Alerta } from '../../core/models/alerta.model';
import { Ficha } from '../../core/models/mantencion.model';

export type NivelVencimiento = 'VENCIDO' | 'PROXIMO' | 'AL_DIA' | 'SIN_DATO';

export interface EstadoFecha {
  fecha: string | null;
  diasRestantes: number | null;
  nivel: NivelVencimiento;
}

export interface DocumentoVehiculo {
  nombre: string;
  estado: EstadoFecha;
}

export interface VencimientoVehiculo {
  vehiculo: Vehiculo;
  documentos: DocumentoVehiculo[];
}

const DIAS_AVISO = 30;

function evaluarFecha(valor?: string | null): EstadoFecha {
  const fecha = normalizarFechaVencimiento(valor);
  if (!fecha) return { fecha: null, diasRestantes: null, nivel: 'SIN_DATO' };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(vence.getTime())) return { fecha: null, diasRestantes: null, nivel: 'SIN_DATO' };

  const dias = Math.round((vence.getTime() - hoy.getTime()) / 86400000);
  const nivel: NivelVencimiento = dias < 0 ? 'VENCIDO' : dias <= DIAS_AVISO ? 'PROXIMO' : 'AL_DIA';
  return { fecha, diasRestantes: dias, nivel };
}

@Component({
  selector: 'sigma-inicio-cliente',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio-cliente.component.html',
  styleUrl: './inicio-cliente.component.scss',
})
export class InicioClienteComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly clienteService = inject(ClienteService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly alertaService = inject(AlertaService);
  private readonly mantencionService = inject(MantencionService);

  readonly cargando = signal(true);
  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly alertas = signal<Alerta[]>([]);
  readonly fichas = signal<Ficha[]>([]);

  readonly totalVehiculos = computed(() => this.vehiculos().length);

  readonly vehiculosEnTaller = computed(
    () => this.vehiculos().filter((v) => v.estado === 'EN_MANTENIMIENTO').length,
  );

  readonly alertasPendientes = computed(() => this.alertas().filter((a) => a.estado === 'PENDIENTE').length);

  readonly gastoTotal = computed(() =>
    this.fichas()
      .filter((f) => f.estado !== 'CANCELADO')
      .reduce((total, f) => total + (Number(f.costoTotal) || 0), 0),
  );

  readonly vencimientos = computed<VencimientoVehiculo[]>(() =>
    this.vehiculos().map((vehiculo) => ({
      vehiculo,
      documentos: [
        { nombre: 'Revisión técnica', estado: evaluarFecha(vehiculo.vencimientoRevisionTecnica) },
        { nombre: 'SOAP', estado: evaluarFecha(vehiculo.vencimientoSoap) },
        { nombre: 'Permiso de circulación', estado: evaluarFecha(vehiculo.vencimientoPermisoCirculacion) },
      ],
    })),
  );

  readonly sinVehiculos = computed(() => !this.cargando() && this.vehiculos().length === 0);

  ngOnInit(): void {
    this.cargar();
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const [anio, mes, dia] = fecha.split('-');
    return anio && mes && dia ? `${dia}-${mes}-${anio}` : '—';
  }

  textoDias(estado: EstadoFecha): string {
    if (estado.nivel === 'SIN_DATO') return 'Sin dato';
    const dias = estado.diasRestantes ?? 0;
    if (dias < 0) return `Vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
    if (dias === 0) return 'Vence hoy';
    return `Faltan ${dias} ${dias === 1 ? 'día' : 'días'}`;
  }

  badgeClases(estado: EstadoFecha): Record<string, boolean> {
    return {
      'sigma-badge--rojo': estado.nivel === 'VENCIDO',
      'sigma-badge--amarillo': estado.nivel === 'PROXIMO',
      'sigma-badge--verde': estado.nivel === 'AL_DIA',
    };
  }

  private cargar(): void {
    const usuarioId = this.auth.usuario()?.id;
    const email = this.auth.usuario()?.email;
    if (!usuarioId || !email) {
      this.cargando.set(false);
      return;
    }

    this.clienteService
      .obtenerPorUsuarioId(usuarioId)
      .pipe(
        switchMap((cliente) => (cliente ? of(cliente) : this.clienteService.obtenerPorEmail(email))),
        switchMap((cliente) => {
          if (!cliente) return of({ vehiculos: [] as Vehiculo[], alertas: [] as Alerta[], fichas: [] as Ficha[] });

          return forkJoin({
            vehiculos: this.vehiculoService
              .listar()
              .pipe(map((lista) => lista.filter((v) => v.clienteId === cliente.id))),
            alertas: this.alertaService.listar(),
            fichas: this.mantencionService.listar(),
          }).pipe(
            map(({ vehiculos, alertas, fichas }) => {
              const ids = vehiculos.map((v) => v.id);
              return {
                vehiculos,
                alertas: alertas.filter((a) => ids.includes(a.vehiculoId)),
                fichas: fichas.filter((f) => ids.includes(f.vehiculoId)),
              };
            }),
          );
        }),
      )
      .subscribe({
        next: (data) => {
          this.vehiculos.set(data.vehiculos);
          this.alertas.set(data.alertas);
          this.fichas.set(data.fichas);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }
}
