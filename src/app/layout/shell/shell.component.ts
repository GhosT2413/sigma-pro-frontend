import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'sigma-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);

  readonly mostrarAdvertenciaGoogle = computed(() => {
    const usuario = this.auth.usuario();
    if (!usuario || !usuario.googleId) return false;
    // Si falta el RUT
    return !usuario.rut || usuario.rut.trim() === '';
  });
}
