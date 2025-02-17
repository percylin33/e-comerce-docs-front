import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesAdminRoutingModule } from './pages-admin-routing.module';
import { PagesAdminComponent } from './pages-admin.component';
import { NbCardModule, NbIconModule, NbMenuModule, NbPopoverModule, NbSidebarModule } from '@nebular/theme';
import { ThemeModule } from '../@theme/theme.module';
import { UsersManagementComponent } from './users-management/users-management.component';
import { SharedModule } from '../shared/shared.module';
import { InvoicesComponent } from './invoices/invoices.component';
import { FormularioDocumentosComponent } from './formulario-documentos/formulario-documentos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
//import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { DashboardDocumentComponent } from './dashboard-document/dashboard-document.component';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
//import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { NbSpinnerModule } from '@nebular/theme';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { FormDeleteDocumentsComponent } from './dashboard-document/form-delete-documents/form-delete-documents.component';
import { FormUsersComponent } from './users-management/form-users/form-users.component';
import { MatSelectModule } from '@angular/material/select';
import { TrashComponent } from './trash/trash.component';
import { FormDeleteFisicoComponent } from './dashboard-document/form-delete-fisico/form-delete-fisico.component';
import { PanelControlComponent } from './panel-control/panel-control.component';
import { LibrodereclamosComponent } from './LibroDeReclamos/librodereclamos.component';


@NgModule({
  declarations: [
    PagesAdminComponent,
    UsersManagementComponent,
    InvoicesComponent,
    FormularioDocumentosComponent,
    DashboardDocumentComponent,
    FormDeleteDocumentsComponent,
    FormUsersComponent,
    TrashComponent,
    FormDeleteFisicoComponent,
    PanelControlComponent,
    LibrodereclamosComponent,

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
    ThemeModule,
    SharedModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatSelectModule,
    //MatProgressSpinnerModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
  ]
})
export class PagesAdminModule { }
