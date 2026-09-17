/**
 * El backend (auth.service.ts) solo devuelve { access_token } en el login,
 * sin objeto "usuario". Los datos de la sesión (id, email, rol) hay que
 * sacarlos decodificando el propio JWT en el cliente.
 *
 * Payload real firmado en el backend: { sub, email, role, iat, exp }
 * (ver AuthService.login: `{ sub: usuario.id, email: usuario.email, role: usuario.role?.nombre }`)
 */
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
