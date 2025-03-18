import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './component/card/card.component';
import { RouterModule } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule, NbPopoverModule, NbSelectModule, NbStepperModule } from '@nebular/theme';
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
import { NgxEchartsModule } from 'ngx-echarts';
import { TalleresCardComponent } from './component/talleres-card/talleres-card.component';

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
  ],
  imports: [
    CommonModule,
    RouterModule,
    NbCardModule,
    PdfViewerModule,
    FormsModule,
    ...NB_MODULES,
    ...MAT_MODULES,
    NgxEchartsModule,
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
    ...MAT_MODULES
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule { }
