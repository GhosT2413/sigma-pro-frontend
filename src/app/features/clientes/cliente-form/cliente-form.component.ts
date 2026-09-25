import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClienteService } from '../../../core/services/cliente.service';
import { RutFormatDirective } from '../../../shared/directives/rut-format.directive';
import { validarRutChileno } from '../../../shared/validators/rut.validator';

// POST /clientes (crear) y PATCH /clientes/:id (editar)
@Component({
  selector: 'sigma-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RutFormatDirective],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.scss',
})
export class ClienteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly clienteId = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly rutaBase = computed(() =>
    this.route.snapshot.pathFromRoot.some((r) => r.routeConfig?.path === 'admin') ? '/admin/clientes' : '/clientes'
  );

  readonly form = this.fb.nonNullable.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
    rut: ['', [Validators.required, validarRutChileno]],
    email: ['', [Validators.email]],
    telefono: [''],
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.clienteId.set(id);
      this.cargando.set(true);
      this.clienteService.obtener(id).subscribe({
        next: (c) => {
          this.form.patchValue({
            nombre_completo: c.nombreCompleto,
            rut: c.rut ?? '',
            email: c.email ?? '',
            telefono: c.telefono ?? '',
          });
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('No se pudo cargar la información del cliente.');
        },
      });
    }
  }

  guardar(): void {
    this.error.set(null);
    this.mensajeExito.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.controls.rut.errors?.['rutInvalido']) {
        this.error.set('El RUT ingresado no es válido (verifica el formato y dígito verificador).');
      } else if (this.form.controls.nombre_completo.invalid) {
        this.error.set('El nombre completo es obligatorio.');
      } else {
        this.error.set('Por favor completa los campos requeridos correctamente.');
      }
      return;
    }

    this.guardando.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      rut: raw.rut ? raw.rut.trim().toUpperCase() : undefined,
      email: raw.email ? raw.email.trim() : undefined,
      telefono: raw.telefono ? raw.telefono.trim() : undefined,
    };

    const peticion = this.clienteId()
      ? this.clienteService.actualizar(this.clienteId()!, payload)
      : this.clienteService.crear(payload);

    peticion.subscribe({
      next: (res) => {
        this.guardando.set(false);
        const exito = this.clienteId()
          ? res.mensaje || 'El cliente fue actualizado exitosamente.'
          : res.mensaje || 'El cliente fue creado exitosamente.';
        this.mensajeExito.set(exito);

        setTimeout(() => {
          this.router.navigate([this.rutaBase()]);
        }, 1200);
      },
      error: (err) => {
        this.guardando.set(false);
        const errorMsg = err?.error?.message;

        if (err?.status === 400) {
          if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('rut')) {
            this.error.set('El RUT ya existe.');
          } else if (Array.isArray(errorMsg)) {
            this.error.set(errorMsg.join('. '));
          } else {
            this.error.set(errorMsg || 'El cliente ya existe.');
          }
        } else {
          this.error.set('Error: el cliente no se creó. Intente nuevamente.');
        }
      },
    });
  }
}
