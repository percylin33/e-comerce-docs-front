import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { PerfilComponent } from "./perfil/perfil.component";
import { SuscripcionesComponent } from "./suscripciones/suscripciones.component";
import { CuentaUsuarioComponent } from "./cuenta-usuario.component";
import { AdminPromotorComponent } from "../admin-promotor/admin-promotor.component";

const routes: Routes = [
    {
        path: '',
        component: CuentaUsuarioComponent,
        children: [
          {
            path: 'perfil',
            component: PerfilComponent, // Mostramos este componente al entrar
          },
          {
            path: 'suscripciones',
            component: SuscripcionesComponent, // Mostramos este componente al entrar
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