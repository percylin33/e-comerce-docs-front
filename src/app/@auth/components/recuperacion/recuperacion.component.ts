import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserData } from '../../../@core/interfaces/users';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
//import { RecuperacionService } from './recuperacion.service';

@Component({
  selector: 'ngx-recuperacion',
  templateUrl: './recuperacion.component.html',
  styleUrls: ['./recuperacion.component.scss']
})
export class RecuperacionComponent {
  emailForm: FormGroup;
  codeForm: FormGroup;
  passwordForm: FormGroup;
  step: number = 1;
  userInput: string = '';

  constructor(
     private fb: FormBuilder,
     private usersService: UserData,
     private sanitizer: DomSanitizer,
     private router: Router,
     private snackBar: MatSnackBar
    ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      confirmPassword.setErrors(null);
    }
  }

  sanitizeInput(input: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(input);
  }

  sendEmail() {
    if (this.emailForm.valid) {
      this.usersService.recuperacion(this.emailForm.value.email).subscribe(response => {
        if (response.status === 200) {
          this.step = 2;
        }
      });
    }
  }

  verifyCode() {
    if (this.codeForm.valid) {
      this.usersService.tokenRecuperacion(this.codeForm.value.code, this.emailForm.value.email).subscribe(response => {
        if (response.status === 200) {
          localStorage.setItem('pass_token', String(response.data));

          this.step = 3;
        }
      });
    }
  }

  resetPassword() {
    if (this.passwordForm.valid) {
      const { newPassword } = this.passwordForm.value;
      const passToken = localStorage.getItem('pass_token');

      if (!passToken) {
        console.error('Token not found');
        return;
      }

      const headers = new HttpHeaders().set('Token_password', `Bearer ${passToken}`);

      this.usersService.passwordRecuperacion(this.emailForm.value.email, newPassword, { headers }).subscribe({
        next: response => {
          if (response.status === 200) {
            this.snackBar.open('Contraseña restablecida con éxito', 'Cerrar', {
              duration: 2000,
            });
             setTimeout(() => {
             this.router.navigate(['/autenticacion/login']);
             }, 2000);
          }
        },
        error: err => {
          console.error('Error resetting password:', err.message);
        }
      });
    }
  }
}
