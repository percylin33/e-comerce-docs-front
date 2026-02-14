import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesAdminRoutingModule } from './pages-admin-routing.module';
import { PagesAdminComponent } from './pages-admin.component';
import { NbAccordionModule, NbCardModule, NbIconModule, NbMenuModule, NbPopoverModule, NbSidebarModule, NbSelectModule, NbButtonModule, NbAlertModule } from '@nebular/theme';
import { ThemeModule } from '../@theme/theme.module';
import { UsersManagementComponent } from './users-management/users-management.component';
import { SharedModule } from '../shared/shared.module';
import { InvoicesComponent } from './invoices/invoices.component';
import { FormularioDocumentosComponent } from './formulario-documentos/formulario-documentos.component';
import { HierarchyEditorModalComponent } from './formulario-documentos/hierarchy-editor-modal/hierarchy-editor-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
//import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { DashboardDocumentComponent } from './dashboard-document/dashboard-document.component';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { NbSpinnerModule } from '@nebular/theme';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { FormDeleteDocumentsComponent } from './dashboard-document/form-delete-documents/form-delete-documents.component';
import { FormUsersComponent } from './users-management/form-users/form-users.component';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrashComponent } from './trash/trash.component';
import { FormDeleteFisicoComponent } from './dashboard-document/form-delete-fisico/form-delete-fisico.component';
import { PanelControlComponent } from './panel-control/panel-control.component';
import { LibrodereclamosComponent } from './LibroDeReclamos/librodereclamos.component';
import { PromotoresComponent } from './promotores/promotores.component';
import { PromotorVentasModalComponent } from './promotores/promotor-ventas-modal/promotor-ventas-modal.component';
import { SuscripcionesComponent } from './suscripciones/suscripciones.component';
import { ConfirmDialogComponent } from './suscripciones/dialogs/confirm-dialog.component';
import { PagosDialogComponent } from './suscripciones/dialogs/pagos-dialog.component';
import { ActivarDialogComponent } from './suscripciones/dialogs/activar-dialog.component';
import { EditSubscriptionDialogComponent } from './suscripciones/dialogs/edit-subscription-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SuscripcionesService } from '../@core/backend/services/suscripciones.service';
import { SuscripcionesData } from '../@core/interfaces/suscripciones';
import { SuscripcionesApi } from '../@core/backend/api/suscripciones.api';
import { VisitsChartComponent } from './visits-chart/visits-chart.component';
import { DocumentosDialogComponent } from './suscripciones/dialogs/documentos-dialog.component';
import { MembresiasAdminComponent } from './membresias-admin/membresias-admin.component';
import { FilterPipe } from './membresias-admin/filter.pipe';
import { MembresiaFormDialogComponent } from './membresias-admin/membresia-form-dialog/membresia-form-dialog.component';
import { MateriasManagerComponent } from './membresias-admin/materias-manager/materias-manager.component';
import { OpcionesManagerComponent } from './membresias-admin/opciones-manager/opciones-manager.component';
import { MateriaFormDialogComponent } from './membresias-admin/materia-form-dialog/materia-form-dialog.component';
import { OpcionFormDialogComponent } from './membresias-admin/opcion-form-dialog/opcion-form-dialog.component';
import { MateriasManagerDialogComponent } from './membresias-admin/materias-manager-dialog/materias-manager-dialog.component';
import { MatExpansionModule } from '@angular/material/expansion';

// Importar ApexCharts
import { NgApexchartsModule } from 'ng-apexcharts';

// Importar nuevos componentes del dashboard
import { DashboardFiltersComponent } from '../shared/components/dashboard-filters/dashboard-filters.component';
import { SalesChartComponent } from '../shared/components/sales-chart/sales-chart.component';
import { AdministrarComponent } from './administrar/administrar.component';
import { EquipoCrudComponent } from './administrar/equipos/equipo-crud.component';
import { AliadoCrudComponent } from './administrar/aliados/aliado-crud.component';
import { HistoriaCrudComponent } from './administrar/historia/historia-crud.component';
import { ComentarioCrudComponent } from './administrar/comentarios/comentario-crud.component';
import { UnitScheduleCrudComponent } from './administrar/unit-schedule/unit-schedule-crud.component';
import { AdminTerminosEmbajadorComponent } from './administrar/terminos/admin-terminos-embajador.component';
import { PaymentsTableComponent } from './invoices/payments-table/payments-table.component';



@NgModule({
  declarations: [
    PagesAdminComponent,
    UsersManagementComponent,
    InvoicesComponent,
    FormularioDocumentosComponent,
    HierarchyEditorModalComponent,
    DashboardDocumentComponent,
    FormDeleteDocumentsComponent,
    FormUsersComponent,
    TrashComponent,
    FormDeleteFisicoComponent,
    PanelControlComponent,
    LibrodereclamosComponent,
    PromotoresComponent,
    PromotorVentasModalComponent,
    SuscripcionesComponent,
    ConfirmDialogComponent,
    PagosDialogComponent,
    ActivarDialogComponent,
    EditSubscriptionDialogComponent,
    DocumentosDialogComponent,
    VisitsChartComponent,
    // Nuevos componentes del dashboard
    DashboardFiltersComponent,
    SalesChartComponent,
    AdministrarComponent,
    EquipoCrudComponent,
    AliadoCrudComponent,
    HistoriaCrudComponent,
    ComentarioCrudComponent,
    UnitScheduleCrudComponent,
    AdminTerminosEmbajadorComponent,
    MembresiasAdminComponent,
    MembresiaFormDialogComponent,
    MateriasManagerComponent,
    MateriasManagerDialogComponent,
    OpcionesManagerComponent,
    MateriaFormDialogComponent,
    OpcionFormDialogComponent,
    FilterPipe,
    PaymentsTableComponent,
  ],
  imports: [
    CommonModule,
    PagesAdminRoutingModule,
    NbMenuModule,
    NbSpinnerModule,
    NbIconModule,
    NbSidebarModule,
    NbPopoverModule,
    NbCardModule,
    NbSelectModule,
    NbButtonModule,
    NbAlertModule,
    ThemeModule,
    SharedModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatSnackBarModule,
    MatDialogModule,
    MatToolbarModule,
    MatTooltipModule,
    FormsModule,
    NbAccordionModule,
    MatTabsModule,
    MatCardModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatIconModule,
    // ApexCharts
    NgApexchartsModule
  ],
  providers: [
    SuscripcionesApi,
    {
      provide: SuscripcionesData,
      useClass: SuscripcionesService
    }
  ]
})
export class PagesAdminModule { }
