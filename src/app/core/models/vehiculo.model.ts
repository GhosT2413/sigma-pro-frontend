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
  vencimiento_revision_tecnica?: string | null;
  vencimiento_soap?: string | null;
  vencimiento_permiso_circulacion?: string | null;
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
  vencimientoRevisionTecnica?: string | null;
  vencimientoSoap?: string | null;
  vencimientoPermisoCirculacion?: string | null;
}

export function normalizarFechaVencimiento(valor?: string | null): string | null {
  if (!valor) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
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
    vencimientoRevisionTecnica: normalizarFechaVencimiento(v.vencimiento_revision_tecnica),
    vencimientoSoap: normalizarFechaVencimiento(v.vencimiento_soap),
    vencimientoPermisoCirculacion: normalizarFechaVencimiento(v.vencimiento_permiso_circulacion),
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
  vencimiento_revision_tecnica?: string | null;
  vencimiento_soap?: string | null;
  vencimiento_permiso_circulacion?: string | null;
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
  vencimiento_revision_tecnica?: string | null;
  vencimiento_soap?: string | null;
  vencimiento_permiso_circulacion?: string | null;
}

/** Body exacto de PATCH /vehiculos/:id/kilometraje (update-kilometraje.dto.ts). */
export interface UpdateKilometrajePayload {
  nuevo_kilometraje: number;
}
