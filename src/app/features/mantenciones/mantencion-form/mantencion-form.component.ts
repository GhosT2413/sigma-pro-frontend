import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MantencionService } from '../../../core/services/mantencion.service';
import { EstadoFicha } from '../../../core/models/mantencion.model';

// POST /fichas (crear) y PATCH /fichas/:id (editar).
@Component({
  selector: 'sigma-mantencion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './mantencion-form.component.html',
  styleUrl: './mantencion-form.component.scss',
})
export class MantencionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly mantencionService = inject(MantencionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly fichaId = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    vehiculo_id: [null as number | null, Validators.required],
    taller_id: [null as number | null],
    mecanico_id: [null as number | null],
    kilometraje_ingreso: [0, [Validators.required, Validators.min(0)]],
    kilometraje_salida: [null as number | null],
    horas_trabajadas: [0, Validators.min(0)],
    valor_hora: [0, Validators.min(0)],
    costo_repuestos: [0, Validators.min(0)],
    descripcion: [''],
    diagnostico: [''],
    trabajo_realizado: [''],
    estado: ['EN_ESPERA' as EstadoFicha],
  });

  readonly costoManoObra = computed(() => {
    const { horas_trabajadas, valor_hora } = this.form.getRawValue();
    return horas_trabajadas * valor_hora;
  });

  readonly costoTotal = computed(() => this.costoManoObra() + this.form.getRawValue().costo_repuestos);

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
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
            horas_trabajadas: f.horasTrabajadas,
            valor_hora: f.valorHora,
            costo_repuestos: f.costoRepuestos,
            descripcion: f.descripcion,
            diagnostico: f.diagnostico,
            trabajo_realizado: f.trabajoRealizado,
            estado: f.estado,
          });
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
    } else {
      // Al crear: si venimos desde "+ Nueva ficha" de un vehículo específico, se precompleta.
      const vehiculoIdParam = this.route.snapshot.queryParamMap.get('vehiculoId');
      if (vehiculoIdParam) {
        this.form.patchValue({ vehiculo_id: Number(vehiculoIdParam) });
      }
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
      costo_mano_obra: this.costoManoObra(),
      costo_total: this.costoTotal(),
    };

    const peticion = this.fichaId()
      ? this.mantencionService.actualizar(this.fichaId()!, payload)
      : this.mantencionService.crear(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/mantenciones']);
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar la ficha.');
      },
    });
  }
}
