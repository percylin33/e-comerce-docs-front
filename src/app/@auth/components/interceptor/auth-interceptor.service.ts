import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenService } from '../token.service';
import { Router } from '@angular/router';
import { AuthGoogleService } from '../auth-google.service';
// import { UnifiedAntiLoopService } from '../../../@core/services/unified-anti-loop.service'; // TEMPORALMENTE DESACTIVADO

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private handle401InProgress = false;
  private readonly MAX_401_PER_MINUTE = 3;
  private readonly TIME_WINDOW = 60000; // 1 minuto
  private error401History: number[] = [];

  constructor(
    private tokenService: TokenService, 
    private router: Router, 
    private injector: Injector
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth para algunos endpoints específicos
    if (req.headers.has('skip-auth-interceptor')) {
      const newReq = req.clone({
        headers: req.headers.delete('skip-auth-interceptor')
      });
      return next.handle(newReq);
    }

    return this.tokenService.getToken().pipe(
      switchMap(token => {
        if (token && token.getValue()) {
          req = this.addToken(req, token.getValue());
        }
        return next.handle(req).pipe(
          catchError(error => {
            if (error instanceof HttpErrorResponse) {
              if (error.status === 401) {
                return this.handle401ErrorSafely(error);
              } else if (error.status === 0) {
                // Error de red - no hacer nada agresivo
                console.warn('Network error detected, skipping auth handling');
              }
            }
            return throwError(error);
          })
        );
      })
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  private handle401ErrorSafely(error: HttpErrorResponse): Observable<never> {
    const now = Date.now();
    
    // Limpiar historial de errores 401 antiguos
    this.error401History = this.error401History.filter(
      timestamp => now - timestamp < this.TIME_WINDOW
    );
    
    // Agregar error actual
    this.error401History.push(now);
    
    // Si hay demasiados errores 401 en poco tiempo, activar emergencia
    if (this.error401History.length > this.MAX_401_PER_MINUTE) {
      // const antiLoopService = this.injector.get(UnifiedAntiLoopService);
      // antiLoopService.forceEmergencyMode('excessive_401_errors'); // TEMPORALMENTE DESACTIVADO
      console.error('🚨 Demasiados errores 401 - AuthInterceptor');
      return throwError(error);
    }
    
    // Prevenir múltiples handles simultáneos
    if (this.handle401InProgress) {
      console.warn('401 handling already in progress, skipping');
      return throwError(error);
    }
    
    this.handle401InProgress = true;
    
    // Realizar limpieza y logout de forma más suave
    this.performSoftLogout().finally(() => {
      this.handle401InProgress = false;
    });
    
    return throwError(error);
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
        console.log('Google logout completed successfully');
      } catch (error) {
        console.warn('Google logout failed (non-critical):', error);
      }
      
      // Paso 5: Navegación suave sin flags problemáticos
      setTimeout(() => {
        const currentPath = this.router.url;
        
        // NO redirigir a login si estamos en rutas públicas de descarga
        const isPublicDownloadRoute = currentPath.includes('/site/descarga/');
        
        if (!currentPath.includes('/autenticacion/login') && !isPublicDownloadRoute) {
          console.log('🔄 Navegando a login después de sesión expirada');
          this.router.navigate(['/autenticacion/login'], { 
            queryParams: { 
              returnUrl: currentPath,
              sessionExpired: 'true'
            },
            replaceUrl: true
          });
        } else if (isPublicDownloadRoute) {
          console.log('🔓 Ruta pública de descarga detectada - NO redirigiendo a login');
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

  private async forceCleanGoogleAuthSoft(): Promise<void> {
    return new Promise((resolve) => {
      try {
        
        // Paso 1: Limpiar solo las cookies críticas de Google (menos agresivo)
        const criticalGoogleCookies = [
          'g_state', 'G_AUTHUSER_H', 'G_ENABLED_IDPS', 'session_state', 'oauth2_cs_%'
        ];
        
        criticalGoogleCookies.forEach(cookieName => {
          // Solo limpiar del dominio actual y google.com
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.google.com;`;
        });

        // Paso 2: Limpiar solo los elementos de storage relacionados con auth (más selectivo)
        ['localStorage', 'sessionStorage'].forEach(storageType => {
          const storage = window[storageType as keyof Window] as Storage;
          if (storage) {
            const keysToRemove = [];
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key && (
                key.includes('google') || key.includes('gapi') || key.includes('oauth') || 
                key.includes('auth_app') || key.includes('credential')
              )) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => storage.removeItem(key));
          }
        });

        // Paso 3: Limpiar estado de Google Auth sin destruir completamente
        const windowWithGapi = window as any;
        
        if (windowWithGapi.gapi && windowWithGapi.gapi.auth2) {
          
          try {
            const authInstance = windowWithGapi.gapi.auth2.getAuthInstance();
            if (authInstance && authInstance.signOut) {
              authInstance.signOut();
            }
          } catch (error) {
            console.warn('Error en signOut suave:', error);
          }
        }

        // Paso 4: Remover solo iframes de Google (no todos los scripts para evitar problemas de estilos)
        const selectorsToRemove = [
          'iframe[src*="accounts.google.com"]',
          'iframe[id*="google-signin"]'
        ];
        
        selectorsToRemove.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            element.remove();
          });
        });

        
        // Tiempo mínimo para completar la limpieza
        setTimeout(() => {
          resolve();
        }, 50); // Tiempo mucho más corto
        
      } catch (error) {
        console.error('❌ Error durante limpieza SUAVE:', error);
        resolve(); // Resolver de todos modos
      }
    });
  }

  private async forceCleanGoogleAuth(): Promise<void> {
    return new Promise((resolve) => {
      try {
        
        // Paso 1: Limpiar cookies de Google de manera más agresiva
        const googleCookies = [
          'g_state', 'G_AUTHUSER_H', 'G_ENABLED_IDPS', 'SAPISID', 'APISID', 
          'SSID', 'HSID', 'SID', '1P_JAR', 'CONSENT', 'NID', 'session_state',
          'oauth2_cs_%', '__Secure-3PAPISID', '__Secure-3PSID'
        ];
        
        const domains = ['', '.google.com', '.googleapis.com', '.accounts.google.com', location.hostname];
        const paths = ['/', '/auth', '/oauth'];
        
        googleCookies.forEach(cookieName => {
          domains.forEach(domain => {
            paths.forEach(path => {
              // Limpiar con diferentes combinaciones de dominio y path
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; ${domain ? `domain=${domain};` : ''} SameSite=None; Secure;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; ${domain ? `domain=${domain};` : ''}`;
            });
          });
        });

        // Paso 2: Limpiar TODOS los datos de storage que puedan estar relacionados
        ['localStorage', 'sessionStorage'].forEach(storageType => {
          const storage = window[storageType as keyof Window] as Storage;
          if (storage) {
            const keysToRemove = [];
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key && (
                key.includes('google') || key.includes('gapi') || key.includes('G_') || 
                key.includes('auth') || key.includes('oauth') || key.includes('token') ||
                key.includes('user') || key.includes('session') || key.includes('credential')
              )) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => storage.removeItem(key));
          }
        });

        // Paso 3: Destruir completamente el estado de Google Auth
        const windowWithGapi = window as any;
        
        if (windowWithGapi.gapi) {
          
          // Intentar todos los métodos posibles de limpieza
          try {
            if (windowWithGapi.gapi.auth2) {
              const authInstance = windowWithGapi.gapi.auth2.getAuthInstance();
              if (authInstance) {
                // Forzar desconexión completa
                if (authInstance.signOut) {
                  try {
                    authInstance.signOut();
                  } catch (e) { console.warn('Error en signOut:', e); }
                }
                if (authInstance.disconnect) {
                  try {
                    authInstance.disconnect();
                  } catch (e) { console.warn('Error en disconnect:', e); }
                }
                
                // Limpiar listeners
                if (authInstance.isSignedIn && authInstance.isSignedIn.listen) {
                  authInstance.isSignedIn.listen(() => {});
                }
                if (authInstance.currentUser && authInstance.currentUser.listen) {
                  authInstance.currentUser.listen(() => {});
                }
              }
            }
            
            // Destruir referencias globales
            delete windowWithGapi.gapi;
            delete windowWithGapi.google;
            delete windowWithGapi.googleapis;
            
          } catch (error) {
            console.warn('Error al destruir gapi:', error);
          }
        }

        // Paso 4: Remover TODOS los elementos DOM relacionados con Google
        const selectorsToRemove = [
          'iframe[src*="google"]',
          'iframe[src*="gapi"]', 
          'iframe[id*="google"]',
          'iframe[name*="google"]',
          'script[src*="apis.google"]',
          'script[src*="platform.js"]',
          'link[href*="google"]',
          '[id*="google-signin"]',
          '.g-signin2',
          '.google-signin-button'
        ];
        
        selectorsToRemove.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            element.remove();
          });
        });

        // Paso 5: Limpiar event listeners del DOM
        try {
          document.removeEventListener('DOMContentLoaded', () => {});
        } catch (error) {
          console.warn('Error limpiando listeners:', error);
        }

        // Paso 6: Forzar garbage collection si está disponible
        if (windowWithGapi.gc) {
          windowWithGapi.gc();
        }

        
        // Dar tiempo extra para que se complete toda la limpieza
        setTimeout(() => {
          // Verificación final
          resolve();
        }, 200);
        
      } catch (error) {
        console.error('❌ Error durante limpieza ULTRA profunda:', error);
        resolve(); // Resolver de todos modos
      }
    });
  }


   /*private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private tokenService: TokenService, private authService: NbAuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.tokenService.getToken().pipe(
      switchMap(token => {
        if (token && token.getValue()) {
          req = this.addToken(req, token.getValue());
        }
        return next.handle(req).pipe(
          catchError(error => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              return this.handle401Error(req, next);
            } else {
              return throwError(error);
            }
          })
        );
      })
    );
  }


  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.tokenService.getRefreshToken();
      if (!refreshToken) {
        this.isRefreshing = false;
        return throwError('No refresh token available');
      }

      return this.authService.refreshToken('email', { token: refreshToken }).pipe(
        switchMap((result: NbAuthResult) => {
          this.isRefreshing = false;
          const newToken = result.getToken();
          if (newToken) {
            this.tokenService.setToken(newToken.getValue());
            this.refreshTokenSubject.next(newToken.getValue());
            return next.handle(this.addToken(req, newToken.getValue()));
          } else {
            return throwError('Failed to refresh token');
          }
        }),
        catchError((error) => {
          this.isRefreshing = false;
          return throwError(error);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token)))
      );
    }
  }*/
}
