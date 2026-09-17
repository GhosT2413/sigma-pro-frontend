import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClienteService } from '../../../core/services/cliente.service';

// POST /clientes (crear) y PATCH /clientes/:id (editar)
@Component({
  selector: 'sigma-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

  readonly form = this.fb.nonNullable.group({
    nombre_completo: ['', Validators.required],
    rut: [''],
    email: ['', Validators.email],
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
            rut: c.rut,
            email: c.email,
            telefono: c.telefono,
          });
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    const payload = this.form.getRawValue();

    const peticion = this.clienteId()
      ? this.clienteService.actualizar(this.clienteId()!, payload)
      : this.clienteService.crear(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.status === 400 ? 'Ya existe un cliente con ese RUT.' : 'No se pudo guardar el cliente.');
      },
    });
  }
}
