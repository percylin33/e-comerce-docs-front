import { RouterModule, Routes } from "@angular/router";
import { AdminPromotorComponent } from "./admin-promotor.component";
import { NgModule } from "@angular/core";

const routes: Routes = [
    {
        path: '',
        component: AdminPromotorComponent,
        children: [
          {
            path: 'panel',
            loadComponent: () => import('./promotor/promotor.component').then(m => m.PromotorComponent),
          },
          {
            path: 'embajador',
            loadComponent: () => import('./Embajador/embajador.component').then(m => m.EmbajadorComponent),
          },
          {
            path: 'estadisticas',
            loadComponent: () => import('./estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
          },
          {
            path: 'retiros',
            loadComponent: () => import('./retiros/retiros.component').then(m => m.RetirosComponent),
          },
          {
            path: 'ventas',
            loadComponent: () => import('./ventas/ventas.component').then(m => m.VentasComponent),
          },
          {
            path: 'guias',
            loadComponent: () => import('./guias/guias.component').then(m => m.GuiasComponent),
          },
          {
            path: 'perfil',
            loadComponent: () => import('./perfil/perfil.component').then(m => m.PerfilComponent),
          },
          {
            path: 'ayuda',
            loadComponent: () => import('./ayuda/ayuda.component').then(m => m.AyudaComponent),
          },
          {
            path: 'terminos',
            loadComponent: () => import('./terminos/terminos.component').then(m => m.TerminosComponent),
          },
          {
            path: 'privacidad',
            loadComponent: () => import('./privacidad/privacidad.component').then(m => m.PrivacidadComponent),
          },
          {
            path: 'cupon',
            loadComponent: () => import('./cupon/cupon.component').then(m => m.CuponComponent),
          },
          {
            path: 'cupones',
            loadComponent: () => import('./cupones/cupones.component').then(m => m.CuponesComponent),
          },
          {
            path: 'tutorial',
            loadComponent: () => import('./tutorial/tutorial.component').then(m => m.TutorialComponent),
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
