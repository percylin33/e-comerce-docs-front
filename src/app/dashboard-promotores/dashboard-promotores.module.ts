import { NgModule } from "@angular/core";
import { DashboardPromotoresComponent } from "./dashboard-promotores.component";
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmbajadoresComponent } from './embajadores/embajadores.component';
import { SolicitudRetiroComponent } from './solicitud-retiro/solicitud-retiro.component';
import { ContenidoComponent } from './contenido/contenido.component';
import { ObjetivosComponent } from './objetivos/objetivos.component';
import { LegalesComponent } from './legales/legales.component';
import { PerfilAdminComponent } from './perfil-admin/perfil-admin.component';
import { CrearCuponLimitadoComponent } from './crear-cupon-limitado/crear-cupon-limitado.component';
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
        // SharedModule,
        DashboardPromotoresRoutingModule,
        DashboardPromotoresComponent,
        DashboardComponent,
        EmbajadoresComponent,
        SolicitudRetiroComponent,
        ContenidoComponent,
        ObjetivosComponent,
        LegalesComponent,
        PerfilAdminComponent,
        CrearCuponLimitadoComponent,
    ]
})
export class DashboardPromotoresModule {}