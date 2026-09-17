import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VehiculoService } from '../../../core/services/vehiculo.service';
import { PrediccionService } from '../../../core/services/prediccion.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { MantencionService } from '../../../core/services/mantencion.service';
import { AlertaService } from '../../../core/services/alerta.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PrediccionIa } from '../../../core/models/prediccion.model';
import { UpdateVehiculoPayload, TipoUso, EstadoVehiculo, CreateVehiculoPayload } from '../../../core/models/vehiculo.model';
import { Ficha } from '../../../core/models/mantencion.model';
import { Alerta, EstadoAlerta } from '../../../core/models/alerta.model';

// POST /vehiculos (crear), PATCH /vehiculos/:id (editar datos generales),
// PATCH /vehiculos/:id/kilometraje (único canal para el odómetro, con su regla de negocio).
@Component({
  selector: 'sigma-vehiculo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './vehiculo-form.component.html',
  styleUrl: './vehiculo-form.component.scss',
})
export class VehiculoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly prediccionService = inject(PrediccionService);
  private readonly clienteService = inject(ClienteService);
  private readonly mantencionService = inject(MantencionService);
  private readonly alertaService = inject(AlertaService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly vehiculoId = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  // El Cliente puede editar SU vehículo, pero nunca a qué cliente está asociado
  // (eso evita que reasigne el vehículo a otro cliente desde el formulario).
  readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  readonly esPersonalTaller = computed(() => !this.esCliente());
  readonly clienteNombre = signal<string | null>(null);
  readonly errorSinPerfilCliente = signal(false);

  readonly form = this.fb.nonNullable.group({
    cliente_id: [null as number | null, Validators.required],
    // Criterio de aceptación RF-03: patente chilena AA1234 o AAAA12
    patente: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}\d{4}$|^[A-Z]{4}\d{2}$/)]],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    anio: [new Date().getFullYear(), Validators.min(1950)],
    vin: [''],
    tipo_uso: ['DIARIO' as TipoUso],
    estado: ['ACTIVO' as EstadoVehiculo],
    // Solo se usa al crear; al editar, el kilometraje se guarda con formKilometraje.
    kilometraje_actual: [0, [Validators.required, Validators.min(0)]],
  });

  // --- Actualizar kilometraje (edición) ---
  readonly formKilometraje = this.fb.nonNullable.group({
    nuevo_kilometraje: [0, [Validators.required, Validators.min(0)]],
  });
  readonly guardandoKm = signal(false);
  readonly errorKm = signal<string | null>(null);
  readonly kilometrajeActualRegistrado = signal(0);

  // --- Generar predicción IA (POST /predicciones/generar) ---
  readonly generandoPrediccion = signal(false);
  readonly prediccion = signal<PrediccionIa | null>(null);
  readonly errorPrediccion = signal<string | null>(null);

  // --- Relacionados: historial de fichas y alertas de ESTE vehículo ---
  readonly fichasVehiculo = signal<Ficha[]>([]);
  readonly alertasVehiculo = signal<Alerta[]>([]);
  readonly cargandoRelacionados = signal(false);
  readonly guardandoAlertaId = signal<number | null>(null);

  constructor() {
    if (this.esCliente()) {
      this.form.controls.cliente_id.disable();
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.vehiculoId.set(id);
      this.cargando.set(true);
      this.vehiculoService.obtener(id).subscribe({
        next: (v) => {
          this.form.patchValue({
            cliente_id: v.clienteId ?? null,
            patente: v.patente,
            marca: v.marca,
            modelo: v.modelo,
            anio: v.anio,
            vin: v.vin,
            tipo_uso: v.tipoUso,
            estado: v.estado,
          });
          this.clienteNombre.set(v.clienteNombre ?? null);
          this.kilometrajeActualRegistrado.set(v.kilometrajeActual);
          this.formKilometraje.patchValue({ nuevo_kilometraje: v.kilometrajeActual });
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
      this.cargarRelacionados(id);
    } else if (this.esCliente()) {
      // Al crear: el Cliente no elige dueño, se autoasigna a sí mismo.
      const usuarioId = this.auth.usuario()?.id;
      if (usuarioId) {
        this.clienteService.obtenerPorUsuarioId(usuarioId).subscribe((cliente) => {
          if (cliente) {
            this.form.controls.cliente_id.setValue(cliente.id);
            this.clienteNombre.set(cliente.nombreCompleto);
          } else {
            this.errorSinPerfilCliente.set(true);
          }
        });
      }
    }
  }

  private cargarRelacionados(vehiculoId: number): void {
    this.cargandoRelacionados.set(true);
    this.mantencionService.listar(vehiculoId).subscribe({
      next: (fichas) => this.fichasVehiculo.set(fichas),
      error: () => {},
    });
    this.refrescarAlertasVehiculo(vehiculoId);
  }

  private refrescarAlertasVehiculo(vehiculoId: number): void {
    this.alertaService.listar({ vehiculoId }).subscribe({
      next: (alertas) => {
        this.alertasVehiculo.set(alertas);
        this.cargandoRelacionados.set(false);
      },
      error: () => this.cargandoRelacionados.set(false),
    });
  }

  cambiarEstadoAlerta(alerta: Alerta, nuevoEstado: EstadoAlerta): void {
    if (alerta.estado === nuevoEstado) return;
    this.guardandoAlertaId.set(alerta.id);
    this.alertaService.actualizarEstado(alerta.id, nuevoEstado).subscribe({
      next: () => {
        this.guardandoAlertaId.set(null);
        this.alertasVehiculo.update((lista) =>
          lista.map((a) => (a.id === alerta.id ? { ...a, estado: nuevoEstado } : a)),
        );
      },
      error: () => this.guardandoAlertaId.set(null),
    });
  }

  guardar(): void {
    if (this.vehiculoId()) {
      this.guardarEdicion();
    } else {
      this.crear();
    }
  }

  private crear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.esCliente() && !this.form.controls.cliente_id.value) {
      this.error.set('No encontramos tu perfil de cliente todavía. Espera un momento o recarga la página.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const payload: CreateVehiculoPayload = { ...raw, patente: raw.patente.toUpperCase(), cliente_id: raw.cliente_id! };

    this.vehiculoService.crear(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/vehiculos']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.status === 400 ? 'Ya existe un vehículo con esa patente.' : 'No se pudo crear el vehículo.');
      },
    });
  }

  private guardarEdicion(): void {
    const camposEdicion = ['cliente_id', 'patente', 'marca', 'modelo', 'anio', 'vin', 'tipo_uso', 'estado'] as const;
    for (const campo of camposEdicion) {
      if (this.form.controls[campo].invalid) {
        this.form.controls[campo].markAsTouched();
        return;
      }
    }

    this.guardando.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const payload: UpdateVehiculoPayload = {
      patente: raw.patente.toUpperCase(),
      marca: raw.marca,
      modelo: raw.modelo,
      anio: raw.anio,
      vin: raw.vin,
      tipo_uso: raw.tipo_uso,
      estado: raw.estado,
    };
    // El Cliente nunca manda cliente_id en la edición: el campo va deshabilitado
    // y no queremos que, aunque el backend aún no lo valide, el frontend se lo ofrezca.
    if (!this.esCliente()) {
      payload.cliente_id = raw.cliente_id ?? undefined;
    }

    this.vehiculoService.actualizar(this.vehiculoId()!, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/vehiculos']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.status === 400 ? 'Ya existe un vehículo con esa patente.' : 'No se pudo guardar el vehículo.');
      },
    });
  }

  actualizarKilometraje(): void {
    if (this.formKilometraje.invalid || !this.vehiculoId()) {
      this.formKilometraje.markAllAsTouched();
      return;
    }

    this.guardandoKm.set(true);
    this.errorKm.set(null);

    this.vehiculoService.actualizarKilometraje(this.vehiculoId()!, this.formKilometraje.getRawValue()).subscribe({
      next: (v) => {
        this.guardandoKm.set(false);
        this.kilometrajeActualRegistrado.set(v.kilometraje_actual);
      },
      error: (err) => {
        this.guardandoKm.set(false);
        this.errorKm.set(
          err?.status === 400
            ? 'El kilometraje no puede ser menor al actual registrado.'
            : 'No se pudo actualizar el kilometraje.',
        );
      },
    });
  }

  generarPrediccion(): void {
    if (!this.vehiculoId()) return;
    const raw = this.form.getRawValue();

    this.generandoPrediccion.set(true);
    this.errorPrediccion.set(null);

    this.prediccionService
      .generar({
        vehiculo_id: this.vehiculoId()!,
        kilometraje_actual: this.kilometrajeActualRegistrado(),
        marca: raw.marca,
        modelo: raw.modelo,
        tipo_uso: raw.tipo_uso,
      })
      .subscribe({
        next: (p) => {
          this.prediccion.set(p);
          this.generandoPrediccion.set(false);
          // El backend evalúa umbrales al generar la predicción y puede crear una alerta nueva.
          this.refrescarAlertasVehiculo(this.vehiculoId()!);
        },
        error: () => {
          this.errorPrediccion.set('No se pudo generar la predicción (revisa la GEMINI_API_KEY del backend).');
          this.generandoPrediccion.set(false);
        },
      });
  }
}
