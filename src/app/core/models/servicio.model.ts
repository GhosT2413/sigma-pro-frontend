/**
 * servicios.controller.ts SÍ tiene CRUD completo (GET, GET:id, POST, PATCH, DELETE).
 * OJO: no llegó servicios/entities/servicio.entity.ts ni los DTOs — el único campo
 * confirmado por servicios.service.ts es `nombre` (se usa para validar duplicados).
 * El resto de campos son un supuesto razonable según RF-04; confirmar cuando envíes
 * el entity.ts y los DTOs.
 */
export interface ServicioCatalogo {
  id?: number;
  nombre: string;
  descripcion?: string;
  valorBase?: number;
  tiempoBaseHoras?: number;
}
