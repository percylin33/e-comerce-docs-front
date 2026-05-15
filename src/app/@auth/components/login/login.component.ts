import { Component, OnInit, OnDestroy, inject, Input, booleanAttribute, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { NbAuthService, NbAuthResult } from '@nebular/auth';
import { SharedService } from '../shared.service';
import { jwtDecode } from 'jwt-decode';
import { AuthGoogleService } from '../auth-google.service';
import { TokenService } from '../token.service';
import { MembresiaSelectionDraftSyncService } from '../../../site/membresia-detail/membresia-selection-draft-sync.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { NbAlertModule, NbInputModule, NbCheckboxModule, NbButtonModule } from '@nebular/theme';


@Component({
    selector: 'ngx-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [NbAlertModule, FormsModule, ReactiveFormsModule, NbInputModule, RouterLink, NbCheckboxModule, NbButtonModule]
})
export class NgxLoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(NbAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sharedService = inject(SharedService);
  private authGoogleService = inject(AuthGoogleService);
  private tokenService = inject(TokenService);
  private membresiaSelectionDraftSync = inject(MembresiaSelectionDraftSyncService);
  /** Cuando true (p. ej. dentro de AuthModal), no navega fuera: cierra el diálogo y mantiene la página actual. */
  @Input({ transform: booleanAttribute }) embedded = false;
  private hostDialogRef = inject(MatDialogRef, { optional: true });
  switchToRegister = output<void>();

  private destroy$ = new Subject<void>();
  private googleLoginTimeout?: ReturnType<typeof setTimeout>;
  
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

  ngOnInit(): void {
    // Obtener returnUrl de la query string
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Simplificar: Solo verificar si hay sesión expirada
    const sessionExpired = this.route.snapshot.queryParams['sessionExpired'];
    if (sessionExpired) {
     
      this.clearAllAuthState();
    }

    // Verificar si ya está autenticado
    if (this.isAlreadyLoggedIn() && !sessionExpired) {
      if (this.embedded && this.hostDialogRef) {
        this.hostDialogRef.close({ success: true });
      } else {
        this.router.navigateByUrl(this.returnUrl);
      }
      return;
    }
    
    // Verificar cooldown de intentos de login
    this.checkLoginCooldown();
    
    this.initializeForm();
    
    // Resetear el estado de Google login
    this.googleLoginInProgress = false;
    
    // Inicializar Google Auth con delay
    setTimeout(() => {
      this.initializeGoogleAuth();
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.googleLoginTimeout) {
      clearTimeout(this.googleLoginTimeout);
    }
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
    
    this.messages = result.getMessages();
    
    const token = result.getToken();
    if (token) {
      const tokenValue = token.getValue();
      this.tokenService.setToken(tokenValue);
      
      // Decodificar el JWT para obtener información del usuario
      try {
        const decodedToken: any = jwtDecode(tokenValue);
        
        // Crear objeto usuario con la estructura correcta del backend
        const currentUser = {
          id: decodedToken.idUser,
          email: decodedToken.sub, // subject contains the username/email
          name: decodedToken.name || '',
          lastname: decodedToken.lastname || '',
          picture: decodedToken.picture || '', // Usar 'picture' para consistencia con el template
          phone: decodedToken.phone || '',
          roles: decodedToken.roles || []
        };
        
        // Guardar información del usuario en localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Actualizar el SharedService
        this.sharedService.setAuthenticated(true);
        this.sharedService.setUser(currentUser);
      } catch (error) {
        console.error('Error decodificando token:', error);
        this.sharedService.setAuthenticated(false);
        this.sharedService.setUser(null);
      }
      
      // El refresh token lo captura directamente el AuthInterceptor desde la respuesta HTTP cruda.
      // Aquí solo hacemos fallback en caso de que el interceptor no lo haya procesado.
      const rawResponse = result.getResponse();
      const refreshToken =
        rawResponse?.body?.refreshToken
        || (rawResponse as any)?.refreshToken
        || rawResponse?.refreshToken
        || null;
      if (refreshToken && !this.tokenService.getRefreshToken()) {
        this.tokenService.setRefreshToken(refreshToken);
        console.log('[Login] ✅ Refresh token guardado (fallback desde Nebular)');
      }
    }
    
    if (this.embedded && this.hostDialogRef) {
      this.hostDialogRef.close({ success: true });
      return;
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
    if (this.isInCooldown) {
      return;
    }

    this.errors = [];
    this.messages = [];

    // Modal embebido: guardar ruta, cerrar diálogo y abrir flujo OAuth (vuelve a /site/home y redirige al pedido)
    if (this.embedded) {
      const path = this.router.url;
      if (path.startsWith('/')) {
        this.authGoogleService.setPostGoogleReturnUrl(path);
      }
      this.membresiaSelectionDraftSync.flush();
      this.hostDialogRef?.close();
      try {
        this.authGoogleService.login();
      } catch (error) {
        console.error('Error en Google login:', error);
      }
      return;
    }

    this.googleLoginInProgress = true;

    try {
      this.googleLoginTimeout = setTimeout(() => {
        if (this.googleLoginInProgress) {
          this.googleLoginInProgress = false;
          this.errors = ['El inicio de sesión con Google está tomando mucho tiempo. Por favor, intenta nuevamente.'];
        }
      }, 30000);

      this.authGoogleService.login();
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
    // Limpiar localStorage crítico solamente
    const keysToRemove = [
      'currentUser',
      'auth_app_token', 
      'auth_app_refresh_token'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Could not remove ${key}:`, e);
      }
    });
    
    // Limpiar sessionStorage selectivamente
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('user')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Could not clean sessionStorage:', e);
    }
  }

  // Método simple para inicializar Google Auth sin agresividad
  private initializeGoogleAuth(): void {
    try {
      const windowWithGapi = window as any;
      if (windowWithGapi.gapi && windowWithGapi.gapi.load) {
        windowWithGapi.gapi.load('auth2', () => {
          
        });
      }
    } catch (error) {
      console.warn('Error inicializando Google Auth (no crítico):', error);
    }
  }
}
