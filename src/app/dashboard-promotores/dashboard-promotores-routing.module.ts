import { RouterModule, Routes } from "@angular/router";
import { DashboardPromotoresComponent } from "./dashboard-promotores.component";
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
            loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
          },
          {
            path: 'embajadores',
            loadComponent: () => import('./embajadores/embajadores.component').then(m => m.EmbajadoresComponent),
          },
          {
            path: 'retiros',
            loadComponent: () => import('./solicitud-retiro/solicitud-retiro.component').then(m => m.SolicitudRetiroComponent),
          },
          {
            path: 'contenido',
            loadComponent: () => import('./contenido/contenido.component').then(m => m.ContenidoComponent),
          },
          {
            path: 'objetivos',
            loadComponent: () => import('./objetivos/objetivos.component').then(m => m.ObjetivosComponent),
          },
          {
            path: 'legales',
            loadComponent: () => import('./legales/legales.component').then(m => m.LegalesComponent),
          },
          {
            path: 'crear-cupon-limitado',
            loadComponent: () => import('./crear-cupon-limitado/crear-cupon-limitado.component').then(m => m.CrearCuponLimitadoComponent),
          },
        ],
      },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardPromotoresRoutingModule {}
