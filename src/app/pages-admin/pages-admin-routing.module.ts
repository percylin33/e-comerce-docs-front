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
      
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesAdminRoutingModule {}
