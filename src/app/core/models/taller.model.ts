/** Shape tal cual lo devuelve GET /talleres (taller.entity.ts). */
export interface TallerBackend {
  id: number;
  nombre: string;
  rut_empresa: string;
  patente_comercial?: string;
  email_contacto?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
}

/** Shape normalizado (camelCase) usado por los componentes. */
export interface Taller {
  id: number;
  nombre: string;
  rutEmpresa: string;
  activo: boolean;
}

export function mapTallerBackend(t: TallerBackend): Taller {
  return {
    id: t.id,
    nombre: t.nombre,
    rutEmpresa: t.rut_empresa,
    activo: t.activo,
  };
}
