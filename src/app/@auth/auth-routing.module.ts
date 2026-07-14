import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxAuthComponent } from './components';
import { CompletarPerfilAccessGuard } from '../@core/guards/completar-perfil-access.guard';

const routes: Routes = [
  {
    path: 'completar-perfil',
    loadComponent: () => import('./components/completar-perfil/completar-perfil.component').then(m => m.CompletarPerfilComponent),
    canActivate: [CompletarPerfilAccessGuard],
  },
  {
    path: '',
    component: NgxAuthComponent,
    children: [
      {
        path: 'recuperacion',
        loadComponent: () => import('./components/recuperacion/recuperacion.component').then(m => m.RecuperacionComponent),
      },
      {
        // Provisionamiento desde ERP/CRM: la URL recibida en el correo
        // tiene el formato /autenticacion/activate?token=<uuid>. El
        // componente lee el query param y orquesta preview + activate.
        path: 'activate',
        loadComponent: () => import('./components/activate/activate.component').then(m => m.ActivateComponent),
      },
      {
        path: 'login',
        loadComponent: () => import('./components').then(m => m.NgxLoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'logout',
        loadComponent: () => import('./components/logout/logout.component').then(m => m.LogoutComponent),
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
