import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SiteRoutingModule } from './site-routing.module';
import { SiteComponent } from './site.component';
import { ThemeModule } from '../@theme/theme.module';
import { SharedModule } from '../shared/shared.module';
import { NbAccordionModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbIconModule, NbListModule, NbMenuModule, NbSpinnerModule } from '@nebular/theme';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ContactData } from '../@core/interfaces/contact';
import { ContactService } from '../@core/backend/services/contact.service';
import { ReclamationData } from '../@core/interfaces/reclamation';
import { ReclamationService } from '../@core/backend/services/reclamation.service';
import { MatIconModule } from '@angular/material/icon';
import { ImageDialogComponent } from './detail/image-dialog/image-dialog.component';

import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MembresiaData } from '../@core/interfaces/membresia';
import { MembresiaService } from '../@core/backend/services/membresia.service';
import { MatListModule } from '@angular/material/list';
import { InViewportDirective } from './nosotros/BrowserAnimationsModule';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { FormatoTerminosPipe } from '../@theme/pipes/formato-terminos.pipe';
import { PaypalButtonComponent } from '../shared/paypal-button.component';
import { RouterModule } from '@angular/router';

const NB_MODULES = [
  NbIconModule,
  NbAccordionModule,
  NbCardModule,
  NbMenuModule,
  NbListModule,
  NbCheckboxModule,
  NbCardModule,
  NbSpinnerModule,
  NbButtonModule,
];

const MAT_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatIconModule,
  MatProgressSpinnerModule,
  MatCardModule,
  MatListModule,
  MatDividerModule,
  MatCheckboxModule,
];

const CDK_MODULES = [
  OverlayModule,
  PortalModule,
];

@NgModule({
    imports: [
        CommonModule,
        SiteRoutingModule,
        ThemeModule,
        SharedModule,
        FormsModule,
        NbSpinnerModule,
        ReactiveFormsModule,
        RouterModule,
        ...NB_MODULES,
        ...MAT_MODULES,
        ...CDK_MODULES,
        SiteComponent,
        ImageDialogComponent,
        InViewportDirective,
        FormatoTerminosPipe,
        PaypalButtonComponent
    ],
    providers: [
        { provide: ContactData, useClass: ContactService },
        { provide: ReclamationData, useClass: ReclamationService },
        { provide: MembresiaData, useClass: MembresiaService },
    ]
})
export class SiteModule { }
