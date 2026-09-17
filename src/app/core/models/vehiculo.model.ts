// Ajustado a vehiculo.entity.ts / create-vehiculo.dto.ts / update-vehiculo.dto.ts reales.
export type TipoUso = 'DIARIO' | 'CARRERA' | 'TUNING' | 'EXHIBICION';
export type EstadoVehiculo = 'ACTIVO' | 'EN_MANTENIMIENTO' | 'INACTIVO';

/** GET /vehiculos y GET /vehiculos/:id ahora cargan `relations: { cliente: true }`. */
export interface VehiculoBackend {
  id: number;
  cliente?: { id: number; nombre_completo: string } | null;
  empresa_id?: number;
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  vin?: string;
  kilometraje_actual: number;
  tipo_uso: TipoUso;
  estado: EstadoVehiculo;
  created_at: string;
  updated_at: string;
}

export interface Vehiculo {
  id: number;
  clienteId?: number;
  clienteNombre?: string;
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  vin?: string;
  kilometrajeActual: number;
  tipoUso: TipoUso;
  estado: EstadoVehiculo;
}

export function mapVehiculoBackend(v: VehiculoBackend): Vehiculo {
  return {
    id: v.id,
    clienteId: v.cliente?.id,
    clienteNombre: v.cliente?.nombre_completo,
    patente: v.patente,
    marca: v.marca,
    modelo: v.modelo,
    anio: v.anio,
    vin: v.vin,
    kilometrajeActual: v.kilometraje_actual,
    tipoUso: v.tipo_uso,
    estado: v.estado,
  };
}

/** Body exacto de POST /vehiculos (create-vehiculo.dto.ts, snake_case). */
export interface CreateVehiculoPayload {
  cliente_id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  vin?: string;
  kilometraje_actual: number;
  tipo_uso?: TipoUso;
  estado?: EstadoVehiculo;
}

/** Body de PATCH /vehiculos/:id (update-vehiculo.dto.ts) — sin kilometraje_actual a propósito. */
export interface UpdateVehiculoPayload {
  cliente_id?: number;
  patente?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  vin?: string;
  tipo_uso?: TipoUso;
  estado?: EstadoVehiculo;
}

/** Body exacto de PATCH /vehiculos/:id/kilometraje (update-kilometraje.dto.ts). */
export interface UpdateKilometrajePayload {
  nuevo_kilometraje: number;
}
