import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ThemeModule } from "../@theme/theme.module";
import { AdminCreadoresComponent } from "./admin-creadores.component";
import { AdminCreadoresRoutingModule } from "./admin-creadores-routing.module";
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
        AdminCreadoresRoutingModule,
        AdminCreadoresComponent,
    ],
})
export class AdminCreadoresModule {}