import { Injectable, signal, computed } from '@angular/core';
import { ItemInventario, FiltrosInventario, CategoriaInventario } from '../models/inventario.model';

const STORAGE_KEY = 'sigmapro_taller_inventario_items';

const ITEMS_INICIALES: ItemInventario[] = [
  {
    id: 'inv-1',
    nombre: 'Alerón Tipo GT Carbon Fiber 145cm',
    codigoSku: 'AER-ALR-001',
    categoria: 'AERODINAMICA',
    categoriaLabel: 'Aerodinámica y Estética',
    descripcion: 'Alerón universal de doble plano en fibra de carbono real con soportes de aluminio CNC regulables.',
    stockActual: 4,
    stockMinimo: 2,
    precioUnitario: 189990,
    ubicacion: 'Vitrina Tuning 1',
    compatibilidad: 'Universal / Sedán & Coupé',
    estado: 'DISPONIBLE',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '🏎️'
  },
  {
    id: 'inv-2',
    nombre: 'Front Lip Splitter V1 Negro Piano',
    codigoSku: 'AER-LIP-002',
    categoria: 'AERODINAMICA',
    categoriaLabel: 'Aerodinámica y Estética',
    descripcion: 'Labio frontal de 3 piezas ABS de alta resistencia y acabado negro brillante con tirantes de refuerzo.',
    stockActual: 2,
    stockMinimo: 3,
    precioUnitario: 54990,
    ubicacion: 'Bodega Principal - B3',
    compatibilidad: 'Universal / Ajustable',
    estado: 'BAJO_STOCK',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '⚡'
  },
  {
    id: 'inv-3',
    nombre: 'Faldones Laterales (Side Skirts) Universales',
    codigoSku: 'AER-SKR-003',
    categoria: 'AERODINAMICA',
    categoriaLabel: 'Aerodinámica y Estética',
    descripcion: 'Extensiones de zócalos laterales aerodinámicos de 2.2 metros recortables en polipropileno negro.',
    stockActual: 6,
    stockMinimo: 2,
    precioUnitario: 42990,
    ubicacion: 'Bodega Principal - B3',
    compatibilidad: 'Universal (2.0 a 2.2m)',
    estado: 'DISPONIBLE',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '✨'
  },
  {
    id: 'inv-4',
    nombre: 'Difusor Trasero 4 Aletas Negro Mate',
    codigoSku: 'AER-DIF-004',
    categoria: 'AERODINAMICA',
    categoriaLabel: 'Aerodinámica y Estética',
    descripcion: 'Difusor aerodinámico para parachoques trasero con canalizadores de flujo de aire y tornillos incluidos.',
    stockActual: 0,
    stockMinimo: 2,
    precioUnitario: 38990,
    ubicacion: 'Bodega Principal - B4',
    compatibilidad: 'Universal / Parachoques curvo',
    estado: 'AGOTADO',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '💨'
  },
  {
    id: 'inv-5',
    nombre: 'Pastillas de Freno Cerámicas Brembo Delanteras',
    codigoSku: 'FRE-PST-101',
    categoria: 'SUSPENSION_FRENOS',
    categoriaLabel: 'Frenos y Suspensión',
    descripcion: 'Compuesto cerámico de alto rendimiento, bajo polvo y máxima disipación térmica.',
    stockActual: 8,
    stockMinimo: 3,
    precioUnitario: 65900,
    ubicacion: 'Estante F-1',
    compatibilidad: 'Toyota RAV4 / Corolla 2018+',
    estado: 'DISPONIBLE',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '🛑'
  },
  {
    id: 'inv-6',
    nombre: 'Discos de Freno Ranurados y Perforados 300mm',
    codigoSku: 'FRE-DSC-102',
    categoria: 'SUSPENSION_FRENOS',
    categoriaLabel: 'Frenos y Suspensión',
    descripcion: 'Kit par de discos ventilados de acero templado ranurados y perforados para disipar gases.',
    stockActual: 3,
    stockMinimo: 2,
    precioUnitario: 119990,
    ubicacion: 'Estante F-2',
    compatibilidad: 'Volkswagen Golf MK7 / Bora',
    estado: 'DISPONIBLE',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '⚙️'
  },
  {
    id: 'inv-7',
    nombre: 'Kit Espirales Progresivos Racing (-35mm)',
    codigoSku: 'SUS-ESP-201',
    categoria: 'SUSPENSION_FRENOS',
    categoriaLabel: 'Frenos y Suspensión',
    descripcion: 'Juego de 4 resortes deportivos con rebaje equilibrado para mayor estabilidad en curvas.',
    stockActual: 1,
    stockMinimo: 2,
    precioUnitario: 145000,
    ubicacion: 'Bodega Principal - S1',
    compatibilidad: 'Peugeot 208 / 2008 2014-2022',
    estado: 'BAJO_STOCK',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '🌀'
  },
  {
    id: 'inv-8',
    nombre: 'Filtro de Aire Cónico Alto Flujo K&N 3" pulgadas',
    codigoSku: 'MOT-FLT-301',
    categoria: 'MOTOR_ESCAPE',
    categoriaLabel: 'Motor y Escape',
    descripcion: 'Filtro cónico lavable de algodón multicapa lubricado con abrazadera de acero inoxidable.',
    stockActual: 12,
    stockMinimo: 4,
    precioUnitario: 52000,
    ubicacion: 'Estante M-1',
    compatibilidad: 'Universal / Entrada 76mm (3 pulg)',
    estado: 'DISPONIBLE',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '🌪️'
  },
  {
    id: 'inv-9',
    nombre: 'Válvula de Alivio Blow Off Doble Pistón',
    codigoSku: 'MOT-BOV-302',
    categoria: 'MOTOR_ESCAPE',
    categoriaLabel: 'Motor y Escape',
    descripcion: 'Válvula BOV de descarga sonora atmosférica ajustable fabricada en aluminio anodizado CNC.',
    stockActual: 3,
    stockMinimo: 2,
    precioUnitario: 79900,
    ubicacion: 'Vitrina Tuning 2',
    compatibilidad: 'Motores Turbo Gasolina 1.4 a 2.0 T',
    estado: 'DISPONIBLE',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '📢'
  },
  {
    id: 'inv-10',
    nombre: 'Bujías Iridium IX Laser NGK (Pack 4)',
    codigoSku: 'MOT-BUJ-303',
    categoria: 'REPUESTOS',
    categoriaLabel: 'Repuestos de Mantención',
    descripcion: 'Electrodo central de iridio ultra fino para chispa superior, mejor encendido y durabilidad 100k km.',
    stockActual: 15,
    stockMinimo: 5,
    precioUnitario: 39990,
    ubicacion: 'Estante M-2',
    compatibilidad: 'Nissan / Hyundai / Kia 1.6 - 2.0',
    estado: 'DISPONIBLE',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '🔌'
  },
  {
    id: 'inv-11',
    nombre: 'Aceite Sintético Motul 8100 X-Clean 5W40 (5L)',
    codigoSku: 'LUB-ACE-401',
    categoria: 'REPUESTOS',
    categoriaLabel: 'Repuestos de Mantención',
    descripcion: 'Lubricante 100% sintético de altas prestaciones para motores gasolina y diésel modernos.',
    stockActual: 9,
    stockMinimo: 4,
    precioUnitario: 48990,
    ubicacion: 'Bodega Líquidos L-1',
    compatibilidad: 'Normas ACEA C3 / API SN',
    estado: 'DISPONIBLE',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '🛢️'
  },
  {
    id: 'inv-12',
    nombre: 'Kit Focos Led Proyector H4 / H7 20.000LM Canbus',
    codigoSku: 'ILU-LED-501',
    categoria: 'ILUMINACION',
    categoriaLabel: 'Iluminación y Ópticas',
    descripcion: 'Ampolletas led con microproyector lupa incorporado, línea de corte perfecta y cero encandilamiento.',
    stockActual: 7,
    stockMinimo: 3,
    precioUnitario: 34990,
    ubicacion: 'Estante IL-1',
    compatibilidad: 'H4 y H7 Bi-Foco',
    estado: 'DISPONIBLE',
    fechaActualizacion: new Date().toISOString(),
    imagenIcono: '💡'
  }
];

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private readonly itemsSignal = signal<ItemInventario[]>(this.cargarItems());

  readonly items = this.itemsSignal.asReadonly();

  // Métricas calculadas para la cabecera
  readonly metricas = computed(() => {
    const list = this.itemsSignal();
    const totalArticulos = list.length;
    const stockTotalUnidades = list.reduce((acc, curr) => acc + curr.stockActual, 0);
    const valorTotalInventario = list.reduce((acc, curr) => acc + (curr.stockActual * curr.precioUnitario), 0);
    const bajoStock = list.filter(i => i.stockActual > 0 && i.stockActual <= i.stockMinimo).length;
    const agotados = list.filter(i => i.stockActual === 0).length;
    const repuestosCount = list.filter(i => i.categoria === 'REPUESTOS').length;
    const aeroCount = list.filter(i => i.categoria === 'AERODINAMICA').length;

    return {
      totalArticulos,
      stockTotalUnidades,
      valorTotalInventario,
      bajoStock,
      agotados,
      repuestosCount,
      aeroCount
    };
  });

  private cargarItems(): ItemInventario[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return ITEMS_INICIALES;
    }
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ITEMS_INICIALES));
      return ITEMS_INICIALES;
    }
    try {
      return JSON.parse(guardado);
    } catch {
      return ITEMS_INICIALES;
    }
  }

  private guardarEnStorage(items: ItemInventario[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }

  agregarItem(itemNuevo: Omit<ItemInventario, 'id' | 'estado' | 'fechaActualizacion'>): ItemInventario {
    const estado = itemNuevo.stockActual === 0 
      ? 'AGOTADO' 
      : itemNuevo.stockActual <= itemNuevo.stockMinimo 
        ? 'BAJO_STOCK' 
        : 'DISPONIBLE';

    const item: ItemInventario = {
      ...itemNuevo,
      id: 'inv-' + Date.now(),
      estado,
      fechaActualizacion: new Date().toISOString()
    };

    const actualizados = [item, ...this.itemsSignal()];
    this.itemsSignal.set(actualizados);
    this.guardarEnStorage(actualizados);
    return item;
  }

  actualizarItem(id: string, cambios: Partial<ItemInventario>): void {
    const actualizados = this.itemsSignal().map(item => {
      if (item.id === id) {
        const stockActual = cambios.stockActual !== undefined ? cambios.stockActual : item.stockActual;
        const stockMinimo = cambios.stockMinimo !== undefined ? cambios.stockMinimo : item.stockMinimo;
        
        let nuevoEstado: ItemInventario['estado'] = 'DISPONIBLE';
        if (stockActual === 0) nuevoEstado = 'AGOTADO';
        else if (stockActual <= stockMinimo) nuevoEstado = 'BAJO_STOCK';

        return {
          ...item,
          ...cambios,
          stockActual,
          stockMinimo,
          estado: nuevoEstado,
          fechaActualizacion: new Date().toISOString()
        };
      }
      return item;
    });

    this.itemsSignal.set(actualizados);
    this.guardarEnStorage(actualizados);
  }

  ajustarStock(id: string, delta: number): void {
    const item = this.itemsSignal().find(i => i.id === id);
    if (!item) return;
    const nuevoStock = Math.max(0, item.stockActual + delta);
    this.actualizarItem(id, { stockActual: nuevoStock });
  }

  eliminarItem(id: string): void {
    const actualizados = this.itemsSignal().filter(i => i.id !== id);
    this.itemsSignal.set(actualizados);
    this.guardarEnStorage(actualizados);
  }

  restablecerDemo(): void {
    this.itemsSignal.set(ITEMS_INICIALES);
    this.guardarEnStorage(ITEMS_INICIALES);
  }
}

