export type CategoriaInventario = 
  | 'REPUESTOS' 
  | 'AERODINAMICA' // Alerones, Lips, Difusores
  | 'ILUMINACION' 
  | 'SUSPENSION_FRENOS' 
  | 'MOTOR_ESCAPE' 
  | 'INTERIOR_ACCESORIOS';

export interface ItemInventario {
  id: string;
  nombre: string;
  codigoSku: string;
  categoria: CategoriaInventario;
  categoriaLabel: string;
  descripcion: string;
  stockActual: number;
  stockMinimo: number;
  precioUnitario: number;
  ubicacion: string; // ej: 'Estante A-2', 'Bodega Principal', 'Vitrina Tuning'
  compatibilidad: string; // ej: 'Universal', 'Honda Civic 2016-2021', 'Subaru WRX'
  estado: 'DISPONIBLE' | 'BAJO_STOCK' | 'AGOTADO';
  fechaActualizacion: string;
  imagenIcono?: string; // Icono o emoji representativo
}

export interface FiltrosInventario {
  busqueda: string;
  categoria: string;
  estado: string;
}

