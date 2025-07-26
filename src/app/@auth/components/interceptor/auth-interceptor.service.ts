import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenService } from '../token.service';
import { Router } from '@angular/router';
import { AuthGoogleService } from '../auth-google.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private tokenService: TokenService, private router: Router , private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.tokenService.getToken().pipe(
      switchMap(token => {
        if (token && token.getValue()) {
          req = this.addToken(req, token.getValue());
        }
        return next.handle(req).pipe(
          catchError(error => {
            if (error instanceof HttpErrorResponse) {
              if (error.status === 401) {
                this.handle401Error();
              } else if (error.status === 0) {
                // Puedes manejar el error de red aquí si es necesario
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

  private handle401Error(): void {
    // Limpiar los datos del token
    this.tokenService.clearTokens();
    
    // Limpiar localStorage completamente
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_app_token');
    localStorage.removeItem('auth_app_refresh_token');
    localStorage.removeItem('rememberedEmail');
    
    // Limpiar sessionStorage también
    sessionStorage.clear();
    
    const authGoogleService = this.injector.get(AuthGoogleService);
    
    // Llamar al método logout de AuthGoogleService
    try {
      authGoogleService.logout();
      
      // Hacer la limpieza de Google Auth de manera más suave
      this.forceCleanGoogleAuthSoft().then(() => {
        // Marcar que hubo un logout forzado
        localStorage.setItem('forcedLogout', 'true');
        localStorage.setItem('forcedLogoutTime', Date.now().toString());
        
        // Navegación directa sin recargas para evitar flash de estilos
        this.router.navigate(['/auth/login'], { 
          queryParams: { 
            returnUrl: this.router.url,
            sessionExpired: 'true' // Cambiado para ser más específico
          }
        });
      });
      
    } catch (error) {
      console.error('Error durante logout de Google:', error);
      // Si falla el logout de Google, al menos limpiar y redirigir de forma suave
      this.forceCleanGoogleAuthSoft().then(() => {
        localStorage.setItem('forcedLogout', 'true');
        localStorage.setItem('forcedLogoutTime', Date.now().toString());
        
        this.router.navigate(['/auth/login'], { 
          queryParams: { 
            returnUrl: this.router.url,
            sessionExpired: 'true'
          }
        });
      });
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
