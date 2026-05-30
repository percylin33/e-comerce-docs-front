import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NbAuthJWTToken, NbAuthToken, NbTokenService } from '@nebular/auth';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private nbTokenService = inject(NbTokenService);
  private http = inject(HttpClient);


  getToken(): Observable<NbAuthJWTToken> {
    const tokenString = localStorage.getItem('auth_app_token');
    if (tokenString) {
      const token = new NbAuthJWTToken(tokenString, 'email');

      return of(token);
    } else {
      return this.nbTokenService.get().pipe(
        map((token: NbAuthToken) => {

          return token as NbAuthJWTToken;
        })
      );
    }
  }

  getTokenString(): string | null {
    return localStorage.getItem('auth_app_token');
  }

  /**
   * Devuelve true si el access token almacenado está expirado (o ausente).
   */
  isAccessTokenExpired(): boolean {
    const token = this.getTokenString();
    if (!token) return true;
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded?.exp) return true;
      // exp es en segundos; damos 10s de margen
      return decoded.exp * 1000 < Date.now() + 10_000;
    } catch {
      return true;
    }
  }

  setToken(token: string): void {
    localStorage.setItem('auth_app_token', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('auth_app_refresh_token');
  }

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem('auth_app_refresh_token', refreshToken);
  }

  clearTokens(): void {
    this.nbTokenService.clear().subscribe(() => {
      localStorage.removeItem('auth_app_token');
      localStorage.removeItem('auth_app_refresh_token');
    });
  }

  /**
   * Usa el refresh token para obtener un nuevo access token.
   * Devuelve el nuevo token string o null si falla.
   */
  refreshAccessToken(): Observable<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return of(null);

    return this.http.post<{ token: string; refreshToken: string }>(
      `${environment.apiUrl}/auth/refresh-token`,
      { refreshToken },
      { headers: new HttpHeaders({ 'skip-auth-interceptor': 'true' }) }
    ).pipe(
      map(response => {
        this.setToken(response.token);
        if (response.refreshToken) {
          this.setRefreshToken(response.refreshToken);
        }
        return response.token;
      }),
      catchError(() => of(null))
    );
  }
}
