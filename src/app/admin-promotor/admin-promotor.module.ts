import { NgModule } from "@angular/core";
import { ThemeModule } from "../@theme/theme.module";
import { CommonModule } from "@angular/common";
import { AdminPromotorComponent } from "./admin-promotor.component";
import { NbMenuModule } from "@nebular/theme";
import { RouterModule } from "@angular/router";
import { PromotorComponent } from "./promotor/promotor.component";
import { AdminPromotorRoutingModule } from "./admin-promotor-routing.module";

@NgModule({
    declarations: [
        AdminPromotorComponent,
        PromotorComponent
    ],
    imports: [
        CommonModule,
        NbMenuModule,
        RouterModule,
        ThemeModule,
        AdminPromotorRoutingModule
    ],
    providers: [],
    bootstrap: []
})
export class AdminPromotorModule {}