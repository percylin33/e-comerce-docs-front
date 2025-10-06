import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './component/card/card.component';
import { RouterModule } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule, NbPopoverModule, NbSelectModule, NbStepperModule, NbSpinnerModule } from '@nebular/theme';
import { CarrouselComponent } from './component/carrousel/carrousel.component';
import { register } from 'swiper/element/bundle';
import { DocumentViewerComponent } from './component/document-viewer/document-viewer.component';
import { CarrouselVerticalComponent } from './component/carrousel-vertical/carrousel-vertical.component';
import { DocumentCardComponent } from './component/document-card/document-card.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { CustomTableComponent } from './component/custom-table/custom-table.component'
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { SearchComponent } from './component/search/search.component';
import { FormsModule } from '@angular/forms';
import { ShoppingCartComponent } from './component/shopping-cart/shopping-cart.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DocumentFilterComponent } from './component/document-filter/document-filter.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { DocumentDescriptionModalComponent } from './component/document-description-modal/document-description-modal.component';
import { TruncateTextPipe } from './pipes/truncate-text.pipe';
import { DynamicChartComponent } from './component/dynamic-chart/dynamic-chart.component';
import { TalleresCardComponent } from './component/talleres-card/talleres-card.component';
import { AuthModalComponent } from './component/auth-modal/auth-modal.component';
import { ResellerAlertModalComponent } from './component/reseller-alert-modal/reseller-alert-modal.component';
import { PaymentDocumentsModalComponent } from './component/payment-documents-modal/payment-documents-modal.component';
import { NgApexchartsModule } from 'ng-apexcharts';

// Componentes de gráficos del dashboard
import { CategoryChartComponent } from './components/category-chart/category-chart.component';
import { MateriaChartComponent } from './components/materia-chart/materia-chart.component';
import { NivelChartComponent } from './components/nivel-chart/nivel-chart.component';
import { GradoChartComponent } from './components/grado-chart/grado-chart.component';

// Nuevos componentes de gráficos de suscripción
import { TipoSuscripcionChartComponent } from './components/tipo-suscripcion-chart/tipo-suscripcion-chart.component';
import { MateriaSuscripcionChartComponent } from './components/materia-suscripcion-chart/materia-suscripcion-chart.component';
import { OpcionSuscripcionChartComponent } from './components/opcion-suscripcion-chart/opcion-suscripcion-chart.component';

register();

const MAT_MODULES = [
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatCheckboxModule,
  MatIconModule,
  MatDialogModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatOptionModule,
  MatMenuModule,
]

const NB_MODULES = [
  NbIconModule,
  NbPopoverModule,
  NbCardModule,
  NbStepperModule,
  NbButtonModule,
  NbSelectModule,
  NbSpinnerModule,
];

@NgModule({
  declarations: [
    CardComponent,
    CarrouselComponent,
    DocumentViewerComponent,
    CarrouselVerticalComponent,
    DocumentCardComponent,
    CustomTableComponent,
    SearchComponent,
    ShoppingCartComponent,
    DocumentFilterComponent,
    DocumentDescriptionModalComponent,
    TruncateTextPipe,
    DynamicChartComponent,
    TalleresCardComponent,
    AuthModalComponent,
    ResellerAlertModalComponent,
    PaymentDocumentsModalComponent,
    CategoryChartComponent,
    MateriaChartComponent,
    NivelChartComponent,
    GradoChartComponent,
    TipoSuscripcionChartComponent,
    MateriaSuscripcionChartComponent,
    OpcionSuscripcionChartComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    NbCardModule,
    PdfViewerModule,
    FormsModule,
    NgApexchartsModule,
    ...NB_MODULES,
    ...MAT_MODULES,
  ],
  exports: [
    CardComponent,
    CarrouselComponent,
    DocumentViewerComponent,
    CarrouselVerticalComponent,
    DocumentCardComponent,
    CustomTableComponent,
    SearchComponent,
    ShoppingCartComponent,
    DocumentFilterComponent,
    TruncateTextPipe,
    DynamicChartComponent,
    TalleresCardComponent,
    CategoryChartComponent,
    MateriaChartComponent,
    NivelChartComponent,
    GradoChartComponent,
  TipoSuscripcionChartComponent,
  MateriaSuscripcionChartComponent,
  OpcionSuscripcionChartComponent,
  ...MAT_MODULES
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule { }
