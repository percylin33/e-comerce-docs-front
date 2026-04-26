import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../token.service';
import { SharedService } from '../shared.service';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatSuffix, MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
    selector: 'ngx-completar-perfil',
    templateUrl: './completar-perfil.component.html',
    styleUrls: ['./completar-perfil.component.scss'],
    standalone: true,
    imports: [MatIcon, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatSuffix, MatError, MatHint]
})
export class CompletarPerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private sharedService = inject(SharedService);


  form: FormGroup;
  loading = false;
  error = '';

  countries: string[] = [
    'Argentina',
    'Bolivia',
    'Brasil',
    'Chile',
    'Colombia',
    'Costa Rica',
    'Cuba',
    'Ecuador',
    'El Salvador',
    'Guatemala',
    'Honduras',
    'México',
    'Nicaragua',
    'Panamá',
    'Paraguay',
    'Perú',
    'República Dominicana',
    'Uruguay',
    'Venezuela',
    'Otro'
  ];

  ngOnInit(): void {
    // El spinner global (#nb-global-spinner) solo se oculta cuando nb-layout carga.
    // Como esta ruta no usa nb-layout, hay que ocultarlo manualmente.
    const spinner = document.getElementById('nb-global-spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }

    const token = this.tokenService.getTokenString();
    let decoded: any = {};
    if (token) {
      try { decoded = jwtDecode(token); } catch {}
    }

    this.form = this.fb.group({
      firstname: [decoded.name || '', Validators.required],
      lastname:  [decoded.lastname || '', Validators.required],
      phone:     [decoded.phone || '', [Validators.required, Validators.pattern('^(\\+?[0-9]{7,15})$')]],
      country:   [decoded.country || '', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';

    this.http.patch<any>(`${environment.apiUrl}/auth/complete-profile`, this.form.value).subscribe({
      next: (response) => {
        try {
          const token = response?.token ?? response?.data?.token;
          if (!token) {
            throw new Error('Token no recibido en la respuesta');
          }

          this.tokenService.setToken(token);
          if (response.refreshToken || response?.data?.refreshToken) {
            this.tokenService.setRefreshToken(response.refreshToken ?? response.data.refreshToken);
          }

          const decodedToken: any = jwtDecode(token);
          const formVal = this.form.value;
          const user = {
            id: decodedToken.idUser,
            email: decodedToken.sub,
            name: decodedToken.name || formVal.firstname || '',
            lastname: decodedToken.lastname || formVal.lastname || '',
            picture: decodedToken.picture || '',
            phone: decodedToken.phone || formVal.phone || '',
            // country puede no estar en el JWT si el backend aún no fue reiniciado
            country: decodedToken.country || formVal.country || '',
            roles: decodedToken.roles || []
          };

          localStorage.setItem('currentUser', JSON.stringify(user));
          this.sharedService.setUser(user);
          this.sharedService.setAuthenticated(true);

          // replaceUrl: true elimina /completar-perfil del historial
          // Si el guard bloquea la navegación, reseteamos loading para no quedar congelados
          this.router.navigate(['/site/home'], { replaceUrl: true }).then(navigated => {
            if (!navigated) {
              // Guard bloqueó → usar location.replace para saltear guards
              window.location.replace('/site/home');
            }
          });
        } catch (err) {
          console.error('Error procesando respuesta de complete-profile:', err);
          this.error = 'Error al procesar la respuesta del servidor. Intenta de nuevo.';
          this.loading = false;
        }
      },
      error: () => {
        this.error = 'Ocurrió un error al guardar tus datos. Intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  get f() { return this.form.controls; }
}
