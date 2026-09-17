/**
 * Ajustado a alerta-mantencion.entity.ts real. IMPORTANTE: AlertasModule NO registra
 * ningún @Controller — no existe ningún endpoint HTTP para alertas todavía. AlertasService
 * es de uso puramente interno (lo invoca PrediccionesService.evaluarUmbral() al generar
 * una predicción). Este modelo queda listo para cuando agregues un AlertasController.
 */
export type TipoAlerta = 'AMARILLO' | 'ROJO'; // 'Verde' (al día) no genera fila en la BD.
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
