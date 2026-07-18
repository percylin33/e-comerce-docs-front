import { RouterModule, Routes } from "@angular/router";
import { AdminCreadoresComponent } from "./admin-creadores.component";
import { adminGuard } from "./guards/creator.guard";
import { NgModule } from "@angular/core";

const routes: Routes = [
  {
    path: "",
    component: AdminCreadoresComponent,
    // Mejora M6: solo ADMIN / SUPADMIN acceden al panel admin de creadores.
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      {
        path: "",
        redirectTo: "aprobaciones",
        pathMatch: "full",
      },
      {
        path: "aprobaciones",
        loadComponent: () => import("./aprobaciones/aprobaciones.component").then(m => m.AdminCreadoresAprobacionesComponent),
      },
      {
        path: "creadores",
        loadComponent: () => import("./creadores/creadores.component").then(m => m.AdminCreadoresCreadoresComponent),
      },
      {
        path: "documentos",
        loadComponent: () => import("./documentos-creador/documentos-creador.component").then(m => m.AdminCreadoresDocumentosCreadorComponent),
      },
      {
        path: "retiros",
        loadComponent: () => import("./retiros/retiros.component").then(m => m.AdminCreadoresRetirosComponent),
      },
      {
        path: "config",
        loadComponent: () => import("./config/config.component").then(m => m.AdminCreadoresConfigComponent),
      },
      {
        path: "tutoriales",
        loadComponent: () => import("./tutoriales/tutoriales.component").then(m => m.AdminCreadoresTutorialesComponent),
      },
      {
        path: "terminos",
        loadComponent: () => import("./terminos/terminos.component").then(m => m.AdminCreadoresTerminosComponent),
      },
      {
        path: "politica-de-privacidad",
        loadComponent: () => import("./privacidad/privacidad.component").then(m => m.AdminCreadoresPrivacidadComponent),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminCreadoresRoutingModule {}
