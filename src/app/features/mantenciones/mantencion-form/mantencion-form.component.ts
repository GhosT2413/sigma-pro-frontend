import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MantencionService } from '../../../core/services/mantencion.service';
import { VehiculoService } from '../../../core/services/vehiculo.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { AlertaService } from '../../../core/services/alerta.service';
import { AuthService } from '../../../core/auth/auth.service';
import { EstadoFicha } from '../../../core/models/mantencion.model';
import { KilometrajeFormatDirective } from '../../../shared/directives/kilometraje-format.directive';
import { PatenteFormatDirective } from '../../../shared/directives/patente-format.directive';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'sigma-mantencion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, KilometrajeFormatDirective, PatenteFormatDirective],
  templateUrl: './mantencion-form.component.html',
  styleUrl: './mantencion-form.component.scss',
})
export class MantencionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly mantencionService = inject(MantencionService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly clienteService = inject(ClienteService);
  private readonly alertaService = inject(AlertaService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly fichaId = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly esTaller = computed(() => this.auth.rol() === 'TALLER');
  readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  // Modo solo lectura (ruta /ver para CLIENTE)
  readonly soloLectura = computed(() => this.route.snapshot.url.some(s => s.path === 'ver'));

  // Para TALLER: usamos patente en lugar de ID
  readonly patente = signal<string>('');

  readonly form = this.fb.nonNullable.group({
    vehiculo_id: [null as number | null, Validators.required],
    taller_id: [null as number | null],
    mecanico_id: [null as number | null],
    kilometraje_ingreso: [0, [Validators.required, Validators.min(0)]],
    kilometraje_salida: [null as number | null],
    valor_arreglo: [0, Validators.min(0)],
    costo_repuestos: [0, Validators.min(0)],
    descripcion: [''],
    diagnostico: [''],
    trabajo_realizado: [''],
    estado: ['EN_ESPERA' as EstadoFicha],
  });

  private readonly valorArregloSignal = toSignal(this.form.controls.valor_arreglo.valueChanges, { initialValue: 0 });
  private readonly costoRepuestosSignal = toSignal(this.form.controls.costo_repuestos.valueChanges, { initialValue: 0 });

  readonly costoTotal = computed(() => this.valorArregloSignal() + this.costoRepuestosSignal());

  // Info del vehículo para mostrar
  readonly vehiculoInfo = signal<{ patente: string; marca: string; modelo: string; anio: number; clienteNombre: string; clienteRut?: string } | null>(null);

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const isVer = this.route.snapshot.url.some(s => s.path === 'ver');
    if (idParam) {
      const id = Number(idParam);
      this.fichaId.set(id);
      this.cargando.set(true);
      this.mantencionService.obtener(id).subscribe({
        next: (f) => {
          this.form.patchValue({
            vehiculo_id: f.vehiculoId,
            taller_id: f.tallerId ?? null,
            mecanico_id: f.mecanicoId ?? null,
            kilometraje_ingreso: f.kilometrajeIngreso,
            kilometraje_salida: f.kilometrajeSalida ?? null,
            valor_arreglo: f.valorArreglo,
            costo_repuestos: f.costoRepuestos,
            descripcion: f.descripcion,
            diagnostico: f.diagnostico,
            trabajo_realizado: f.trabajoRealizado,
            estado: f.estado,
          });
          this.cargarInfoVehiculo(f.vehiculoId);
          // Si es modo solo lectura, deshabilitar todos los campos
          if (isVer || this.soloLectura()) {
            this.form.disable();
          }
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
    } else {
      // Al crear: si venimos desde "+ Nueva ficha" de un vehículo específico, se precompleta.
      const vehiculoIdParam = this.route.snapshot.queryParamMap.get('vehiculoId');
      if (vehiculoIdParam) {
        const vehiculoId = Number(vehiculoIdParam);
        this.form.patchValue({ vehiculo_id: vehiculoId });
        this.cargarInfoVehiculo(vehiculoId);
      }
    }
  }

  private cargarInfoVehiculo(vehiculoId: number): void {
    this.vehiculoService.obtener(vehiculoId).subscribe({
      next: (v) => {
        this.form.controls.kilometraje_ingreso.setValue(v.kilometrajeActual);
        this.vehiculoInfo.set({
          patente: v.patente,
          marca: v.marca,
          modelo: v.modelo,
          anio: v.anio ?? new Date().getFullYear(),
          clienteNombre: v.clienteNombre ?? '',
          clienteRut: undefined,
        });
        // Buscar RUT del cliente si hay cliente_id
        if (v.clienteId) {
          this.clienteService.obtener(v.clienteId).subscribe({
            next: (c) => this.vehiculoInfo.update(info => info ? { ...info, clienteRut: c.rut } : null),
            error: () => {},
          });
        }
      },
      error: () => {},
    });
  }

  /** Busca vehículo por patente y auto-rellena kilometraje y datos del dueño */
  buscarPorPatente(): void {
    const patente = this.patente().trim().toUpperCase().replace(/\s+/g, '');
    if (!patente) {
      this.limpiarDatosVehiculo();
      return;
    }

    this.cargando.set(true);
    this.vehiculoService.obtenerPorPatente(patente).subscribe({
      next: (vehiculo) => {
        this.cargando.set(false);
        if (vehiculo) {
          this.form.patchValue({ vehiculo_id: vehiculo.id });
          this.form.controls.kilometraje_ingreso.setValue(vehiculo.kilometrajeActual);
          this.vehiculoInfo.set({
            patente: vehiculo.patente,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            anio: vehiculo.anio ?? new Date().getFullYear(),
            clienteNombre: vehiculo.clienteNombre ?? '',
            clienteRut: undefined,
          });
          if (vehiculo.clienteId) {
            this.clienteService.obtener(vehiculo.clienteId).subscribe({
              next: (c) => this.vehiculoInfo.update(info => info ? { ...info, clienteRut: c.rut } : null),
              error: () => {},
            });
          }
        } else {
          this.error.set(`No se encontró vehículo con patente ${patente}`);
          this.vehiculoInfo.set(null);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Error al buscar el vehículo');
      },
    });
  }

  /** Limpia todos los datos del vehículo cuando se borra la patente */
  limpiarDatosVehiculo(): void {
    this.form.patchValue({ vehiculo_id: null });
    this.form.controls.kilometraje_ingreso.setValue(0);
    this.vehiculoInfo.set(null);
    this.error.set(null);
  }

  /** Detecta cuando se limpia la patente y limpia el formulario */
  onPatenteChange(): void {
    const patente = this.patente().trim();
    if (!patente) {
      this.limpiarDatosVehiculo();
    }
  }

guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      vehiculo_id: raw.vehiculo_id!,
      taller_id: raw.taller_id ?? undefined,
      mecanico_id: raw.mecanico_id ?? undefined,
      kilometraje_salida: raw.kilometraje_salida ?? undefined,
      costo_total: this.costoTotal(),
    };

    const peticion = this.fichaId()
      ? this.mantencionService.actualizar(this.fichaId()!, payload)
      : this.mantencionService.crear(payload);

    peticion.subscribe({
      next: () => {
        // Crear alerta al cliente según el estado
        if (raw.vehiculo_id && (raw.estado === 'LISTO' || raw.estado === 'CANCELADO' || raw.estado === 'EN_MANTENIMIENTO')) {
          this.crearAlertaCliente(raw.vehiculo_id!, raw.estado);
        }

        // Si el estado es LISTO y hay kilometraje de salida, actualizar el vehículo
        if (raw.estado === 'LISTO' && raw.kilometraje_salida && raw.kilometraje_salida > 0 && raw.vehiculo_id) {
          this.vehiculoService.actualizarKilometraje(raw.vehiculo_id!, { nuevo_kilometraje: raw.kilometraje_salida }).subscribe({
            next: () => {
              this.guardando.set(false);
              this.router.navigate(['/mantenciones']);
            },
            error: () => {
              // Aunque falle la actualización de kilometraje, la ficha se guardó
              this.guardando.set(false);
              this.router.navigate(['/mantenciones']);
            },
          });
        } else {
          this.guardando.set(false);
          this.router.navigate(['/mantenciones']);
        }
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar la ficha.');
      },
    });
  }

  /** Crea alerta automática al cliente según el estado de la ficha */
  private crearAlertaCliente(vehiculoId: number, estado: string): void {
    let descripcion = '';
    let tipo: 'AMARILLO' | 'ROJO' | 'VERDE' = 'AMARILLO';

    switch (estado) {
      case 'LISTO':
        descripcion = 'Tu Vehículo esta listo, ven a buscarlo';
        tipo = 'VERDE';
        break;
      case 'CANCELADO':
        descripcion = 'Tu Vehículo fue cancelado, no se pudo arreglar';
        tipo = 'ROJO';
        break;
      case 'EN_MANTENIMIENTO':
        descripcion = 'Tu vehículo está en mantenimiento';
        tipo = 'AMARILLO';
        break;
      default:
        return; // No crear alerta para otros estados
    }

    this.alertaService.crear({
      vehiculo_id: vehiculoId,
      tipo,
      descripcion,
      estado: 'PENDIENTE',
    }).subscribe({
      next: () => console.log('Alerta creada para cliente'),
      error: (err) => console.warn('No se pudo crear alerta:', err),
    });
  }

  volver(): void {
    this.router.navigate(['/mantenciones']);
  }
}
