import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario.service';
import { ItemInventario, CategoriaInventario } from '../../core/models/inventario.model';

@Component({
  selector: 'sigma-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class InventarioComponent {
  private readonly inventarioService = inject(InventarioService);
  private readonly fb = inject(FormBuilder);

  // Exponer métricas y listado
  readonly metricas = this.inventarioService.metricas;
  readonly items = this.inventarioService.items;

  // Filtros reactivos
  readonly busqueda = signal('');
  readonly categoriaFiltro = signal('TODAS');
  readonly estadoFiltro = signal('TODOS');
  readonly vistaModo = signal<'cuadricula' | 'tabla'>('cuadricula');

  // Modal Crear / Editar
  readonly modalAbierto = signal(false);
  readonly editandoItem = signal<ItemInventario | null>(null);

  // Modal Ajuste Rápido de Stock
  readonly modalStockAbierto = signal(false);
  readonly itemStockSeleccionado = signal<ItemInventario | null>(null);
  readonly deltaStock = signal<number>(1);

  readonly categorias: { id: CategoriaInventario; label: string; icono: string }[] = [
    { id: 'REPUESTOS', label: 'Repuestos de Mantención', icono: '🔧' },
    { id: 'AERODINAMICA', label: 'Aerodinámica y Tuning (Alerones/Lips)', icono: '🏎️' },
    { id: 'SUSPENSION_FRENOS', label: 'Frenos y Suspensión', icono: '🛑' },
    { id: 'MOTOR_ESCAPE', label: 'Motor, Admisión y Escape', icono: '⚡' },
    { id: 'ILUMINACION', label: 'Iluminación y Ópticas', icono: '💡' },
    { id: 'INTERIOR_ACCESORIOS', label: 'Interior y Accesorios', icono: '💺' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigoSku: ['', [Validators.required]],
    categoria: ['AERODINAMICA' as CategoriaInventario, [Validators.required]],
    categoriaLabel: ['Aerodinámica y Tuning (Alerones/Lips)'],
    descripcion: ['', [Validators.required]],
    stockActual: [1, [Validators.required, Validators.min(0)]],
    stockMinimo: [2, [Validators.required, Validators.min(0)]],
    precioUnitario: [25000, [Validators.required, Validators.min(1)]],
    ubicacion: ['Bodega Principal', [Validators.required]],
    compatibilidad: ['Universal', [Validators.required]],
    imagenIcono: ['🏎️']
  });

  // Items filtrados
  readonly itemsFiltrados = computed(() => {
    const list = this.items();
    const q = this.busqueda().toLowerCase().trim();
    const cat = this.categoriaFiltro();
    const est = this.estadoFiltro();

    return list.filter(item => {
      const matchBusqueda = !q || 
        item.nombre.toLowerCase().includes(q) ||
        item.codigoSku.toLowerCase().includes(q) ||
        item.compatibilidad.toLowerCase().includes(q) ||
        item.ubicacion.toLowerCase().includes(q);

      const matchCat = cat === 'TODAS' || item.categoria === cat;
      const matchEst = est === 'TODOS' || item.estado === est;

      return matchBusqueda && matchCat && matchEst;
    });
  });

  abrirCrear(): void {
    this.editandoItem.set(null);
    this.form.reset({
      nombre: '',
      codigoSku: 'SKU-' + Math.floor(100 + Math.random() * 900),
      categoria: 'AERODINAMICA',
      categoriaLabel: 'Aerodinámica y Tuning (Alerones/Lips)',
      descripcion: '',
      stockActual: 5,
      stockMinimo: 2,
      precioUnitario: 35000,
      ubicacion: 'Vitrina Tuning',
      compatibilidad: 'Universal',
      imagenIcono: '🏎️'
    });
    this.modalAbierto.set(true);
  }

  abrirEditar(item: ItemInventario): void {
    this.editandoItem.set(item);
    this.form.patchValue({
      nombre: item.nombre,
      codigoSku: item.codigoSku,
      categoria: item.categoria,
      categoriaLabel: item.categoriaLabel,
      descripcion: item.descripcion,
      stockActual: item.stockActual,
      stockMinimo: item.stockMinimo,
      precioUnitario: item.precioUnitario,
      ubicacion: item.ubicacion,
      compatibilidad: item.compatibilidad,
      imagenIcono: item.imagenIcono || '📦'
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.editandoItem.set(null);
  }

  onCategoriaSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as CategoriaInventario;
    const found = this.categorias.find(c => c.id === val);
    if (found) {
      this.form.controls.categoriaLabel.setValue(found.label);
      this.form.controls.imagenIcono.setValue(found.icono);
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const edit = this.editandoItem();

    if (edit) {
      this.inventarioService.actualizarItem(edit.id, val);
    } else {
      this.inventarioService.agregarItem(val);
    }

    this.cerrarModal();
  }

  eliminar(item: ItemInventario): void {
    if (confirm(`¿Estás seguro de eliminar "${item.nombre}" del inventario?`)) {
      this.inventarioService.eliminarItem(item.id);
    }
  }

  sumarStock(item: ItemInventario, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.inventarioService.ajustarStock(item.id, 1);
  }

  restarStock(item: ItemInventario, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (item.stockActual > 0) {
      this.inventarioService.ajustarStock(item.id, -1);
    }
  }

  abrirAjusteRapido(item: ItemInventario): void {
    this.itemStockSeleccionado.set(item);
    this.deltaStock.set(1);
    this.modalStockAbierto.set(true);
  }

  cerrarModalStock(): void {
    this.modalStockAbierto.set(false);
    this.itemStockSeleccionado.set(null);
  }

  aplicarAjusteStock(esSuma: boolean): void {
    const item = this.itemStockSeleccionado();
    const cantidad = Math.abs(this.deltaStock());
    if (item && cantidad > 0) {
      this.inventarioService.ajustarStock(item.id, esSuma ? cantidad : -cantidad);
      this.cerrarModalStock();
    }
  }

  restablecerDemo(): void {
    if (confirm('¿Deseas recargar los artículos predeterminados (Alerones, Lips, Pastillas, Bujías, etc.)?')) {
      this.inventarioService.restablecerDemo();
    }
  }
}
