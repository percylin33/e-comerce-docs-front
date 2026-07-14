import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagesAdminComponent } from './pages-admin.component';

const routes: Routes = [
  {
    path: '',
    component: PagesAdminComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./panel-control/panel-control.component').then(m => m.PanelControlComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./users-management/users-management.component').then(m => m.UsersManagementComponent),
      },
      {
        path: 'ventas',
        loadComponent: () => import('./invoices/invoices.component').then(m => m.InvoicesComponent),
      },
      {
        path: 'ventas/registrar',
        loadComponent: () =>
          import('./ventas-manual/registrar-venta-manual.component').then(
            m => m.RegistrarVentaManualComponent,
          ),
      },
      {
        path: 'ventas/abandonados',
        loadComponent: () =>
          import('./ventas-manual/abandonados/carritos-abandonados.component').then(
            m => m.CarritosAbandonadosComponent,
          ),
      },
      {
        path: 'documentos',
        loadComponent: () => import('./dashboard-document/dashboard-document.component').then(m => m.DashboardDocumentComponent),
      },
      {
        path: 'formulario-documentos',
        loadComponent: () => import('./formulario-documentos/formulario-documentos.component').then(m => m.FormularioDocumentosComponent),
      },
      {
        path: 'papelera',
        loadComponent: () => import('./trash/trash.component').then(m => m.TrashComponent),
      },
      {
        path: 'librodereclamos',
        loadComponent: () => import('./LibroDeReclamos/librodereclamos.component').then(m => m.LibrodereclamosComponent),
      },
      {
        path: 'promotores',
        loadComponent: () => import('./promotores/promotores.component').then(m => m.PromotoresComponent),
      },
      {
        path:'suscriptores',
        loadComponent: () => import('./suscripciones/suscripciones.component').then(m => m.SuscripcionesComponent),
      },
      {
        path: 'suscriptores/registrar',
        loadComponent: () => import('./suscripciones/registrar-suscripcion/registrar-suscripcion.component').then(m => m.RegistrarSuscripcionComponent),
      },
      {
        path: 'suscriptores/editar/:id',
        loadComponent: () => import('./suscripciones/editar-suscripcion/editar-suscripcion.component').then(m => m.EditarSuscripcionComponent),
      },
      {
        path: 'visitas',
        loadComponent: () => import('./visits-chart/visits-chart.component').then(m => m.VisitsChartComponent),
      },
      {
        path: 'administrar',
        loadComponent: () => import('./administrar/administrar.component').then(m => m.AdministrarComponent),
      },
      {
        path: 'membresias',
        loadComponent: () => import('./membresias-admin/membresias-admin.component').then(m => m.MembresiasAdminComponent),
      },
      {
        path: 'catalogo-suscripciones',
        loadComponent: () => import('./subscription-docs-viewer/subscription-docs-viewer.component').then(m => m.SubscriptionDocsViewerComponent),
      },
      
      {
        path: 'grade-equivalences',
        children: [
          { path: '', loadComponent: () => import('./components/grade-equivalences-list/grade-equivalences-list.component').then(m => m.GradeEquivalencesListComponent) },
          { path: 'new', loadComponent: () => import('./components/grade-equivalences-form/grade-equivalences-form.component').then(m => m.GradeEquivalencesFormComponent) },
          { path: ':id/edit', loadComponent: () => import('./components/grade-equivalences-form/grade-equivalences-form.component').then(m => m.GradeEquivalencesFormComponent) }
        ]
      },
      {
        path: 'kit-approvals',
        children: [
          { path: '', loadComponent: () => import('./components/kit-approvals-list/kit-approvals-list.component').then(m => m.KitApprovalsListComponent) },
          { path: ':id', loadComponent: () => import('./components/kit-approval-detail/kit-approval-detail.component').then(m => m.KitApprovalDetailComponent) }
        ]
      },
      {
        path: 'campanas-promo',
        loadComponent: () =>
          import('./promotional-campaigns-admin/promotional-campaigns-admin.component').then(
            (m) => m.PromotionalCampaignsAdminComponent,
          ),
      },
      {
        path: 'generate-kit',
        loadComponent: () => import('./components/generate-kit/generate-kit.component').then(m => m.GenerateKitComponent),
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./auditoria/auditoria.component').then(m => m.AuditoriaComponent),
        children: [
          // El shell de Auditoria renderiza los 5 tabs via *ngIf sobre
          // activeTab (sincronizado con la URL). nb-route-tabset no existe
          // en nebular 14, asi que el cambio de tab se hace via router.navigate
          // y el template muestra/oculta cada componente segun activeTab.
          // Las child routes existen vacias para que el router haga match
          // y mantenga la URL intacta. Solo el deep-link /log/:id renderiza.
          { path: '', redirectTo: 'registro', pathMatch: 'full' },
          { path: 'registro',      children: [] },
          { path: 'creadores',     children: [] },
          { path: 'conciliacion',  children: [] },
          { path: 'seguridad',     children: [] },
          { path: 'analiticas',    children: [] },
          // Detalle de un log especifico (deep link).
          { path: 'log/:id', loadComponent: () => import('./auditoria/log-detail/audit-log-detail-view.component').then((m) => m.AuditLogDetailViewComponent) },
        ],
      }

    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesAdminRoutingModule {}
