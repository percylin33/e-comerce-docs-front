import { NgModule } from "@angular/core";
import { DashboardPromotoresComponent } from "./dashboard-promotores.component";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ThemeModule } from "../@theme/theme.module";
import { DashboardPromotoresRoutingModule } from "./dashboard-promotores-routing.module";
import { RouterModule } from "@angular/router";
import { NbButtonModule, NbCardModule, NbIconModule, NbInputModule, NbLayoutModule } from "@nebular/theme";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NbLayoutModule,
        NbCardModule,
        NbInputModule,
        NbIconModule,
        NbButtonModule,
        RouterModule,
        ThemeModule,
        DashboardPromotoresRoutingModule,
        DashboardPromotoresComponent,
    ]
})
export class DashboardPromotoresModule {}
