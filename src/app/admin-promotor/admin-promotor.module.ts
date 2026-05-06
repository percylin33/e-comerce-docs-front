import { NgModule } from "@angular/core";
import { ThemeModule } from "../@theme/theme.module";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AdminPromotorComponent } from "./admin-promotor.component";
import { MetricsCardComponent } from './components/metrics-card/metrics-card.component';
import { InsightCardComponent } from './components/insight-card/insight-card.component';
import { NbCardModule, NbMenuModule, NbLayoutModule } from "@nebular/theme";
import { RouterModule } from "@angular/router";
import { AdminPromotorRoutingModule } from "./admin-promotor-routing.module";
import { MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from '../shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NbMenuModule,
        NbLayoutModule,
        RouterModule,
        ThemeModule,
        SharedModule,
        AdminPromotorRoutingModule,
        MatDialogModule,
        NbCardModule,
        NgApexchartsModule,
        AdminPromotorComponent,
        MetricsCardComponent,
        InsightCardComponent,
    ]
})
export class AdminPromotorModule {}
