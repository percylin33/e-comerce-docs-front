import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NbAuthService, NbAuthResult } from '@nebular/auth';
import { AuthGoogleService } from '../auth-google.service';
import { TokenService } from '../token.service';

@Component({
  selector: 'ngx-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;
  errors: string[] = [];
  messages: string[] = [];
  showMessages = {
    error: true,
    success: true,
  };

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

  constructor(
    private fb: FormBuilder,
    private authService: NbAuthService,
    private router: Router,
    private authGoogleService: AuthGoogleService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      country: ['', [Validators.required]],
      roles: [['USER'], [Validators.required]], // Puedes cambiar el valor por defecto si es necesario
      email: ['', [Validators.required, Validators.email]],
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      confirmPassword.setErrors(null);
    }
  }

  register(): void {
    this.submitted = true;
    this.errors = [];
    this.messages = [];

    if (this.registerForm.invalid) {
      this.errors.push('Por favor, complete todos los campos requeridos.');
      return;
    }

    const registerData = this.registerForm.value;

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
          this.router.navigateByUrl('/');
        } else {
          this.errors = result.getErrors();
        }
      },
      error: (err) => {
        this.submitted = false;
        this.errors = [err];
      }
    });
  }

  loginWithGoogle(): void {
    this.authGoogleService.login();
  }

  get username() {
    return this.registerForm.get('username');
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

  get rol() {
    return this.registerForm.get('rol');
  }

  get email() {
    return this.registerForm.get('email');
  }
}
