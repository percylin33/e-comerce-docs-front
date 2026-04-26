import { NgModule } from "@angular/core";
import { ThemeModule } from "../@theme/theme.module";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AdminPromotorComponent } from "./admin-promotor.component";
import { EmbajadorComponent } from './Embajador/embajador.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { RetirosComponent } from './retiros/retiros.component';
import { MetricsCardComponent } from './components/metrics-card/metrics-card.component';
import { InsightCardComponent } from './components/insight-card/insight-card.component';
import { NbCardModule, NbMenuModule, NbLayoutModule } from "@nebular/theme";
import { RouterModule } from "@angular/router";
import { PromotorComponent } from "./promotor/promotor.component";
import { AdminPromotorRoutingModule } from "./admin-promotor-routing.module";
import { MatDialogModule } from '@angular/material/dialog';
import { CuponComponent } from './cupon/cupon.component'; // Importa MatDialogModule
import { CuponesComponent } from './cupones/cupones.component';
import { SharedModule } from '../shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { TutorialComponent } from './tutorial/tutorial.component';
import { GuiasComponent } from './guias/guias.component';
import { PerfilComponent } from './perfil/perfil.component';
import { AyudaComponent } from './ayuda/ayuda.component';
import { TerminosComponent } from './terminos/terminos.component';
import { PrivacidadComponent } from './privacidad/privacidad.component';
import { VentasComponent } from './ventas/ventas.component';

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
        EmbajadorComponent,
        EstadisticasComponent,
        RetirosComponent,
        MetricsCardComponent,
        InsightCardComponent,
        PromotorComponent,
        CuponComponent,
        CuponesComponent,
        TutorialComponent,
        GuiasComponent,
        PerfilComponent,
        AyudaComponent,
        TerminosComponent,
        PrivacidadComponent,
        VentasComponent
    ]
})
export class AdminPromotorModule {}