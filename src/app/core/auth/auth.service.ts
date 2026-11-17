import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  Rol,
  Usuario,
  UsuarioBackend,
  mapUsuarioBackend,
  nombreSinCorreo,
} from '../models/usuario.model';
import { ClienteService } from '../services/cliente.service';
import { CreateClientePayload } from '../models/cliente.model';
import { TallerService } from '../services/taller.service';
import { UsuarioService } from '../services/usuario.service';
import { decodeJwtPayload } from './jwt.util';

const TOKEN_KEY = 'sigma_pro_token';
const USER_KEY = 'sigma_pro_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioSignal = signal<Usuario | null>(this.leerUsuarioGuardado());

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly rol = computed<Rol | null>(() => this.usuarioSignal()?.rol ?? null);
  readonly estaAutenticado = computed(() => !!this.usuarioSignal());

  /** Nombre del taller propio (rol TALLER), por si el perfil no trae la relación `taller`. */
  private readonly nombreTallerSignal = signal<string | null>(null);

  readonly esTaller = computed(() => this.rol() === 'TALLER');

  /**
   * Nombre que muestran topbar y sidebar — nunca un correo:
   * - Rol TALLER: el nombre del taller (ej: "Tokyo Tunning").
   * - Resto de roles: el nombre del usuario; si el dato viniera como correo,
   *   solo la parte antes de "@" (nombre de usuario).
   */
  readonly nombreVisible = computed(() => {
    const usuario = this.usuarioSignal();
    if (!usuario) return '';
    if (usuario.rol === 'TALLER') {
      return usuario.taller?.nombre ?? this.nombreTallerSignal() ?? nombreSinCorreo(usuario.nombreCompleto);
    }
    return nombreSinCorreo(usuario.nombreCompleto);
  });

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly clienteService: ClienteService,
    private readonly usuarioService: UsuarioService,
    private readonly tallerService: TallerService,
  ) {
    const token = this.getToken();
    if (token) {
      // Sincronizar el perfil y rol más reciente del backend sin obligar a reloguear
      this.cargarPerfil(token).subscribe();
    }

    // Rol TALLER: si el perfil no trae el nombre del taller, lo pedimos al backend.
    effect((onCleanup) => {
      const usuario = this.usuarioSignal();
      if (usuario?.rol !== 'TALLER' || usuario.taller?.nombre) {
        this.nombreTallerSignal.set(null);
        return;
      }
      const suscripcion = this.tallerService.buscarPorUsuario(usuario.id).subscribe({
        next: (taller) => this.nombreTallerSignal.set(taller?.nombre ?? null),
        error: () => this.nombreTallerSignal.set(null),
      });
      onCleanup(() => suscripcion.unsubscribe());
    });
  }

  login(credenciales: LoginRequest) {
    // POST /auth/login (auth.controller.ts) solo devuelve { access_token }, sin datos del usuario.
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((res) => localStorage.setItem(TOKEN_KEY, res.access_token)),
      switchMap((res) => this.cargarPerfil(res.access_token)),
    );
  }

  loginWithGoogle(idToken: string, roleId?: number) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/google`, { idToken, role_id: roleId }).pipe(
      tap((res) => localStorage.setItem(TOKEN_KEY, res.access_token)),
      switchMap((res) => this.cargarPerfil(res.access_token)),
    );
  }


  register(datos: RegisterRequest) {
    // POST /auth/register devuelve { access_token, usuario } con el objeto usuario completo.
    const esCliente = Number(datos.role_id) === 1;
    const rutIngresado = (datos as any).rut?.trim().toUpperCase();

    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, datos).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        const rutFinal = res.usuario.rut || rutIngresado;
        const usuario: Usuario = {
          id: res.usuario.id,
          nombreCompleto: res.usuario.nombre_completo,
          email: res.usuario.email,
          telefono: res.usuario.telefono,
          fotoPerfilUrl: res.usuario.foto_perfil_url,
          activo: true,
          rol: res.usuario.role.nombre as Rol,
          roleId: res.usuario.role.id,
          rut: rutFinal,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(usuario));
        this.usuarioSignal.set(usuario);
      }),
      switchMap((res) => {
        const rutFinal = res.usuario.rut || rutIngresado;
        // Si es CLIENTE y tiene RUT, crear registro en tabla clientes
        if (esCliente && rutFinal) {
          const clientePayload: CreateClientePayload = {
            usuario_id: res.usuario.id,
            nombre_completo: res.usuario.nombre_completo,
            email: res.usuario.email,
            rut: rutFinal,
            telefono: res.usuario.telefono,
          };
          return this.clienteService.crear(clientePayload).pipe(
            tap(() => console.log('Cliente creado automáticamente tras registro')),
            catchError((err) => {
              console.warn('No se pudo crear cliente automáticamente:', err);
              return of(null);
            }),
          );
        }
        return of(null);
      }),
    );
  }

  /**
   * POST /auth/forgot-password: el backend envía un correo con el enlace de
   * restablecimiento. Siempre responde lo mismo aunque el email no exista
   * (anti-enumeración), así que el frontend solo puede mostrar ese mensaje.
   */
  forgotPassword(email: string) {
    return this.http.post<ForgotPasswordResponse>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  /**
   * POST /auth/reset-password: canjea el token del correo por una contraseña nueva.
   * El token es de un solo uso y expira en 1 hora.
   */
  resetPassword(datos: ResetPasswordRequest) {
    return this.http.post<ResetPasswordResponse>(`${environment.apiUrl}/auth/reset-password`, datos);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.usuarioSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * El JWT trae { sub, email, role } pero no el nombre completo del usuario.
   * GET /usuarios (JwtAuthGuard, sin filtro por rol) devuelve la lista completa con
   * la relación `role` incluida, así que buscamos ahí nuestro propio registro por id.
   * Si por lo que sea falla, igual dejamos la sesión activa con lo que trae el token
   * (rol correcto, aunque sin nombre completo) para no bloquear el login.
   */
  private cargarPerfil(token: string) {
    const payload = decodeJwtPayload(token);

    if (!payload) {
      this.logout();
      throw new Error('Token inválido');
    }

    return this.http.get<UsuarioBackend[]>(`${environment.apiUrl}/usuarios`).pipe(
      tap((lista) => {
        const propio = lista.find((u) => u.id === payload.sub);
        const usuario: Usuario = propio
          ? mapUsuarioBackend(propio)
          : {
              id: payload.sub,
              nombreCompleto: payload.email,
              email: payload.email,
              activo: true,
              rol: payload.role as Rol,
              roleId: 0,
            };
        localStorage.setItem(USER_KEY, JSON.stringify(usuario));
        this.usuarioSignal.set(usuario);
      }),
      catchError(() => {
        // Fallback: si GET /usuarios falla, igual arrancamos sesión solo con lo del token.
        const usuario: Usuario = {
          id: payload.sub,
          nombreCompleto: payload.email,
          email: payload.email,
          activo: true,
          rol: payload.role as Rol,
          roleId: 0,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(usuario));
        this.usuarioSignal.set(usuario);
        return of(null);
      }),
    );
  }

  private leerUsuarioGuardado(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }
}
