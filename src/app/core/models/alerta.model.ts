/**
 * Ajustado a alerta-mantencion.entity.ts real. AlertasController expone
 * GET /alertas (filtros vehiculo_id/estado) y PATCH /alertas/:id.
 * AlertasService también la usa internamente PrediccionesService.evaluarUmbral().
 */
export type TipoAlerta = 'AMARILLO' | 'ROJO' | 'VERDE'; // 'Verde' (al día) - agregado para alertas de estado LISTO
export type EstadoAlerta = 'PENDIENTE' | 'ATENDIDA' | 'CANCELADA';

export interface AlertaBackend {
  id: number;
  vehiculo_id: number;
  tipo: TipoAlerta;
  descripcion: string;
  kilometraje_objetivo?: number;
  fecha_objetivo?: string;
  estado: EstadoAlerta;
  created_at: string;
}

export interface Alerta {
  id: number;
  vehiculoId: number;
  tipo: TipoAlerta;
  descripcion: string;
  kilometrajeObjetivo?: number;
  fechaObjetivo?: string;
  estado: EstadoAlerta;
}

export function mapAlertaBackend(a: AlertaBackend): Alerta {
  return {
    id: a.id,
    vehiculoId: a.vehiculo_id,
    tipo: a.tipo,
    descripcion: a.descripcion,
    kilometrajeObjetivo: a.kilometraje_objetivo,
    fechaObjetivo: a.fecha_objetivo,
    estado: a.estado,
  };
}

/** Body exacto de POST /alertas (create-alerta.dto.ts, snake_case). */
export interface CreateAlertaPayload {
  vehiculo_id: number;
  tipo: TipoAlerta;
  descripcion: string;
  kilometraje_objetivo?: number;
  fecha_objetivo?: string;
  estado?: EstadoAlerta;
}

// GET /dashboard/metricas (dashboard.controller.ts) — confirmado.
export interface DashboardMetricasBackend {
  total_vehiculos: number;
  vehiculos_en_taller: number;
  alertas_activas: number;
  timestamp: string;
}

export interface DashboardMetricas {
  totalVehiculos: number;
  vehiculosEnTaller: number;
  alertasActivas: number;
  timestamp: string;
}

export function mapDashboardMetricas(d: DashboardMetricasBackend): DashboardMetricas {
  return {
    totalVehiculos: d.total_vehiculos,
    vehiculosEnTaller: d.vehiculos_en_taller,
    alertasActivas: d.alertas_activas,
    timestamp: d.timestamp,
  };
}
