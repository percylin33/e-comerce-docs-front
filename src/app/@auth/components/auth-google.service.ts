import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { jwtDecode } from "jwt-decode";
import { SharedService } from './shared.service';
import { NbAuthJWTToken, NbAuthService, NbTokenService } from '@nebular/auth';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGoogleService {

  constructor(
       private oauthService: OAuthService,
       private http: HttpClient, private router: Router,
       private sharedService: SharedService,
       private NtokenService: NbTokenService,
       private tokenService: TokenService) {
    this.initLogin();
  }

  user: any;

  initLogin() {
    const config: AuthConfig = {
      issuer: 'https://accounts.google.com',
      strictDiscoveryDocumentValidation: false,
      clientId: environment.GOOGLE_CLIENT_ID,
      redirectUri: window.location.origin + '/site/home',
      scope: 'openid profile email',
      responseType: 'token id_token',
    };
    this.oauthService.configure(config);
    this.oauthService.setupAutomaticSilentRefresh();
    this.oauthService.loadDiscoveryDocumentAndTryLogin();

    // Suscribirse a los eventos de OAuth
    this.oauthService.events.subscribe(event => {
      if (event.type === 'token_received') {
        this.handleGoogleLogin();
      }
    });
  }

  login() {
    try {
      this.oauthService.initLoginFlow();
    } catch (error) {
      console.error('Error al inicializar Google login:', error);
      throw error;
    }
  }

  logout() {
    this.oauthService.logOut();
    localStorage.removeItem('auth_app_token'); // Asegúrate de eliminar el token del almacenamiento local
  }

  getProfile() {
    return this.oauthService.getIdentityClaims();
  }

  handleGoogleLogin() {
    this.oauthService.loadUserProfile().then(profile => {
      const idToken = this.oauthService.getIdToken();
      const accessToken = this.oauthService.getAccessToken();
      if (!accessToken) {
        console.error('No access token found');
        return;
      }
      this.http.post(environment.apiUrl+'/auth/google', { token: idToken }).subscribe({
        next: (response: any) => {
          const token = response.token; // Aquí obtenemos el token directamente de la respuesta
          if (token) {
            this.tokenService.setToken(token);
            //localStorage.setItem('auth_app_token', token);
            //this.NtokenService.set(new NbAuthJWTToken(token, 'google'));
            this.user = jwtDecode(token);

            this.sharedService.setUser(this.user);
            this.sharedService.setAuthenticated(true);
            // Navegar usando Angular Router en lugar de recargar la página
            this.router.navigate(['/']);
          } else {
            this.sharedService.setAuthenticated(false);
          }
        },
        error: (err) => {
          console.error('Google login failed', err);
        }
      });
    }).catch(error => {
      console.error('Error loading user profile', error);
    });
  }
}
