import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SiteRoutingModule } from './site-routing.module';
import { SiteComponent } from './site.component';
import { ThemeModule } from '../@theme/theme.module';
import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home/home.component';
import { NbAccordionModule, NbCardModule, NbCheckboxModule, NbIconModule, NbListModule, NbMenuModule, NbSpinnerModule } from '@nebular/theme';

import { DetailComponent } from './detail/detail.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { CategoriasComponent } from './categorias/categorias.component';
import { LegalesComponent } from './legales/legales.component';
import { ContactComponent } from './contact/contact.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; // Añade esta importación
import { NosotrosComponent } from './nosotros/nosotros.component';
import { AcercadeComponent } from './acercade/acercade.component';
import { AyudaComponent } from './ayuda/ayuda.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


// Importa el AyudaModule aquí si es necesario
// Asegúrate de importar AyudaModule si tiene que ser usado en este módulo

import { ContactData } from '../@core/interfaces/contact';
import { ContactService } from '../@core/backend/services/contact.service';
import { ReclamationData } from '../@core/interfaces/reclamation';
import { ReclamationService } from '../@core/backend/services/reclamation.service';
import { CheckoutComponent } from './checkout/checkout.component';
import { MatIconModule } from '@angular/material/icon';
import { ComplaintBookComponent } from './complaint-book/complaint-book.component';
import { ImageDialogComponent } from './detail/image-dialog/image-dialog.component';



const NB_MODULES = [
  NbIconModule,
  NbAccordionModule,
  NbCardModule,
  NbMenuModule,
  NbListModule,
  NbCheckboxModule,
];

const MAT_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatIconModule,
  MatRadioModule,
  MatDatepickerModule,
  MatNativeDateModule,  // Añade este módulo
  MatProgressSpinnerModule,
];

@NgModule({
  declarations: [
    SiteComponent,
    HomeComponent,
    DetailComponent,
    CategoriasComponent,
    LegalesComponent,
    ContactComponent,
    NosotrosComponent,
    AyudaComponent,
    AcercadeComponent,
    CheckoutComponent,
    ComplaintBookComponent,
    ImageDialogComponent,

  ],
  imports: [
    CommonModule,
    SiteRoutingModule,
    ThemeModule,
    SharedModule,
    PdfViewerModule,
    FormsModule,
    NbSpinnerModule,
    ReactiveFormsModule,
    ...NB_MODULES,
    ...MAT_MODULES
  ],
  providers: [
    { provide: ContactData, useClass: ContactService },
    { provide: ReclamationData, useClass: ReclamationService }
  ]
})
export class SiteModule { }
