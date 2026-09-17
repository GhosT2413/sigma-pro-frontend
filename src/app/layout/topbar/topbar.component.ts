import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
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

  @Output() toggleMenu = new EventEmitter<void>();

  cerrarSesion(): void {
    this.auth.logout();
  }
}
