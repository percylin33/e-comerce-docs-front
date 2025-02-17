import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


import {
  NbAuthModule,
  NbPasswordAuthStrategy,
  NbAuthJWTToken,
} from '@nebular/auth';
import {
  NbAlertModule,
  NbCardModule,
  NbIconModule,
  NbLayoutModule,
  NbCheckboxModule,
  NbInputModule,
  NbButtonModule,
  NbSpinnerModule,
} from '@nebular/theme';

import { NgxAuthComponent, NgxLoginComponent } from './components';
import { AuthRoutingModule } from './auth-routing.module';
import { RegisterComponent } from './components/register/register.component';
import { AuthInterceptor } from './components/interceptor/auth-interceptor.service';
import { LogoutComponent } from './components/logout/logout.component';
import { environment } from '../../environments/environment';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { RecuperacionComponent } from './components/recuperacion/recuperacion.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const NB_MODULES = [
  NbIconModule,
  NbLayoutModule,
  NbCardModule,
  NbAlertModule,
  NbCheckboxModule,
  NbInputModule,
  NbButtonModule,
  NbSpinnerModule,
];

const COMPONENTS = [
  NgxLoginComponent,
  NgxAuthComponent,
  RegisterComponent,
  LogoutComponent,
];

@NgModule({
  declarations: [
    ...COMPONENTS,
    RecuperacionComponent,
  ],
  imports: [
    AuthRoutingModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSnackBarModule,
    CommonModule,
    ...NB_MODULES,
    NbAuthModule.forRoot({
      strategies: [
        NbPasswordAuthStrategy.setup({
          name: 'email',
          baseEndpoint: environment.apiUrl, // Modifica esta URL si es necesario
          token: {
            class: NbAuthJWTToken,
            key: 'token', // Aquí especificas la clave del token en respuesta del backend
          },
          login: {
            endpoint: '/auth/login',
            method: 'post',
          },
          register: {
            endpoint: '/auth/register',
            method: 'post',
          },
          logout: {
            endpoint: '/auth/logout',
            method: 'post',
          },
          // Otras configuraciones...
        }),
      ],
      forms: {},
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
})
export class AuthModule { }
