import { Injectable } from '@angular/core';
import { NbAuthJWTToken, NbAuthService, NbAuthToken, NbTokenService } from '@nebular/auth';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  constructor(private nbTokenService: NbTokenService) {}

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
}
