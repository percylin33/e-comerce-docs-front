import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagesAdminComponent } from './pages-admin.component';
import { PanelControlComponent } from './panel-control/panel-control.component';
import { UsersManagementComponent } from './users-management/users-management.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { FormularioDocumentosComponent } from './formulario-documentos/formulario-documentos.component';
import { DashboardDocumentComponent } from './dashboard-document/dashboard-document.component';
import { TrashComponent } from './trash/trash.component';
import { LibrodereclamosComponent } from './LibroDeReclamos/librodereclamos.component';
import { PromotoresComponent } from './promotores/promotores.component';
import { SuscripcionesComponent } from './suscripciones/suscripciones.component';
//import { EditarSuscripcionComponent } from './suscripciones/editar-suscripcion/editar-suscripcion.component';
import { VisitsChartComponent } from './visits-chart/visits-chart.component';
import { AdministrarComponent } from './administrar/administrar.component';
import { MembresiasAdminComponent } from './membresias-admin/membresias-admin.component';
import { EditarSuscripcionComponent } from './suscripciones/editar-suscripcion/editar-suscripcion.component';
import { SubscriptionDocsViewerComponent } from './subscription-docs-viewer/subscription-docs-viewer.component';

// Kit Approval Components
import { GradeEquivalencesListComponent } from './components/grade-equivalences-list/grade-equivalences-list.component';
import { GradeEquivalencesFormComponent } from './components/grade-equivalences-form/grade-equivalences-form.component';
import { KitApprovalsListComponent } from './components/kit-approvals-list/kit-approvals-list.component';
import { KitApprovalDetailComponent } from './components/kit-approval-detail/kit-approval-detail.component';
import { GenerateKitComponent } from './components/generate-kit/generate-kit.component';

const routes: Routes = [
  {
    path: '',
    component: PagesAdminComponent,
    children: [
      {
        path: '',
        component: PanelControlComponent, // Mostramos este componente al entrar
      },
      {
        path: 'usuarios',
        component: UsersManagementComponent,
      },
      {
        path: 'ventas',
        component: InvoicesComponent,
      },
      {
        path: 'documentos',
        component: DashboardDocumentComponent,
      },
      {
        path: 'formulario-documentos',
        component: FormularioDocumentosComponent,
      },
      {
        path: 'papelera',
        component: TrashComponent,
      },
      {
        path: 'librodereclamos',
        component: LibrodereclamosComponent,
      },
      {
        path: 'promotores',
        component: PromotoresComponent
      },
      {
        path:'suscriptores',
        component: SuscripcionesComponent
      },
      {
        path: 'suscriptores/editar/:id',
        component: EditarSuscripcionComponent
      },
      {
        path: 'visitas',
        component: VisitsChartComponent
      },
      {
        path: 'administrar',
        component: AdministrarComponent
      },
      {
        path: 'membresias',
        component: MembresiasAdminComponent
      },
      {
        path: 'catalogo-suscripciones',
        component: SubscriptionDocsViewerComponent
      },
      
      // =====================================================
      // KIT APPROVAL SYSTEM
      // =====================================================
      {
        path: 'grade-equivalences',
        children: [
          { path: '', component: GradeEquivalencesListComponent },
          { path: 'new', component: GradeEquivalencesFormComponent },
          { path: ':id/edit', component: GradeEquivalencesFormComponent }
        ]
      },
      {
        path: 'kit-approvals',
        children: [
          { path: '', component: KitApprovalsListComponent },
          { path: ':id', component: KitApprovalDetailComponent }
        ]
      },
      {
        path: 'generate-kit',
        component: GenerateKitComponent
      }
      
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesAdminRoutingModule {}
