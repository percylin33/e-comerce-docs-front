import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NbAuthService, NbAuthResult } from '@nebular/auth';
import { SharedService } from '../shared.service';
import { jwtDecode } from 'jwt-decode';
import { AuthGoogleService } from '../auth-google.service';
import { TokenService } from '../token.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';


@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class NgxLoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loginForm: FormGroup;
  submitted = false;
  googleLoginInProgress = false;
  errors: string[] = [];
  messages: string[] = [];
  showMessages = {
    error: true,
    success: true,
  };
  rememberMe = true;
  
  // Variables para mejorar UX
  showPassword = false;
  returnUrl: string = '/';
  loginAttempts = 0;
  maxLoginAttempts = 5;
  cooldownTime = 300000; // 5 minutos en millisegundos
  isInCooldown = false;
  cooldownEndTime?: number;

  constructor(
    private fb: FormBuilder,
    private authService: NbAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private authGoogleService: AuthGoogleService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    // Obtener returnUrl de la query string
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Verificar si viene de un logout forzado (401 error)
    const forceRefresh = this.route.snapshot.queryParams['t'];
    const forceGoogleReset = this.route.snapshot.queryParams['forceGoogleReset'];
    const forceReload = this.route.snapshot.queryParams['forceReload'];
    
    // Verificar si es necesario hacer reload completo de la página
    const forcedLogout = localStorage.getItem('forcedLogout');
    const forcedLogoutTime = localStorage.getItem('forcedLogoutTime');
    const alreadyReloaded = this.route.snapshot.queryParams['reloaded'];
    
    if (forcedLogout && forcedLogoutTime && !alreadyReloaded) {
      const logoutTime = parseInt(forcedLogoutTime);
      const now = Date.now();
      
      // Solo hacer reload si fue hace menos de 10 segundos y no hemos hecho reload ya
      if ((now - logoutTime) < 10000 && forceReload === 'true') {
        console.log('🔄 Realizando reload único después de logout forzado...');
        
        // Limpiar los flags antes del reload para evitar bucles
        localStorage.removeItem('forcedLogout');
        localStorage.removeItem('forcedLogoutTime');
        
        // Usar router.navigate en lugar de window.location para mejor control
        const queryParams = { 
          returnUrl: encodeURIComponent(this.returnUrl),
          reloaded: 'true',
          t: Date.now().toString()
        };
        
        this.router.navigate(['/autenticacion/login'], { queryParams });
        return;
      } else {
        // Si ya pasó mucho tiempo o ya se hizo reload, limpiar flags
        localStorage.removeItem('forcedLogout');
        localStorage.removeItem('forcedLogoutTime');
      }
    }
    
    if (forceRefresh || forceGoogleReset) {
      // Limpiar cualquier estado residual después de logout forzado
      this.clearAllAuthState();
      
      // Limpiar los flags de logout forzado
      localStorage.removeItem('forcedLogout');
      localStorage.removeItem('forcedLogoutTime');
    }
    
    // Verificar si ya está autenticado (solo si no viene de logout forzado)
    if (!forceRefresh && !forceGoogleReset && this.isAlreadyLoggedIn()) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }
    
    // Verificar cooldown de intentos de login
    this.checkLoginCooldown();
    
    this.initializeForm();
    
    // Resetear el estado de Google login cuando se inicializa el componente
    this.googleLoginInProgress = false;
    
    // Si viene de logout forzado, reinitializar Google Auth con más tiempo
    if (forceRefresh || forceGoogleReset) {
      setTimeout(() => {
        this.reinitializeGoogleAuth();
      }, 1000); // Más tiempo para asegurar limpieza completa
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [this.rememberMe],
    });
    
    // Cargar email recordado si existe
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.loginForm.patchValue({ username: rememberedEmail, rememberMe: true });
    }
  }

  private isAlreadyLoggedIn(): boolean {
    const currentUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('auth_app_token');
    return !!(currentUser && token);
  }

  private checkLoginCooldown(): void {
    const cooldownData = localStorage.getItem('loginCooldown');
    if (cooldownData) {
      const { endTime, attempts } = JSON.parse(cooldownData);
      const now = Date.now();
      
      if (now < endTime) {
        this.isInCooldown = true;
        this.cooldownEndTime = endTime;
        this.loginAttempts = attempts;
        this.startCooldownTimer();
      } else {
        // Cooldown expirado, limpiar
        localStorage.removeItem('loginCooldown');
        this.loginAttempts = 0;
      }
    }
  }

  private startCooldownTimer(): void {
    if (!this.cooldownEndTime) return;
    
    const updateTimer = () => {
      const now = Date.now();
      if (now >= this.cooldownEndTime!) {
        this.isInCooldown = false;
        this.loginAttempts = 0;
        localStorage.removeItem('loginCooldown');
        this.errors = [];
      } else {
        const remainingMs = this.cooldownEndTime! - now;
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        this.errors = [`Demasiados intentos fallidos. Intenta nuevamente en ${remainingMinutes} minuto(s).`];
        setTimeout(updateTimer, 1000);
      }
    };
    
    updateTimer();
  }

  login(): void {
    // Verificar cooldown antes de proceder
    if (this.isInCooldown) {
      return;
    }
    
    this.submitted = true;
    this.errors = [];
    this.messages = [];

    // Validación mejorada del formulario
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      this.errors.push('Por favor, corrige los errores en el formulario.');
      this.submitted = false;
      return;
    }

    const loginData = {
      username: this.loginForm.value.username.trim().toLowerCase(),
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe
    };

    // Guardar email si "recordarme" está activado
    if (loginData.rememberMe) {
      localStorage.setItem('rememberedEmail', loginData.username);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    this.authService.authenticate('email', loginData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.submitted = false;
        })
      )
      .subscribe({
        next: (result: NbAuthResult) => {
          if (result.isSuccess()) {
            this.handleSuccessfulLogin(result);
          } else {
            this.handleFailedLogin(result.getErrors());
          }
        },
        error: (err) => {
          this.handleLoginError(err);
        }
      });
  }

  private handleSuccessfulLogin(result: NbAuthResult): void {
    // Limpiar intentos de login fallidos
    this.loginAttempts = 0;
    localStorage.removeItem('loginCooldown');
    
    this.sharedService.setAuthenticated(true);
    this.messages = result.getMessages();
    
    const token = result.getToken();
    if (token) {
      this.tokenService.setToken(token.getValue());
      
      // Verifica si el refresh token está en los datos adicionales
      const responseBody = result.getResponse().body;
      if (responseBody?.refreshToken) {
        this.tokenService.setRefreshToken(responseBody.refreshToken);
      }
    }
    
    // Navegar a la URL de retorno o página principal
    this.router.navigateByUrl(this.returnUrl);
  }

  private handleFailedLogin(errors: string[]): void {
    this.loginAttempts++;
    this.errors = errors?.length ? errors : ['Credenciales inválidas. Por favor, verifica tu email y contraseña.'];
    
    // Aplicar cooldown si se superan los intentos máximos
    if (this.loginAttempts >= this.maxLoginAttempts) {
      this.applyCooldown();
    }
  }

  private handleLoginError(error: any): void {
    console.error('Error en login:', error);
    this.loginAttempts++;
    
    let errorMessage = 'Error de conexión. Por favor, intenta nuevamente.';
    
    // Manejar diferentes tipos de errores
    if (error?.status === 401) {
      errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
    } else if (error?.status === 429) {
      errorMessage = 'Demasiados intentos. Por favor, espera antes de intentar nuevamente.';
      this.applyCooldown();
    } else if (error?.status === 0) {
      errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
    }
    
    this.errors = [errorMessage];
    
    // Aplicar cooldown si se superan los intentos máximos
    if (this.loginAttempts >= this.maxLoginAttempts) {
      this.applyCooldown();
    }
  }

  private applyCooldown(): void {
    this.isInCooldown = true;
    this.cooldownEndTime = Date.now() + this.cooldownTime;
    
    localStorage.setItem('loginCooldown', JSON.stringify({
      endTime: this.cooldownEndTime,
      attempts: this.loginAttempts
    }));
    
    this.startCooldownTimer();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  loginWithGoogle(): void {
    // Verificar cooldown antes de proceder
    if (this.isInCooldown) {
      return;
    }
    
    // Limpiar errores previos
    this.errors = [];
    this.messages = [];
    
    // Indicar que Google login está en progreso
    this.googleLoginInProgress = true;
    
    try {
      // Usar timeout para restablecer el estado si no hay respuesta
      const timeout = setTimeout(() => {
        this.googleLoginInProgress = false;
        this.errors = ['El inicio de sesión con Google está tomando mucho tiempo. Por favor, intenta nuevamente.'];
      }, 30000); // 30 segundos
      
      this.authGoogleService.login();
      
      // Limpiar el timeout si el login es exitoso
      // (esto se manejará en el servicio de Google auth)
      
    } catch (error) {
      this.googleLoginInProgress = false;
      this.errors = ['Error al iniciar sesión con Google. Por favor, intenta nuevamente.'];
      console.error('Error en Google login:', error);
    }
  }

  // Métodos de utilidad mejorados
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  clearErrors(): void {
    this.errors = [];
  }

  clearMessages(): void {
    this.messages = [];
  }

  // Getters mejorados con validación
  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get isUsernameInvalid(): boolean {
    const username = this.username;
    return !!(username && username.invalid && (username.dirty || username.touched));
  }

  get isPasswordInvalid(): boolean {
    const password = this.password;
    return !!(password && password.invalid && (password.dirty || password.touched));
  }

  get getUsernameError(): string {
    const username = this.username;
    if (username?.errors) {
      if (username.errors['required']) return 'El email es requerido';
      if (username.errors['email']) return 'Ingresa un email válido';
    }
    return '';
  }

  get getPasswordError(): string {
    const password = this.password;
    if (password?.errors) {
      if (password.errors['required']) return 'La contraseña es requerida';
      if (password.errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  get isFormDisabled(): boolean {
    return this.submitted || this.googleLoginInProgress || this.isInCooldown;
  }

  private clearAllAuthState(): void {
    // Limpiar localStorage completo relacionado con auth
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_app_token');
    localStorage.removeItem('auth_app_refresh_token');
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar cookies de Google
    const googleCookies = ['g_state', 'G_AUTHUSER_H', 'G_ENABLED_IDPS'];
    googleCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }

  private reinitializeGoogleAuth(): void {
    try {
      
      const windowWithGapi = window as any;
      
      // Paso 1: Destruir completamente cualquier instancia existente
      if (windowWithGapi.gapi) {
        
        try {
          if (windowWithGapi.gapi.auth2) {
            const authInstance = windowWithGapi.gapi.auth2.getAuthInstance();
            if (authInstance) {
              if (authInstance.signOut) authInstance.signOut();
              if (authInstance.disconnect) authInstance.disconnect();
            }
          }
        } catch (e) {
          console.warn('Error limpiando instancia existente:', e);
        }
        
        // Destruir completamente el objeto gapi
        delete windowWithGapi.gapi;
        delete windowWithGapi.google;
        delete windowWithGapi.GoogleAuth;
      }

      // Paso 2: Remover y recargar scripts de Google Auth
      
      // Remover scripts existentes
      const existingScripts = document.querySelectorAll('script[src*="apis.google"], script[src*="platform.js"]');
      existingScripts.forEach(script => {
        script.remove();
      });

      // Paso 3: Crear y cargar script fresco de Google Auth
      setTimeout(() => {
        
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/platform.js?onload=initGoogleAuth';
        script.async = true;
        script.defer = true;
        
        // Función global para reinicializar cuando el script cargue
        windowWithGapi.initGoogleAuth = () => {
          
          setTimeout(() => {
            if (windowWithGapi.gapi && windowWithGapi.gapi.load) {
              windowWithGapi.gapi.load('auth2', () => {
                
                // Verificar que esté completamente limpio
                if (windowWithGapi.gapi.auth2) {
                  const newInstance = windowWithGapi.gapi.auth2.getAuthInstance();
                  if (newInstance && newInstance.isSignedIn) {
                    const isSignedIn = newInstance.isSignedIn.get();
                    
                    // Si aún está conectado, forzar logout una vez más
                    if (isSignedIn && newInstance.signOut) {
                      newInstance.signOut().then(() => {
                      });
                    }
                  }
                }
              });
            }
          }, 100);
        };
        
        script.onerror = (error) => {
          console.error('❌ Error cargando script de Google:', error);
          // Fallback: intentar con el método anterior
          this.fallbackGoogleAuthInit();
        };
        
        document.head.appendChild(script);
        
      }, 500); // Esperar para que se complete la limpieza
      
    } catch (error) {
      console.error('❌ Error en reinicialización completa:', error);
      this.fallbackGoogleAuthInit();
    }
  }

  private fallbackGoogleAuthInit(): void {
    
    setTimeout(() => {
      const windowWithGapi = window as any;
      if (windowWithGapi.gapi && windowWithGapi.gapi.load) {
        windowWithGapi.gapi.load('auth2', () => {
        });
      }
    }, 1000);
  }
}
