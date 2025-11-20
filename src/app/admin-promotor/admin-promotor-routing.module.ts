import { RouterModule, Routes } from "@angular/router";
import { PromotorComponent } from "./promotor/promotor.component";
import { AdminPromotorComponent } from "./admin-promotor.component";
import { NgModule } from "@angular/core";
import { CuponComponent } from "./cupon/cupon.component";
import { TutorialComponent } from "./tutorial/tutorial.component";
import { CuponesComponent } from './cupones/cupones.component';
import { EmbajadorComponent } from './Embajador/embajador.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { RetirosComponent } from './retiros/retiros.component';
import { GuiasComponent } from './guias/guias.component';
import { PerfilComponent } from './perfil/perfil.component';
import { AyudaComponent } from './ayuda/ayuda.component';
import { TerminosComponent } from './terminos/terminos.component';
import { PrivacidadComponent } from './privacidad/privacidad.component';
import { VentasComponent } from './ventas/ventas.component';

const routes: Routes = [
    {
        path: '',
        component: AdminPromotorComponent,
        children: [
          {
            path: 'panel',
            component: PromotorComponent, // Mostramos este componente al entrar
          },
          {
            path: 'embajador',
            component: EmbajadorComponent,
          },
          {
            path: 'estadisticas',
            component: EstadisticasComponent,
          },
          {
            path: 'retiros',
            component: RetirosComponent,
          },
          {
            path: 'ventas',
            component: VentasComponent,
          },
          {
            path: 'guias',
            component: GuiasComponent,
          },
          {
            path: 'perfil',
            component: PerfilComponent,
          },
          {
            path: 'ayuda',
            component: AyudaComponent,
          },
          {
            path: 'terminos',
            component: TerminosComponent,
          },
          {
            path: 'privacidad',
            component: PrivacidadComponent,
          },
          {
            path: 'cupon',
            component: CuponComponent, // Mostramos este componente al entrar
          },
          {
            path: 'cupones',
            component: CuponesComponent,
          },
          {
            path: 'tutorial',
            component: TutorialComponent,
          },
          {
            path: '',
            redirectTo: 'embajador',
            pathMatch: 'full',
          },
        ],
      },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminPromotorRoutingModule {}