import { NgModule } from "@angular/core";
import { DashboardPromotoresComponent } from "./dashboard-promotores.component";
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmbajadoresComponent } from './embajadores/embajadores.component';
import { SolicitudRetiroComponent } from './solicitud-retiro/solicitud-retiro.component';
import { ContenidoComponent } from './contenido/contenido.component';
import { ObjetivosComponent } from './objetivos/objetivos.component';
import { LegalesComponent } from './legales/legales.component';
import { PerfilAdminComponent } from './perfil-admin/perfil-admin.component';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { ThemeModule } from "../@theme/theme.module";
import { DashboardPromotoresRoutingModule } from "./dashboard-promotores-routing.module";
import { RouterModule } from "@angular/router";
import { NbLayoutModule } from "@nebular/theme";

@NgModule({
    declarations: [
    DashboardPromotoresComponent,
    DashboardComponent,
    EmbajadoresComponent,
    SolicitudRetiroComponent,
    ContenidoComponent,
    ObjetivosComponent,
    LegalesComponent,
    PerfilAdminComponent
           
        ],
        imports: [
            CommonModule,
            FormsModule,
            // NbMenuModule,
            NbLayoutModule,
            RouterModule,
            ThemeModule,
            // SharedModule,
            DashboardPromotoresRoutingModule,
                    // MatDialogModule,
                    // NbCardModule,
                    // NgApexchartsModule
        ]
})
export class DashboardPromotoresModule {}