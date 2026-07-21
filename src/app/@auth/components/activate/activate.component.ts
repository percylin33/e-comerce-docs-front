import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatError, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { jwtDecode } from 'jwt-decode';

import {
  ActivationPreview,
  ActivationService,
} from './activation.service';
import { TokenService } from '../token.service';
import { SharedService } from '../shared.service';

/**
 * Pantalla de activacion de cuenta para usuarios provisionados por el ERP/CRM.
 *
 * <p>Flujo: lee el token de la query string, lo valida contra
 * {@code GET /api/v1/auth/activate/preview}, pide al usuario una contrasena
 * nueva + los campos faltantes del perfil, y al enviar llama a
 * {@code POST /api/v1/auth/activate}. Si tiene exito guarda el JWT,
 * decodifica el usuario y navega a {@code /site/home}.</p>
 */
@Component({
  selector: 'ngx-activate',
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatHint,
    MatSuffix,
    MatIcon,
    MatIconButton,
    MatButton,
    MatSelect,
    MatOption,
    MatProgressSpinner,
  ],
})
export class ActivateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private activationService = inject(ActivationService);
  private tokenService = inject(TokenService);
  private sharedService = inject(SharedService);

  step: 'loading' | 'form' | 'invalid' | 'expired' = 'loading';
  preview?: ActivationPreview;
  token = '';
  loadingSubmit = false;
  submitError = '';
  errorTitle = '';
  errorMessage = '';

  hideNewPassword = true;
  hideConfirmPassword = true;

  form: FormGroup;

  ngOnInit(): void {
    // El spinner global del shell de pages no se oculta en rutas que no
    // entran a nb-layout; lo escondemos manualmente como en
    // CompletarPerfilComponent.
    const spinner = document.getElementById('nb-global-spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }

    this.token = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();
    if (!this.token) {
      this.step = 'invalid';
      this.errorTitle = 'Link de activacion invalido';
      this.errorMessage =
        'El link no incluye un token. Revisa el correo que te enviamos.';
      return;
    }

    this.activationService.preview(this.token).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.buildForm(preview);
        this.step = 'form';
      },
      error: (err: Error & { code?: string }) => {
        if (err.code === 'ACTIVATION_TOKEN_EXPIRED') {
          this.step = 'expired';
          this.errorTitle = 'Link expirado';
          this.errorMessage =
            'Tu link de activacion expiro o ya fue usado. Pide al equipo de soporte que te reenvie uno nuevo.';
        } else {
          this.step = 'invalid';
          this.errorTitle = 'Link invalido';
          this.errorMessage =
            err.message ||
            'No pudimos validar tu link de activacion. Contacta a soporte.';
        }
      },
    });
  }

  private buildForm(preview: ActivationPreview): void {
    const missing = preview.missing_fields ?? [];

    const requiredIfMissing = (field: string) =>
      missing.includes(field) ? [Validators.required] : [];

    this.form = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8), this.strongPasswordValidator]],
        confirmPassword: ['', [Validators.required]],
        firstname: ['', requiredIfMissing('firstname')],
        lastname: ['', requiredIfMissing('lastname')],
        phone: ['', requiredIfMissing('phone')],
        pais: ['', requiredIfMissing('pais')],
        documento_tipo: ['', requiredIfMissing('documento_tipo')],
        documento_numero: ['', requiredIfMissing('documento_numero')],
      },
      { validators: this.matchPasswords },
    );
  }

  showField(field: string): boolean {
    return (this.preview?.missing_fields ?? []).includes(field);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loadingSubmit = true;
    this.submitError = '';
    const v = this.form.value;
    this.activationService
      .activate({
        token: this.token,
        password: v.newPassword,
        profile: {
          firstname: v.firstname || undefined,
          lastname: v.lastname || undefined,
          phone: v.phone || undefined,
          pais: v.pais || undefined,
          documento_tipo: v.documento_tipo || undefined,
          documento_numero: v.documento_numero || undefined,
        },
      })
      .subscribe({
        next: (resp) => {
          this.tokenService.setToken(resp.token);
          if (resp.refreshToken) {
            this.tokenService.setRefreshToken(resp.refreshToken);
          }
          try {
            const decoded: any = jwtDecode(resp.token);
            const user = {
              id: decoded.idUser,
              email: decoded.sub,
              name: decoded.name ?? '',
              lastname: decoded.lastname ?? '',
              picture: decoded.picture ?? '',
              phone: decoded.phone ?? '',
              country: decoded.country ?? '',
              roles: decoded.roles ?? [],
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.sharedService.setUser(user);
            this.sharedService.setAuthenticated(true);
          } catch (e) {
            console.warn('No se pudo decodificar el JWT post-activacion', e);
          }
          this.snack.open(
            'Tu cuenta esta activa. Bienvenido a Carpeta Digital.',
            'OK',
            { duration: 4000 },
          );
          this.router.navigateByUrl('/site/home', { replaceUrl: true });
        },
        error: (err: Error & { code?: string; details?: Record<string, unknown> }) => {
          this.loadingSubmit = false;
          this.submitError = err.message;
          if (err.code === 'PROFILE_INCOMPLETE') {
            this.submitError +=
              ' Faltan campos: ' +
              ((err.details?.missing_fields as string[]) ?? []).join(', ');
          }
        },
      });
  }

  resendInstructions(): void {
    this.snack.open(
      'Pide soporte que te reenvie el correo de activacion: soporte@carpetadigital.org',
      'OK',
      { duration: 7000 },
    );
  }

  private strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string;
    if (!v) return null;
    const ok = /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v);
    return ok ? null : { weakPassword: true };
  }

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const a = group.get('newPassword')?.value;
    const b = group.get('confirmPassword')?.value;
    if (!a || !b) return null;
    return a === b ? null : { passwordsMismatch: true };
  }

  get f() {
    return this.form.controls;
  }
}
