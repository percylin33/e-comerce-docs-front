import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ThemeModule } from "../@theme/theme.module";
import { DashboardCreadoresComponent } from "./dashboard-creadores.component";
import { DashboardCreadoresRoutingModule } from "./dashboard-creadores-routing.module";
import { NbButtonModule, NbCardModule, NbIconModule, NbInputModule, NbLayoutModule } from "@nebular/theme";
import { HttpClientModule } from "@angular/common/http";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        NbLayoutModule,
        NbCardModule,
        NbInputModule,
        NbIconModule,
        NbButtonModule,
        RouterModule,
        ThemeModule,
        DashboardCreadoresRoutingModule,
        DashboardCreadoresComponent,
    ],
})
export class DashboardCreadoresModule {}