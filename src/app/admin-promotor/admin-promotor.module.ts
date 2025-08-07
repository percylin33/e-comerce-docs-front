import { NgModule } from "@angular/core";
import { ThemeModule } from "../@theme/theme.module";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AdminPromotorComponent } from "./admin-promotor.component";
import { NbCardModule, NbMenuModule } from "@nebular/theme";
import { RouterModule } from "@angular/router";
import { PromotorComponent } from "./promotor/promotor.component";
import { AdminPromotorRoutingModule } from "./admin-promotor-routing.module";
import { MatDialogModule } from '@angular/material/dialog';
import { CuponComponent } from './cupon/cupon.component'; // Importa MatDialogModule
import { SharedModule } from '../shared/shared.module';

@NgModule({
    declarations: [
        AdminPromotorComponent,
        PromotorComponent,
        CuponComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        NbMenuModule,
        RouterModule,
        ThemeModule,
        SharedModule,
        AdminPromotorRoutingModule,
        MatDialogModule,
        NbCardModule
    ]
})
export class AdminPromotorModule {}