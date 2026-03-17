// Nota: La ruta pública para este módulo es 'autenticacion'.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxAuthComponent, NgxLoginComponent } from './components';
import { RegisterComponent } from './components/register/register.component';
import { LogoutComponent } from './components/logout/logout.component';
import { RecuperacionComponent } from './components/recuperacion/recuperacion.component';
import { CompletarPerfilComponent } from './components/completar-perfil/completar-perfil.component';
import { CompletarPerfilAccessGuard } from '../@core/guards/completar-perfil-access.guard';


const routes: Routes = [
  {
    path: 'completar-perfil',
    component: CompletarPerfilComponent,
    canActivate: [CompletarPerfilAccessGuard],
  },
  {
    path: '',
    component: NgxAuthComponent,
    children: [
      {
        path: 'recuperacion',
        component: RecuperacionComponent,
      },
      {
        path: 'login',
        component: NgxLoginComponent,
      },
      {
        path: 'register',
        component: RegisterComponent,
      },
      {
        path: 'logout',
        component: LogoutComponent,
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule { }