import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { RutFormatDirective } from '../../../shared/directives/rut-format.directive';
import { validarRutChileno } from '../../../shared/validators/rut.validator';
import { LegalModalComponent } from '../../../shared/components/legal-modal/legal-modal.component';

@Component({
  selector: 'sigma-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RutFormatDirective, LegalModalComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild(LegalModalComponent) legalModal!: LegalModalComponent;

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly terminosAbiertos = signal(false);

  readonly roles = [
    { id: 1, label: 'Cliente' },
    { id: 2, label: 'Mecánico Independiente' },
    { id: 3, label: 'Taller Mecánico' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: [''],
    role_id: [1, Validators.required],
    hasAcceptedTerms: [false, Validators.requiredTrue],
    // Cliente fields
    rut: [''],
    fecha_nacimiento: [''],
    // Taller
    rut_empresa: [''],
    patente_comercial: [''],
    representante_legal: [''],
  });

  readonly archivos = signal<{
    cedula_frente: File | null;
    cedula_reverso: File | null;
    certificado_antecedentes: File | null;
    comprobante_domicilio: File | null;
  }>({
    cedula_frente: null,
    cedula_reverso: null,
    certificado_antecedentes: null,
    comprobante_domicilio: null,
  });

  // Signal reactivo para role_id
  readonly roleId = signal(1);

  readonly esCliente = computed(() => this.roleId() === 1);
  readonly esMecanicoIndependiente = computed(() => this.roleId() === 2);
  readonly requiereRut = computed(() => this.roleId() === 1 || this.roleId() === 2);

  readonly edad = computed(() => {
    const fechaNac = this.form.get('fecha_nacimiento')?.value;
    if (!fechaNac) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  });

  readonly mayorDeEdad = computed(() => {
    const e = this.edad();
    return e !== null && e >= 17;
  });

  constructor() {
    // Actualizar signal roleId cuando cambia el select
    this.form.get('role_id')!.valueChanges.subscribe((val) => {
      this.roleId.set(Number(val));
    });

    // Sincronizar validadores cuando cambia el rol
    effect(() => {
      const requiereRut = this.requiereRut();
      const esCliente = this.esCliente();
      const rutControl = this.form.get('rut');
      const fechaControl = this.form.get('fecha_nacimiento');

      if (requiereRut) {
        rutControl?.setValidators([Validators.required, validarRutChileno]);
      } else {
        rutControl?.clearValidators();
      }
      rutControl?.updateValueAndValidity();

      if (esCliente) {
        fechaControl?.setValidators([Validators.required]);
      } else {
        fechaControl?.clearValidators();
      }
      fechaControl?.updateValueAndValidity();
    });
  }

  async abrirTerminos(): Promise<void> {
    this.terminosAbiertos.set(true);
    const acepto = await this.legalModal.abrir();
    this.terminosAbiertos.set(false);
    if (acepto) {
      this.form.controls.hasAcceptedTerms.setValue(true);
      this.form.controls.hasAcceptedTerms.markAsTouched();
    }
  }

  onArchivoSeleccionado(campo: 'cedula_frente' | 'cedula_reverso' | 'certificado_antecedentes' | 'comprobante_domicilio', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.archivos.update(a => ({ ...a, [campo]: file }));
  }

  eliminarArchivo(campo: 'cedula_frente' | 'cedula_reverso' | 'certificado_antecedentes' | 'comprobante_domicilio'): void {
    this.archivos.update(a => ({ ...a, [campo]: null }));
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  async enviar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    try {
      const raw = this.form.getRawValue();
      const roleId = Number(raw.role_id);
      const arch = this.archivos();

      // Validación específica por rol en el frontend
      if (roleId === 2) {
        if (!arch.cedula_frente || !arch.cedula_reverso || !arch.certificado_antecedentes) {
          this.cargando.set(false);
          this.error.set(
            'Mecánico Independiente requiere: Cédula de Identidad (frente y reverso) y Certificado de Antecedentes.',
          );
          return;
        }
      } else if (roleId === 3) {
        if (!raw.rut_empresa || !raw.patente_comercial || !raw.representante_legal) {
          this.cargando.set(false);
          this.error.set('Taller Mecánico requiere: RUT, Patente Comercial y Representante Legal.');
          return;
        }
        if (!arch.comprobante_domicilio) {
          this.cargando.set(false);
          this.error.set('Taller Mecánico requiere: Comprobante de Domicilio del taller.');
          return;
        }
      }

      const payload: Record<string, unknown> = {
        nombre_completo: raw.nombre_completo,
        email: raw.email,
        password_hash: raw.password,
        telefono: raw.telefono || undefined,
        role_id: roleId,
        hasAcceptedTerms: raw.hasAcceptedTerms,
      };

      // Agregar RUT para roles que lo requieren (Cliente y Mecánico Independiente)
      if (this.requiereRut()) {
        payload['rut'] = raw.rut?.trim().toUpperCase() || undefined;
      }

      // Agregar campos de Cliente
      if (this.esCliente()) {
        payload['fecha_nacimiento'] = raw.fecha_nacimiento || undefined;
      }

      if (roleId === 2) {
        payload['cedula_frente_url'] = await this.fileToBase64(arch.cedula_frente!);
        payload['cedula_reverso_url'] = await this.fileToBase64(arch.cedula_reverso!);
        payload['certificado_antecedentes_url'] = await this.fileToBase64(arch.certificado_antecedentes!);
      } else if (roleId === 3) {
        payload['rut_empresa'] = raw.rut_empresa;
        payload['patente_comercial'] = raw.patente_comercial;
        payload['comprobante_domicilio_url'] = await this.fileToBase64(arch.comprobante_domicilio!);
        payload['representante_legal'] = raw.representante_legal;
      }

      this.auth.register(payload as any).subscribe({
        next: () => {
          this.cargando.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.cargando.set(false);
          if (err.status === 400) {
            const msg = err.error?.message;
            if (Array.isArray(msg)) {
              this.error.set(msg[0]);
            } else if (typeof msg === 'string') {
              this.error.set(msg);
            } else {
              this.error.set('Los datos ingresados no son válidos.');
            }
          } else if (err.status === 0) {
            this.error.set('No se pudo conectar con el servidor. Intenta más tarde.');
          } else {
            this.error.set('Ocurrió un error inesperado. Intenta nuevamente.');
          }
        },
      });
    } catch {
      this.cargando.set(false);
      this.error.set('Error al procesar los archivos. Intenta nuevamente.');
    }
  }
}
