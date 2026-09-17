/**
 * Ajustado a cliente.entity.ts real. OJO: tu backend NO tiene columnas de
 * region/comuna/fechaNacimiento/preferenciaNotificacion — no existen en la BD.
 * Además ClientesController SOLO expone POST (crear). No hay GET, PATCH ni DELETE
 * todavía, así que no es posible listar ni editar clientes desde la API.
 */
export interface ClienteBackend {
  id: number;
  usuario_id?: number;
  empresa_id?: number;
  nombre_completo: string;
  rut?: string;
  email?: string;
  telefono?: string;
  created_at: string;
}

export interface Cliente {
  id: number;
  nombreCompleto: string;
  rut?: string;
  email?: string;
  telefono?: string;
}

export function mapClienteBackend(c: ClienteBackend): Cliente {
  return {
    id: c.id,
    nombreCompleto: c.nombre_completo,
    rut: c.rut,
    email: c.email,
    telefono: c.telefono,
  };
}

/** Body exacto de POST /clientes (create-cliente.dto.ts, snake_case). */
export interface CreateClientePayload {
  usuario_id?: number;
  empresa_id?: number;
  nombre_completo: string;
  rut?: string;
  email?: string;
  telefono?: string;
}
