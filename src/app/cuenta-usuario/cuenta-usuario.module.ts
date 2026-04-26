import { NgModule } from "@angular/core";
import { ThemeModule } from "../@theme/theme.module";
import { CommonModule } from "@angular/common";
import { NbCardModule, NbMenuModule, NbIconModule, NbSpinnerModule, NbAlertModule, NbButtonModule, NbTooltipModule } from "@nebular/theme";
import { RouterModule } from "@angular/router";
import { SharedModule } from "../shared/shared.module";
import { MatDialogModule } from "@angular/material/dialog";
import { CuentaUsuarioComponent } from "./cuenta-usuario.component";
import { PerfilComponent } from './perfil/perfil.component';
import { SuscripcionesComponent } from './suscripciones/suscripciones.component';
import { MembershipCardComponent } from './suscripciones/membership-card.component';
import { PaymentsListComponent } from './suscripciones/payments-list.component';
import { MembershipDetailsComponent } from './suscripciones/membership-details.component';
import { DocumentsListComponent } from './suscripciones/documents-list.component';
import { DocumentosComponent } from './documentos/documentos.component';
import { CuentaUsuarioRoutingModule } from "./cuenta-usuario-routing.module";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from '@angular/material/list';
import { MembresiaData } from "../@core/interfaces/membresia";
import { MembresiaService } from "../@core/backend/services/membresia.service";

@NgModule({
    imports: [
        CommonModule,
        NbCardModule,
        NbMenuModule,
        NbIconModule,
        NbSpinnerModule,
        NbAlertModule,
        NbButtonModule,
        NbTooltipModule,
        RouterModule,
        ThemeModule,
        SharedModule,
        CuentaUsuarioRoutingModule,
        MatDialogModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatListModule,
        CuentaUsuarioComponent,
        PerfilComponent,
        SuscripcionesComponent,
        MembershipCardComponent,
        PaymentsListComponent,
        MembershipDetailsComponent,
        DocumentsListComponent,
        DocumentosComponent
    ],
    providers: [
        { provide: MembresiaData, useClass: MembresiaService },
    ],
})
export class CuentaUsuarioModule { }