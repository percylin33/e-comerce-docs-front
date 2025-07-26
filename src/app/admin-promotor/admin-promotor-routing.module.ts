import { RouterModule, Routes } from "@angular/router";
import { PromotorComponent } from "./promotor/promotor.component";
import { AdminPromotorComponent } from "./admin-promotor.component";
import { NgModule } from "@angular/core";
import { CuponComponent } from "./cupon/cupon.component";

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
            path: 'cupon',
            component: CuponComponent, // Mostramos este componente al entrar
          },
          {
            path: '',
            redirectTo: 'panel',
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