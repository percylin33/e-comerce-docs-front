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
    const authGoogleService = this.injector.get(AuthGoogleService);
    // Llamar al método logout de AuthGoogleService
    authGoogleService.logout();
    // Redirigir al usuario a la página de inicio de sesión
    this.router.navigate(['/auth/login']);
    window.location.reload();
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
