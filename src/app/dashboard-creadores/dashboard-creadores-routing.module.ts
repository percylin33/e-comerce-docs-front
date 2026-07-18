import { RouterModule, Routes } from "@angular/router";
import { DashboardCreadoresComponent } from "./dashboard-creadores.component";
import { creatorGuard } from "./guards/creator.guard";
import { NgModule } from "@angular/core";

const routes: Routes = [
  {
    path: "",
    component: DashboardCreadoresComponent,
    // Mejora M6: protege el modulo entero con un guard dedicado.
    canActivate: [creatorGuard],
    canActivateChild: [creatorGuard],
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        loadComponent: () => import("./dashboard/dashboard.component").then(m => m.CreadorDashboardComponent),
      },
      {
        path: "mis-documentos",
        loadComponent: () => import("./mis-documentos/mis-documentos.component").then(m => m.CreadorMisDocumentosComponent),
      },
      {
        path: "mis-documentos/nuevo",
        loadComponent: () => import("./formulario-creador/formulario-creador.component").then(m => m.CreadorFormularioComponent),
      },
      {
        path: "mis-documentos/:id/editar",
        loadComponent: () => import("./formulario-creador/formulario-creador.component").then(m => m.CreadorFormularioComponent),
      },
      {
        path: "mis-documentos/:id/detalle",
        loadComponent: () => import("./detalle-creador/detalle-creador.component").then(m => m.CreadorDetalleComponent),
      },
      {
        path: "mis-comisiones",
        loadComponent: () => import("./mis-comisiones/mis-comisiones.component").then(m => m.CreadorMisComisionesComponent),
      },
      {
        path: "mis-retiros",
        loadComponent: () => import("./mis-retiros/mis-retiros.component").then(m => m.CreadorMisRetirosComponent),
      },
      {
        path: "terminos-y-condiciones",
        loadComponent: () => import("./mis-terminos/mis-terminos.component").then(m => m.CreadorMisTerminosComponent),
      },
      {
        path: "politica-de-privacidad",
        loadComponent: () => import("./mi-privacidad/mi-privacidad.component").then(m => m.CreadorMiPrivacidadComponent),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardCreadoresRoutingModule {}
