import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ROLE_LABELS } from '../../core/models/usuario.model';

@Component({
  selector: 'sigma-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  readonly auth = inject(AuthService);
  readonly roleLabels = ROLE_LABELS;

  /** Nombre a mostrar: taller para rol TALLER, nombre del usuario para el resto (nunca correos). */
  readonly nombreMostrado = computed(() => this.auth.nombreVisible());

  readonly esTaller = computed(() => this.auth.esTaller());

  @Output() toggleMenu = new EventEmitter<void>();

  cerrarSesion(): void {
    this.auth.logout();
  }
}
