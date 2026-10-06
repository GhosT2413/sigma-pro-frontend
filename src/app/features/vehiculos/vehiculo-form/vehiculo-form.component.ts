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
import { KilometrajeFormatDirective } from '../../../shared/directives/kilometraje-format.directive';
import { PatenteFormatDirective } from '../../../shared/directives/patente-format.directive';

// POST /vehiculos (crear), PATCH /vehiculos/:id (editar datos generales),
// PATCH /vehiculos/:id/kilometraje (único canal para el odómetro, con su regla de negocio).
@Component({
  selector: 'sigma-vehiculo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, KilometrajeFormatDirective, PatenteFormatDirective],
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
  readonly cargandoCliente = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  // El Cliente puede editar SU vehículo, pero nunca a qué cliente está asociado
  // (eso evita que reasigne el vehículo a otro cliente desde el formulario).
  readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  readonly esPersonalTaller = computed(() => !this.esCliente());
  readonly clienteNombre = signal<string | null>(null);
  readonly clienteRut = signal<string | null>(null);

  readonly clienteDisplay = computed(() => {
    const nombre = this.clienteNombre();
    const rut = this.clienteRut();
    if (!nombre) return 'Tu perfil de cliente';
    return rut ? `${nombre} - ${rut}` : nombre;
  });

  readonly rutaBase = computed(() => (this.route.snapshot.pathFromRoot.some((r) => r.routeConfig?.path === 'admin') ? '/admin/vehiculos' : '/vehiculos'));

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
    // RUT del cliente (solo para CLIENTE al crear su primer vehículo)
    rut: [''],
    vencimiento_revision_tecnica: [null as string | null],
    vencimiento_soap: [null as string | null],
    vencimiento_permiso_circulacion: [null as string | null],
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
    // Para clientes: NO deshabilitar el control (necesita enviarse en el submit)
    // En el template se muestra como solo-lectura visual

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
            vencimiento_revision_tecnica: v.vencimientoRevisionTecnica ?? null,
            vencimiento_soap: v.vencimientoSoap ?? null,
            vencimiento_permiso_circulacion: v.vencimientoPermisoCirculacion ?? null,
          });
          this.clienteNombre.set(v.clienteNombre ?? null);
          // Note: v doesn't include RUT from backend, would need additional fetch if needed
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
            this.clienteRut.set(cliente.rut ?? null);
} else {
            // Auto-crear perfil de Cliente ligado al Usuario
            // NOTA: NO enviar usuario_id, el backend lo deriva del token JWT
            this.clienteService.crear({
              nombre_completo: this.auth.usuario()?.nombreCompleto || '',
              email: this.auth.usuario()?.email || '',
              telefono: this.auth.usuario()?.telefono || undefined,
            }).subscribe({
              next: (res) => {
                this.form.controls.cliente_id.setValue(res.cliente.id);
                this.clienteNombre.set(res.cliente.nombre_completo);
                this.clienteRut.set(res.cliente.rut ?? null);
                this.crearVehiculo();
              },
              error: (err) => {
                // Mostrar error real del backend
                const msg = err?.error?.message;
                if (Array.isArray(msg)) {
                  this.error.set(msg.join('. '));
                } else if (typeof msg === 'string') {
                  this.error.set(msg);
                } else {
                  this.error.set('No se pudo crear tu perfil de cliente automáticamente.');
                }
              },
            });
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
    // Para clientes: asegurar que cliente_id esté seteado antes de validar
    if (this.esCliente() && !this.form.controls.cliente_id.value) {
      const usuarioId = this.auth.usuario()?.id;
      const userEmail = this.auth.usuario()?.email;
      if (usuarioId && userEmail) {
        this.cargandoCliente.set(true);
        this.clienteService.obtenerPorUsuarioId(usuarioId).subscribe({
          next: (cliente) => {
            if (cliente) {
              this.form.controls.cliente_id.setValue(cliente.id);
              this.crearVehiculo();
            } else {
              // Fallback: buscar por email por si el usuario_id no coincide
              this.clienteService.obtenerPorEmail(userEmail).subscribe({
                next: (clientePorEmail) => {
                  if (clientePorEmail) {
                    this.form.controls.cliente_id.setValue(clientePorEmail.id);
                    this.crearVehiculo();
                  } else {
                    this.autoCrearClienteYVehiculo(usuarioId);
                  }
                },
                error: () => this.autoCrearClienteYVehiculo(usuarioId),
              });
            }
          },
          error: (err) => {
            // Si falla la búsqueda (ej. error de red, backend caído), intentar auto-crear
            console.warn('Error obteniendo perfil de cliente, intentando auto-crear:', err);
            this.autoCrearClienteYVehiculo(usuarioId);
          },
        });
        return;
      }
    }

    this.crearVehiculo();
  }

  private autoCrearClienteYVehiculo(usuarioId: number): void {
    // Auto-crear perfil - payload explícito sin spread
    // NOTA: NO enviar usuario_id, el backend lo deriva del token JWT
    const raw = this.form.getRawValue();
    const clientePayload = {
      nombre_completo: String(this.auth.usuario()?.nombreCompleto || ''),
      email: String(this.auth.usuario()?.email || ''),
      rut: raw.rut?.trim().toUpperCase() || undefined,
    } as any;
    
    if (this.auth.usuario()?.telefono) {
      clientePayload.telefono = String(this.auth.usuario()?.telefono);
    }
    
    this.clienteService.crear(clientePayload).subscribe({
      next: (res) => {
        this.form.controls.cliente_id.setValue(res.cliente.id);
        this.crearVehiculo();
      },
      error: (err) => {
        this.cargandoCliente.set(false);
        const msg = err?.error?.message;
        if (Array.isArray(msg)) {
          this.error.set(msg.join('. '));
        } else if (typeof msg === 'string') {
          this.error.set(msg);
        } else {
          this.error.set('No se pudo crear tu perfil de cliente automáticamente.');
        }
      },
    });
  }

private crearVehiculo(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    this.mensajeExito.set(null);
    const raw = this.form.getRawValue();
    
    // Construcción manual absoluta - SOLO las 9 propiedades exactas permitidas
    const payload: CreateVehiculoPayload = {
      cliente_id: Number(raw.cliente_id),
      patente: String(raw.patente).toUpperCase(),
      marca: String(raw.marca),
      modelo: String(raw.modelo),
    } as CreateVehiculoPayload;

    // Campos opcionales - solo agregar si tienen valor
    if (raw.anio && raw.anio > 0) payload.anio = Number(raw.anio);
    if (raw.vin && raw.vin.trim()) payload.vin = String(raw.vin).trim();
    payload.kilometraje_actual = Number(raw.kilometraje_actual) || 0;
    if (raw.tipo_uso) payload.tipo_uso = raw.tipo_uso as any;
    if (raw.estado) payload.estado = raw.estado as any;
    if (raw.vencimiento_revision_tecnica) payload.vencimiento_revision_tecnica = raw.vencimiento_revision_tecnica;
    if (raw.vencimiento_soap) payload.vencimiento_soap = raw.vencimiento_soap;
    if (raw.vencimiento_permiso_circulacion) payload.vencimiento_permiso_circulacion = raw.vencimiento_permiso_circulacion;

    this.vehiculoService.crear(payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.mensajeExito.set(res.mensaje || 'El vehículo fue creado exitosamente.');

        setTimeout(() => {
          this.router.navigate([this.rutaBase()]);
        }, 1200);
      },
      error: (err) => {
        this.guardando.set(false);
        // Usar el mensaje del backend si está disponible
        const backendMessage = err?.error?.message;
        this.error.set(backendMessage || (err?.status === 400 ? 'Ya existe un vehículo con esa patente.' : 'No se pudo crear el vehículo.'));
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
    this.mensajeExito.set(null);
    const raw = this.form.getRawValue();
    const payload: UpdateVehiculoPayload = {
      patente: raw.patente.toUpperCase(),
      marca: raw.marca,
      modelo: raw.modelo,
      anio: raw.anio,
      vin: raw.vin,
      tipo_uso: raw.tipo_uso,
      estado: raw.estado,
      vencimiento_revision_tecnica: raw.vencimiento_revision_tecnica,
      vencimiento_soap: raw.vencimiento_soap,
      vencimiento_permiso_circulacion: raw.vencimiento_permiso_circulacion,
    };
    // El Cliente nunca manda cliente_id en la edición: el campo va deshabilitado
    // y no queremos que, aunque el backend aún no lo valide, el frontend se lo ofrezca.
    if (!this.esCliente()) {
      payload.cliente_id = raw.cliente_id ?? undefined;
    }

    this.vehiculoService.actualizar(this.vehiculoId()!, payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.mensajeExito.set(res.mensaje || 'El vehículo fue actualizado exitosamente.');

        setTimeout(() => {
          this.router.navigate([this.rutaBase()]);
        }, 1200);
      },
      error: (err) => {
        this.guardando.set(false);
        const backendMessage = err?.error?.message;
        this.error.set(backendMessage || (err?.status === 400 ? 'Ya existe un vehículo con esa patente.' : 'No se pudo guardar el vehículo.'));
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
        const backendMessage = err?.error?.message;
        this.errorKm.set(
          backendMessage || (err?.status === 400
            ? 'El kilometraje no puede ser menor al actual registrado.'
            : 'No se pudo actualizar el kilometraje.'),
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
          this.refrescarAlertasVehiculo(this.vehiculoId()!);
        },
        error: (err) => {
          console.error('Error generando predicción:', err);
          let msg = err?.error?.message || err?.message || 'Error desconocido';
          if (msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
            msg = 'Gemini está saturado (503). Intenta de nuevo en unos segundos.';
          } else if (msg.includes('PERMISSION_DENIED') || msg.includes('denied access')) {
            msg = 'La API Key no tiene acceso a Gemini. Verifica en Google AI Studio que el proyecto tenga la API habilitada.';
          }
          this.errorPrediccion.set(`No se pudo generar la predicción: ${msg}`);
          this.generandoPrediccion.set(false);
        },
      });
  }
}
