import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './component/card/card.component';
import { RouterModule } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule, NbPopoverModule, NbSpinnerModule } from '@nebular/theme';
import { CarrouselComponent } from './component/carrousel/carrousel.component';
import { DocumentViewerComponent } from './component/document-viewer/document-viewer.component';
import { CarrouselVerticalComponent } from './component/carrousel-vertical/carrousel-vertical.component';
import { DocumentCardComponent } from './component/document-card/document-card.component';
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
import { SafeUrlPipe } from './pipes/safe-url.pipe';
// DynamicChartComponent extraído del SharedModule: usa NgApexchartsModule y
// solo se usa en pages-admin (lazy). Mantenerlo aquí arrastraba apexcharts
// (~500 KB) al chunk de site vía imports transitivos.
import { TalleresCardComponent } from './component/talleres-card/talleres-card.component';
import { AuthModalComponent } from './component/auth-modal/auth-modal.component';
import { ResellerAlertModalComponent } from './component/reseller-alert-modal/reseller-alert-modal.component';
import { PaymentDocumentsModalComponent } from './component/payment-documents-modal/payment-documents-modal.component';
// NgApexchartsModule y los componentes *-chart fueron extraídos del SharedModule:
// se usan solo en pages-admin/admin-promotor (lazy modules) que los importan
// directamente como standalone components. Mantenerlos aquí inflaba el chunk
// de site (~500 KB de apexcharts) sin necesidad.

// Skeleton Loader (usado por componentes de site)
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';

// Notification Bell
import { NotificationBellComponent } from './notification-bell/notification-bell.component';

// Design System — UI base components
import { AppButtonComponent } from './ui/button/button.component';
import { AppBadgeComponent } from './ui/badge/badge.component';
import { AppPriceComponent } from './ui/price/price.component';
import { AppIconButtonComponent } from './ui/icon-button/icon-button.component';


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
  NbButtonModule,
  NbSpinnerModule,
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        NbCardModule,
        FormsModule,
        ...NB_MODULES,
        ...MAT_MODULES,
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
        SafeUrlPipe,
        TalleresCardComponent,
        AuthModalComponent,
        ResellerAlertModalComponent,
        PaymentDocumentsModalComponent,
        SkeletonLoaderComponent,
        NotificationBellComponent,
        // Design System — UI base
        AppButtonComponent,
        AppBadgeComponent,
        AppPriceComponent,
        AppIconButtonComponent,
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
        SafeUrlPipe,
        TalleresCardComponent,
        // Design System — UI base
        AppButtonComponent,
        AppBadgeComponent,
        AppPriceComponent,
        AppIconButtonComponent,
        SkeletonLoaderComponent,
        NotificationBellComponent,
        ...MAT_MODULES
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule { }
