import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NbAuthService, NbAuthResult } from '@nebular/auth';
import { SharedService } from '../shared.service';
import { jwtDecode } from 'jwt-decode';
import { AuthGoogleService } from '../auth-google.service'; // Importa el servicio de Google
import { TokenService } from '../token.service';


@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class NgxLoginComponent implements OnInit {
  loginForm: FormGroup;
  submitted = false;
  errors: string[] = [];
  messages: string[] = [];
  showMessages = {
    error: true,
    success: true,
  };
  rememberMe = true;

  constructor(
    private fb: FormBuilder,
    private authService: NbAuthService,
    private router: Router,
    private sharedService: SharedService,
    private authGoogleService: AuthGoogleService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  login(): void {
    this.submitted = true;
    this.errors = [];
    this.messages = [];

    if (this.loginForm.invalid) {
      this.errors.push('Por favor, complete todos los campos requeridos.');
      this.submitted = false;
      return;
    }

    const loginData = this.loginForm.value;

    this.authService.authenticate('email', loginData).subscribe({
      next: (result: NbAuthResult) => {
        this.submitted = false;
        if (result.isSuccess()) {
          this.sharedService.setAuthenticated(true);
          this.messages = result.getMessages();
          const token = result.getToken();
          if (token) {

            this.tokenService.setToken(token.getValue());
            // Verifica si el refresh token está en los datos adicionales
            const responseBody = result.getResponse().body;
            if (responseBody && responseBody.refreshToken) {
              this.tokenService.setRefreshToken(responseBody.refreshToken);
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
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
