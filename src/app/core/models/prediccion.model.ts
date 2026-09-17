// Ajustado a prediccion-ia.entity.ts y predicciones.controller.ts reales.
export type EstadoPrediccion = 'PENDIENTE' | 'REVISADA' | 'ATENDIDA';

/** POST /predicciones/generar llama a Gemini EN EL MOMENTO (no hay caché ni GET
 * para traer predicciones pasadas) y devuelve UN componente, no una lista. */
export interface PrediccionIa {
  id: number;
  vehiculo_id: number;
  fecha_prediccion: string;
  componente: string;
  diagnostico: string;
  kilometraje_actual: number;
  kilometraje_recomendado: number;
  probabilidad: number | null;
  estado: EstadoPrediccion;
}

/** Body exacto de POST /predicciones/generar (snake_case). */
export interface GenerarPrediccionPayload {
  vehiculo_id: number;
  kilometraje_actual: number;
  marca: string;
  modelo: string;
  tipo_uso: string;
}
