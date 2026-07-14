import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { TokenService } from '../token.service';
import { Router } from '@angular/router';
import { AuthGoogleService } from '../auth-google.service';
import { environment } from '../../../../environments/environment';
// import { UnifiedAntiLoopService } from '../../../@core/services/unified-anti-loop.service'; // TEMPORALMENTE DESACTIVADO

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private injector = inject(Injector);

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private readonly MAX_401_PER_MINUTE = 10;
  private readonly TIME_WINDOW = 60000;
  private error401History: number[] = [];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth para URLs externas (Google, etc.) — solo interceptar requests al backend propio
    if (!req.url.startsWith(environment.apiUrl)) {
      return next.handle(req);
    }

    // Skip auth para algunos endpoints específicos
    if (req.headers.has('skip-auth-interceptor')) {
      const newReq = req.clone({
        headers: req.headers.delete('skip-auth-interceptor')
      });
      return next.handle(newReq);
    }

    const isAuthEndpoint =
      req.url.includes('/auth/login') ||
      req.url.includes('/auth/google') ||
      req.url.includes('/auth/register') ||
      req.url.includes('/auth/refresh-token');

    // Para endpoints de autenticación no aplicamos lógica de refresh proactivo
    if (isAuthEndpoint) {
      return next.handle(req).pipe(
        tap(event => {
          if (event instanceof HttpResponse && event.body?.refreshToken) {
            this.tokenService.setRefreshToken(event.body.refreshToken);
            console.log('[AuthInterceptor] ✅ refreshToken capturado desde', req.url);
          }
        })
      );
    }

    // ─── REFRESH PROACTIVO ───
    // Si el token está expirado ANTES de enviar la request, refrescamos primero.
    // Esto evita el round-trip 401 y los problemas de concurrencia.
    if (this.tokenService.isAccessTokenExpired()) {
      const refreshToken = this.tokenService.getRefreshToken();
      if (!refreshToken) {
        // No hay sesión activa (usuario nunca se autenticó o ya hizo logout).
        // Pasar la request sin cabecera de auth: el backend devolverá 401 si
        // el endpoint es protegido, y el guard de ruta manejará la redirección.
        // NO llamar performSoftLogout() — no hay sesión que expirar.
        return next.handle(req);
      }

      return this.doProactiveRefresh(req, next);
    }

    // Token válido: enviar request normalmente con fallback reactivo en 401
    return this.sendWithToken(req, next);
  }

  /**
   * Refresca el token antes de enviar la request.
   * Si varios requests llegan simultáneamente con token expirado,
   * solo uno refresca; los demás esperan al mismo Subject.
   */
  private doProactiveRefresh(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          if (token === '__FAILED__') return throwError(() => new Error('Refresh failed'));
          return next.handle(this.addToken(req, token!));
        })
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);
    console.log('[AuthInterceptor] Token expirado → refrescando proactivamente...');

    return this.tokenService.refreshAccessToken().pipe(
      switchMap(newToken => {
        this.isRefreshing = false;
        if (newToken) {
          this.error401History = [];
          this.refreshTokenSubject.next(newToken);
          console.log('[AuthInterceptor] ✅ Refresh proactivo OK, enviando request con nuevo token');
          return next.handle(this.addToken(req, newToken));
        } else {
          console.warn('[AuthInterceptor] refreshAccessToken devolvió null → logout');
          this.refreshTokenSubject.next('__FAILED__');
          this.performSoftLogout();
          return throwError(() => new Error('Refresh returned null'));
        }
      }),
      catchError(err => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next('__FAILED__');
        console.error('[AuthInterceptor] Error en refresh proactivo:', err);
        this.performSoftLogout();
        return throwError(() => err);
      })
    );
  }

  /**
   * Envía la request con el token actual e incluye manejo reactivo de 401 como respaldo.
   */
  private sendWithToken(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.tokenService.getToken().pipe(
      switchMap(token => {
        if (token && token.getValue()) {
          req = this.addToken(req, token.getValue());
        }
        return next.handle(req).pipe(
          catchError(error => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              return this.handle401Error(req, next);
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  /**
   * Ante un 401, intenta renovar el access token usando el refresh token.
   * Si el refresh tiene éxito, reintenta la request original de forma transparente.
   * Si falla, hace logout.
   */
  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const now = Date.now();
    this.error401History = this.error401History.filter(t => now - t < this.TIME_WINDOW);
    this.error401History.push(now);

    // Demasiados 401 en poco tiempo → logout directo (evita bucles)
    if (this.error401History.length > this.MAX_401_PER_MINUTE) {
      console.error('[AuthInterceptor] Demasiados errores 401, haciendo logout');
      this.performSoftLogout();
      return throwError(() => new Error('Too many 401 errors'));
    }

    // Si ya hay un refresh en curso, encolar esta request hasta que resuelva
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        // Wait for either a valid token OR the '__FAILED__' sentinel
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          if (token === '__FAILED__') {
            return throwError(() => new Error('Token refresh failed'));
          }
          return next.handle(this.addToken(req, token!));
        })
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      // No refresh token almacenado → desbloquear requests encoladas y hacer logout
      console.warn('[AuthInterceptor] ⚠️ No hay refresh token almacenado → logout. Vuelve a iniciar sesión.');
      this.isRefreshing = false;
      this.refreshTokenSubject.next('__FAILED__');
      this.performSoftLogout();
      return throwError(() => new Error('No refresh token'));
    }

    return this.tokenService.refreshAccessToken().pipe(
      switchMap(newToken => {
        this.isRefreshing = false;
        if (newToken) {
          // Refresh ok: reset the 401 counter so normal subsequent calls don't hit the anti-loop
          this.error401History = [];
          this.refreshTokenSubject.next(newToken);
          console.log('[AuthInterceptor] Token refreshed OK, retrying original request');
          return next.handle(this.addToken(req, newToken));
        } else {
          console.warn('[AuthInterceptor] refreshAccessToken returned null → logout');
          this.refreshTokenSubject.next('__FAILED__');
          this.performSoftLogout();
          return throwError(() => new Error('Refresh token inválido o expirado'));
        }
      }),
      catchError(error => {
        this.isRefreshing = false;
        console.error('[AuthInterceptor] Refresh request failed:', error);
        this.refreshTokenSubject.next('__FAILED__');
        this.performSoftLogout();
        return throwError(() => error);
      })
    );
  }

  private async performSoftLogout(): Promise<void> {
    try {
      // Paso 1: Limpiar tokens inmediatamente
      this.tokenService.clearTokens();
      
      // Paso 2: Limpiar localStorage crítico
      const criticalKeys = [
        'currentUser',
        'auth_app_token', 
        'auth_app_refresh_token'
      ];
      
      criticalKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Could not remove ${key}:`, e);
        }
      });
      
      // Paso 3: Limpiar sessionStorage selectivamente
      try {
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('auth') || key.includes('token') || key.includes('user')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Could not clean sessionStorage:', e);
      }
      
      // Paso 4: Logout de Google de forma suave
      const authGoogleService = this.injector.get(AuthGoogleService);
      try {
        await authGoogleService.logout();
      } catch (error) {
        console.warn('Google logout failed (non-critical):', error);
      }
      
      // Paso 5: Navegación suave sin flags problemáticos
      setTimeout(() => {
        const currentPath = this.router.url;
        
        // NO redirigir a login si estamos en rutas públicas de descarga
        const isPublicDownloadRoute = currentPath.includes('/site/descarga/');
        
        if (!currentPath.includes('/autenticacion/login') && !isPublicDownloadRoute) {
   
          this.router.navigate(['/autenticacion/login'], { 
            queryParams: { 
              returnUrl: currentPath,
              sessionExpired: 'true'
            },
            replaceUrl: true
          });
        } else if (isPublicDownloadRoute) {
        }
      }, 100);
      
    } catch (error) {
      console.error('Error during soft logout:', error);
      
      // Fallback: reportar como actividad sospechosa
      // const antiLoopService = this.injector.get(UnifiedAntiLoopService);
      // antiLoopService.reportSuspiciousActivity('AuthInterceptor', { 
      //   error: error.message,
      //   action: 'soft_logout_failed' 
      // }); // TEMPORALMENTE DESACTIVADO
      console.warn('🚨 Soft logout failed - AuthInterceptor');
    }
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    // V37: usar setHeaders en lugar de `headers` para MERGEAR con los headers
    // existentes (incluyendo el Content-Type automatico que Angular pone para
    // FormData). Antes este codigo REEMPLAZABA los headers y eliminaba el
    // boundary del multipart/form-data, lo que causaba 415.
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
}
