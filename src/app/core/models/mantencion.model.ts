// Ajustado a ficha-mantencion.entity.ts real: SIN tabla de detalle/repuestos,
// costo_repuestos es un único decimal plano.
export type EstadoFicha = 'EN_ESPERA' | 'EN_MANTENIMIENTO' | 'LISTO' | 'CANCELADO';

export interface FichaMantencionBackend {
  id: number;
  vehiculo_id: number;
  taller_id?: number;
  mecanico_id?: number;
  fecha_ingreso: string;
  kilometraje_ingreso: number;
  kilometraje_salida?: number;
  valor_arreglo: number;
  costo_repuestos: number;
  costo_total: number;
  descripcion?: string;
  diagnostico?: string;
  trabajo_realizado?: string;
  estado: EstadoFicha;
  created_at: string;
  updated_at: string;
}

export interface Ficha {
  id: number;
  vehiculoId: number;
  tallerId?: number;
  mecanicoId?: number;
  fechaIngreso: string;
  kilometrajeIngreso: number;
  kilometrajeSalida?: number;
  valorArreglo: number;
  costoRepuestos: number;
  costoTotal: number;
  descripcion?: string;
  diagnostico?: string;
  trabajoRealizado?: string;
  estado: EstadoFicha;
}

export function mapFichaBackend(f: FichaMantencionBackend): Ficha {
  return {
    id: f.id,
    vehiculoId: f.vehiculo_id,
    tallerId: f.taller_id,
    mecanicoId: f.mecanico_id,
    fechaIngreso: f.fecha_ingreso,
    kilometrajeIngreso: f.kilometraje_ingreso,
    kilometrajeSalida: f.kilometraje_salida,
    valorArreglo: Number(f.valor_arreglo),
    costoRepuestos: Number(f.costo_repuestos),
    costoTotal: Number(f.costo_total),
    descripcion: f.descripcion,
    diagnostico: f.diagnostico,
    trabajoRealizado: f.trabajo_realizado,
    estado: f.estado,
  };
}

/**
 * Body de POST /fichas (create-ficha.dto.ts — no confirmado el archivo exacto, se asume que
 * refleja la entidad). `costo_total` NO se calcula en el backend (fichas.service.ts lo guarda
 * tal cual llega), así que el frontend debe enviarlo ya calculado.
 */
export interface CreateFichaPayload {
  vehiculo_id: number;
  taller_id?: number;
  mecanico_id?: number;
  kilometraje_ingreso: number;
  kilometraje_salida?: number;
  valor_arreglo?: number;
  costo_repuestos?: number;
  costo_total?: number;
  descripcion?: string;
  diagnostico?: string;
  trabajo_realizado?: string;
  estado?: EstadoFicha;
}
