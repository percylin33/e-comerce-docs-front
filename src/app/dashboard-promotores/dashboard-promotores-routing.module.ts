import { RouterModule, Routes } from "@angular/router";
import { DashboardPromotoresComponent } from "./dashboard-promotores.component";
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmbajadoresComponent } from './embajadores/embajadores.component';
import { SolicitudRetiroComponent } from './solicitud-retiro/solicitud-retiro.component';
import { ContenidoComponent } from './contenido/contenido.component';
import { ObjetivosComponent } from './objetivos/objetivos.component';
import { LegalesComponent } from './legales/legales.component';
import { NgModule } from "@angular/core";

const routes: Routes = [
    {
        path: '',
        component: DashboardPromotoresComponent,
        children: [
      
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full',
          },
          {
            path: 'dashboard',
            component: DashboardComponent,
          },
          {
            path: 'embajadores',
            component: EmbajadoresComponent,
          },
          {
            path: 'retiros',
            component: SolicitudRetiroComponent,
          },
          {
            path: 'contenido',
            component: ContenidoComponent,
          },
          {
            path: 'objetivos',
            component: ObjetivosComponent,
          },
          {
            path: 'legales',
            component: LegalesComponent,
          },
        ],
      },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardPromotoresRoutingModule {}