import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';

// GET /clientes (agregado a clientes.controller.ts)
@Component({
  selector: 'sigma-cliente-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cliente-list.component.html',
  styleUrl: './cliente-list.component.scss',
})
export class ClienteListComponent {
  private readonly clienteService = inject(ClienteService);

  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(true);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.clienteService.listar().subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  eliminar(cliente: Cliente): void {
    if (!confirm(`¿Eliminar al cliente ${cliente.nombreCompleto}?`)) return;

    this.clienteService.eliminar(cliente.id).subscribe(() => {
      this.clientes.update((lista) => lista.filter((c) => c.id !== cliente.id));
    });
  }
}
