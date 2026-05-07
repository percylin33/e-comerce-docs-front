import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NbAuthService, NbAuthResult } from '@nebular/auth';
import { AuthGoogleService } from '../auth-google.service';
import { TokenService } from '../token.service';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatSuffix, MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatIconButton, MatButton } from '@angular/material/button';
import { NgClass } from '@angular/common';

@Component({
    selector: 'ngx-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    standalone: true,
    imports: [MatIcon, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatSuffix, MatError, MatHint, MatSelect, MatOption, MatIconButton, NgClass, MatButton, RouterLink]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(NbAuthService);
  private router = inject(Router);
  private authGoogleService = inject(AuthGoogleService);
  private tokenService = inject(TokenService);

  registerForm!: FormGroup;
  submitted = false;
  errors: string[] = [];
  messages: string[] = [];
  showMessages = {
    error: true,
    success: true,
  };

  // Estados para mostrar/ocultar contraseñas
  hidePassword = true;
  hideConfirmPassword = true;

  countries: string[] = [
    'Argentina',
    'Bolivia',
    'Brasil',
    'Chile',
    'Colombia',
    'Ecuador',
    'Paraguay',
    'Perú',
    'Uruguay',
    'Venezuela'
  ];

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      country: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^(\\+?[0-9]{9,15})$')]], 
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup): void {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (!password || !confirmPassword) return;

    const pass = password.value ?? '';
    const confirm = confirmPassword.value ?? '';
    const existingErrors = confirmPassword.errors ?? {};

    if (pass !== confirm) {
      if (!existingErrors['mismatch']) {
        confirmPassword.setErrors({ ...existingErrors, mismatch: true });
      }
      return;
    }

    if (existingErrors['mismatch']) {
      const { mismatch, ...rest } = existingErrors;
      confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  register(): void {
    this.submitted = true;
    this.errors = [];
    this.messages = [];

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errors.push('Por favor, complete todos los campos requeridos.');
      this.submitted = false;
      return;
    }

    // No confíes en campos sensibles controlados por el cliente (ej. roles).
    // También evitamos enviar confirmPassword al backend.
    const { confirmPassword, ...rawValue } = this.registerForm.value;
    const registerData = {
      ...rawValue,
      phone: String(rawValue.phone ?? '').replace(/\s+/g, ''),
      username: rawValue.email, // Asignar el email como username
    };

    this.authService.register('email', registerData).subscribe({
      next: (result: NbAuthResult) => {
        this.submitted = false;
        if (result.isSuccess()) {
          this.messages = result.getMessages();
          const token = result.getToken();
          if (token) {
            this.tokenService.setToken(token.getValue());
            // Verifica si el refresh token está en los datos adicionales
            const responseBody = result.getResponse().body;
            if (responseBody && responseBody.refreshToken) {
              this.tokenService.setRefreshToken(responseBody.refreshToken);
              //localStorage.setItem('refresh_token', responseBody.refreshToken); // Guardar el refresh token en el local storage
            }
          }
          // SOLUCIÓN: Navegar a ruta específica en lugar de raíz para evitar bucles
          this.router.navigate(['/site/home']);
        } else {
          this.errors = result.getErrors();
        }
      },
      error: (err) => {
        this.submitted = false;
        const message =
          typeof err === 'string'
            ? err
            : (err?.error?.message ?? err?.message ?? 'Ocurrió un error inesperado. Intenta nuevamente.');
        this.errors = [message];
      }
    });
  }

  loginWithGoogle(): void {
    this.authGoogleService.login();
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get firstname() {
    return this.registerForm.get('firstname');
  }

  get lastname() {
    return this.registerForm.get('lastname');
  }

  get country() {
    return this.registerForm.get('country');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get phone() {
    return this.registerForm.get('phone');
  }

  // Métodos para la interfaz mejorada
  getPasswordStrength(): string {
    const password = this.password?.value || '';
    if (password.length === 0) return '';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'weak': return 'Débil';
      case 'medium': return 'Medio';
      case 'strong': return 'Fuerte';
      default: return '';
    }
  }

  getFormProgress(): number {
    if (!this.registerForm) return 0;
    
    const fields = ['email', 'password', 'confirmPassword', 'firstname', 'lastname', 'phone', 'country'];
    const completedFields = fields.filter(field => {
      const control = this.registerForm.get(field);
      return control && control.value && control.valid;
    });
    
    return Math.round((completedFields.length / fields.length) * 100);
  }
}
