import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { CuentaUsuarioComponent } from "./cuenta-usuario.component";

const routes: Routes = [
    {
        path: '',
        component: CuentaUsuarioComponent,
        children: [
          {
            path: 'perfil',
            loadComponent: () => import('./perfil/perfil.component').then(m => m.PerfilComponent),
          },
          {
            path: 'suscripciones',
            loadComponent: () => import('./suscripciones/suscripciones.component').then(m => m.SuscripcionesComponent),
          },
          {
            path: 'documentos',
            loadComponent: () => import('./documentos/documentos.component').then(m => m.DocumentosComponent),
          },
          {
            path: '',
            redirectTo: 'perfil',
            pathMatch: 'full',
          },
        ],
      },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CuentaUsuarioRoutingModule {}
