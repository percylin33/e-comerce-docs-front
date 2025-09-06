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
      oidc: true,
      showDebugInformation: true, // Solo para debugging
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
      // Limpiar estado anterior antes de iniciar nuevo login
      this.clearAuthState();
      this.oauthService.initLoginFlow();
    } catch (error) {
      console.error('Error al inicializar Google login:', error);
      throw error;
    }
  }

  logout() {
    try {
      this.oauthService.logOut();
      this.clearAuthState();
    } catch (error) {
      console.error('Error durante logout:', error);
      // Asegurar limpieza even si hay error
      this.clearAuthState();
    }
  }

  private clearAuthState() {
    localStorage.removeItem('auth_app_token');
    localStorage.removeItem('auth_app_refresh_token');
    localStorage.removeItem('currentUser');
    this.sharedService.setAuthenticated(false);
    this.sharedService.setUser(null);
  }

  getProfile() {
    return this.oauthService.getIdentityClaims();
  }

  handleGoogleLogin() {
    this.oauthService.loadUserProfile().then(profile => {
      const idToken = this.oauthService.getIdToken();
      const accessToken = this.oauthService.getAccessToken();
      
      if (!accessToken || !idToken) {
        console.error('No access token or ID token found');
        this.handleLoginError('No se pudo obtener los tokens de Google');
        return;
      }

      // Agregar timeout para evitar que la petición se cuelgue indefinidamente
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Google login tomó demasiado tiempo')), 15000);
      });

      const loginPromise = this.http.post(environment.apiUrl+'/auth/google', { token: idToken }).toPromise();

      Promise.race([loginPromise, timeoutPromise])
        .then((response: any) => {
          const token = response.token;
          if (token) {
            this.tokenService.setToken(token);
            
            // Decodificar el JWT y crear objeto usuario con estructura correcta
            const decodedToken: any = jwtDecode(token);
            this.user = {
              id: decodedToken.idUser,
              email: decodedToken.sub, // subject contains the username/email
              name: decodedToken.name || '',
              lastname: decodedToken.lastname || '',
              picture: decodedToken.picture || '', // Usar 'picture' para consistencia con el template
              phone: decodedToken.phone || '',
              roles: decodedToken.roles || []
            };

            // Guardar usuario en localStorage para persistencia
            localStorage.setItem('currentUser', JSON.stringify(this.user));
            
            this.sharedService.setUser(this.user);
            this.sharedService.setAuthenticated(true);
            
            // SOLUCIÓN: Navegar a ruta específica en lugar de raíz para evitar bucles
            this.router.navigate(['/site/home']);
          } else {
            this.handleLoginError('No se recibió token del servidor');
          }
        })
        .catch((error) => {
          console.error('Google login failed', error);
          this.handleLoginError(error.message || 'Error durante el inicio de sesión con Google');
        });
    }).catch(error => {
      console.error('Error loading user profile', error);
      this.handleLoginError('Error al cargar el perfil de usuario');
    });
  }

  private handleLoginError(message: string) {
    this.clearAuthState();
    // Aquí podrías mostrar un mensaje de error al usuario
    console.error('Error de autenticación:', message);
    // Opcional: redirigir al login con mensaje de error
    this.router.navigate(['/autenticacion/login'], {
      queryParams: { error: 'google_auth_failed' }
    });
  }
}
