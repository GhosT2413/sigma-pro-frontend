/**
 * IMPORTANTE: los nombres de rol dependen de la columna `nombre` de la tabla `roles`
 * en tu script SQL (roles.module.ts registra la entidad Role, pero RolesController
 * está vacío: no hay endpoint para consultarlos desde la API).
 * Se asume por ahora CLIENTE | MECANICO_INDEPENDIENTE | TALLER | ADMINISTRADOR | MECANICO | RECEPCIONISTA
 * (el comentario en usuarios.controller.ts "rol 2 = MECANICO_INDEPENDIENTE" es la única
 * pista disponible). CONFIRMAR contra el contenido real de la tabla `roles` y ajustar
 * este tipo si los valores no calzan exactamente (mayúsculas/guiones bajos incluidos).
 */
export type Rol = 'CLIENTE' | 'MECANICO_INDEPENDIENTE' | 'TALLER' | 'ADMINISTRADOR' | 'MECANICO' | 'RECEPCIONISTA';

/** Shape tal cual lo devuelve el backend (usuarios.entity.ts, con la relación `role` y `taller`). */
export interface UsuarioBackend {
  id: number;
  nombre_completo: string;
  email: string;
  telefono?: string;
  fecha_nacimiento?: string;
  foto_perfil_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  role: {
    id: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
  };
  taller?: {
    id: number;
    nombre: string;
    rut_empresa: string;
  } | null;
  taller_id?: number | null;
}

/** Shape normalizado (camelCase) que usa el resto de los componentes del frontend. */
export interface Usuario {
  id: number;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  fotoPerfilUrl?: string;
  activo: boolean;
  rol: Rol;
  roleId: number;
  tallerId?: number | null;
  taller?: {
    id: number;
    nombre: string;
    rutEmpresa: string;
  } | null;
}

export function mapUsuarioBackend(u: UsuarioBackend): Usuario {
  return {
    id: u.id,
    nombreCompleto: u.nombre_completo,
    email: u.email,
    telefono: u.telefono,
    fechaNacimiento: u.fecha_nacimiento,
    fotoPerfilUrl: u.foto_perfil_url,
    activo: u.activo,
    rol: u.role?.nombre as Rol,
    roleId: u.role?.id,
    tallerId: u.taller_id ?? u.taller?.id ?? null,
    taller: u.taller ? {
      id: u.taller.id,
      nombre: u.taller.nombre,
      rutEmpresa: u.taller.rut_empresa,
    } : null,
  };
}

/** Body exacto que espera POST /usuarios (create-usuario.dto.ts, snake_case, sin campos extra). */
export interface CreateUsuarioPayload {
  nombre_completo: string;
  email: string;
  password_hash: string;
  telefono?: string;
  role_id: number;
  hasAcceptedTerms: boolean;
  taller_id?: number;
  // Mecánico Independiente
  cedula_frente_url?: string;
  cedula_reverso_url?: string;
  certificado_antecedentes_url?: string;
  // Taller
  rut_empresa?: string;
  patente_comercial?: string;
  comprobante_domicilio_url?: string;
  representante_legal?: string;
}

/** Body para PATCH /usuarios/:id (update-usuario.dto.ts, snake_case). */
export interface UpdateUsuarioPayload {
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  foto_perfil_url?: string;
  activo?: boolean;
  role_id?: number;
  taller_id?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/login solo devuelve esto — no incluye datos del usuario (ver auth.service.ts). */
export interface LoginResponse {
  access_token: string;
}

export interface RegisterRequest {
  nombre_completo: string;
  email: string;
  password_hash: string;
  telefono?: string;
  role_id: number;
  hasAcceptedTerms: boolean;
  taller_id?: number;
  // Mecánico Independiente
  cedula_frente_url?: string;
  cedula_reverso_url?: string;
  certificado_antecedentes_url?: string;
  // Taller
  rut_empresa?: string;
  patente_comercial?: string;
  comprobante_domicilio_url?: string;
  representante_legal?: string;
}

/** POST /auth/register devuelve el token + el objeto usuario completo. */
export interface RegisterResponse {
  access_token: string;
  usuario: {
    id: number;
    nombre_completo: string;
    email: string;
    telefono?: string;
    fecha_nacimiento?: string;
    foto_perfil_url?: string;
    role: {
      id: number;
      nombre: string;
      descripcion?: string;
      activo: boolean;
    };
    taller?: {
      id: number;
      nombre: string;
      rut_empresa: string;
    } | null;
    taller_id?: number | null;
  };
}

export const ROLE_LABELS: Record<Rol, string> = {
  CLIENTE: 'Cliente',
  MECANICO_INDEPENDIENTE: 'Mecánico Independiente',
  TALLER: 'Taller',
  ADMINISTRADOR: 'Administrador',
  MECANICO: 'Mecánico',
  RECEPCIONISTA: 'Recepcionista',
};
