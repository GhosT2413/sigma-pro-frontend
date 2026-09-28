import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  Rol,
  Usuario,
  UsuarioBackend,
  mapUsuarioBackend,
} from '../models/usuario.model';
import { ClienteService } from '../services/cliente.service';
import { CreateClientePayload } from '../models/cliente.model';
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

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly clienteService: ClienteService,
    private readonly usuarioService: UsuarioService,
  ) {}

  login(credenciales: LoginRequest) {
    // POST /auth/login (auth.controller.ts) solo devuelve { access_token }, sin datos del usuario.
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((res) => localStorage.setItem(TOKEN_KEY, res.access_token)),
      switchMap((res) => this.cargarPerfil(res.access_token)),
    );
  }

  register(datos: RegisterRequest) {
    // POST /auth/register devuelve { access_token, usuario } con el objeto usuario completo.
    const esCliente = datos.role_id === 1;
    const rut = esCliente ? (datos as any).rut : undefined;
    const fechaNacimiento = esCliente ? (datos as any).fecha_nacimiento : undefined;

    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, datos).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        const rut = esCliente ? (datos as any).rut?.trim().toUpperCase() : undefined;
        const usuario: Usuario = {
          id: res.usuario.id,
          nombreCompleto: res.usuario.nombre_completo,
          email: res.usuario.email,
          telefono: res.usuario.telefono,
          fechaNacimiento: res.usuario.fecha_nacimiento,
          fotoPerfilUrl: res.usuario.foto_perfil_url,
          activo: true,
          rol: res.usuario.role.nombre as Rol,
          roleId: res.usuario.role.id,
        };
        localStorage.setItem(USER_KEY, JSON.stringify({ ...usuario, rut }));
        this.usuarioSignal.set({ ...usuario, rut } as any);
      }),
      switchMap((res) => {
        // Si es CLIENTE y tiene RUT, crear registro en tabla clientes
        if (esCliente && rut) {
          const clientePayload: CreateClientePayload = {
            usuario_id: res.usuario.id,
            nombre_completo: res.usuario.nombre_completo,
            email: res.usuario.email,
            rut: rut.trim().toUpperCase(),
            telefono: res.usuario.telefono,
          };
          return this.clienteService.crear(clientePayload).pipe(
            tap(() => console.log('Cliente creado automáticamente tras registro')),
            catchError((err) => {
              console.warn('No se pudo crear cliente automáticamente:', err);
              return of(null);
            }),
            switchMap(() => {
              // Si se proporcionó fecha_nacimiento, guardarla en el usuario
              if (fechaNacimiento) {
                return this.usuarioService.actualizar(res.usuario.id, { fecha_nacimiento: fechaNacimiento }).pipe(
                  tap((updatedUser) => {
                    const usuarioActual = this.usuarioSignal();
                    if (usuarioActual) {
                      const usuarioActualizado: Usuario = {
                        ...usuarioActual,
                        fechaNacimiento: updatedUser.fecha_nacimiento,
                      };
                      localStorage.setItem(USER_KEY, JSON.stringify(usuarioActualizado));
                      this.usuarioSignal.set(usuarioActualizado);
                    }
                  }),
                  catchError((err) => {
                    console.warn('No se pudo actualizar fecha_nacimiento:', err);
                    return of(null);
                  }),
                );
              }
              return of(null);
            }),
          );
        }
        return of(null);
      }),
    );
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
