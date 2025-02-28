import { RouterModule, Routes } from "@angular/router";
import { PromotorComponent } from "./promotor/promotor.component";
import { AdminPromotorComponent } from "./admin-promotor.component";
import { NgModule } from "@angular/core";

const routes: Routes = [
    {
        path: '',
        component: AdminPromotorComponent,
        children: [
          {
            path: 'panel',
            component: PromotorComponent, // Mostramos este componente al entrar
          }
          
        ],
      },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminPromotorRoutingModule {}