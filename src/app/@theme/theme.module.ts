import { ModuleWithProviders, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NbActionsModule,
  NbLayoutModule,
  NbMenuModule,
  NbSearchModule,
  NbSidebarModule,
  NbUserModule,
  NbContextMenuModule,
  NbButtonModule,
  NbSelectModule,
  NbIconModule,
  NbThemeModule,
  NbPopoverModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbSecurityModule } from '@nebular/security';
import { MatMenuModule } from '@angular/material/menu';

import {
  FooterComponent,
  HeaderComponent,
  SearchInputComponent,
  SimpleFooterComponent,
  TinyMCEComponent,
} from './components';
import { PromotorSidebarComponent } from './components/promotor-sidebar/promotor-sidebar.component';
import { PromotorHeaderActionsComponent } from './components/promotor-header-actions/promotor-header-actions.component';
import { AdminHeaderActionsComponent } from './components/admin-header-actions/admin-header-actions.component';
import {
  CapitalizePipe,
  PluralPipe,
  RoundPipe,
  TimingPipe,
  NumberWithCommasPipe,
} from './pipes';
import {
  OneColumnLayoutComponent,
  ThreeColumnsLayoutComponent,
  TwoColumnsLayoutComponent,
} from './layouts';
import { DEFAULT_THEME } from './styles/theme.default';
import { COSMIC_THEME } from './styles/theme.cosmic';
import { CORPORATE_THEME } from './styles/theme.corporate';
import { DARK_THEME } from './styles/theme.dark';
import { MainSectionComponent } from './components/main-section/main-section.component';
import { CategoriesSectionComponent } from './components/categories-section/categories-section.component';
import { register } from 'swiper/element/bundle';
import { RouterModule } from '@angular/router';
import { ServiciosData } from '../@core/interfaces/servicios';
import { ServiciosService } from '../@core/backend/services/servicios.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../shared/shared.module';
import { SubscriptionAlertComponent } from './components/subscription-alert/subscription-alert.component';

register();

const MAT_MODULES = [
  MatMenuModule,
  MatButtonModule,
  MatIconModule
];

const NB_MODULES = [
  NbLayoutModule,
  NbMenuModule,
  NbUserModule,
  NbActionsModule,
  NbSearchModule,
  NbSidebarModule,
  NbContextMenuModule,
  NbSecurityModule,
  NbButtonModule,
  NbSelectModule,
  NbIconModule,
  NbEvaIconsModule,
  NbPopoverModule,
];
const COMPONENTS = [
  HeaderComponent,
  FooterComponent,
  SimpleFooterComponent,
  SearchInputComponent,
  TinyMCEComponent,
  OneColumnLayoutComponent,
  ThreeColumnsLayoutComponent,
  TwoColumnsLayoutComponent,
  PromotorSidebarComponent,
  PromotorHeaderActionsComponent,
  AdminHeaderActionsComponent,
];
const PIPES = [
  CapitalizePipe,
  PluralPipe,
  RoundPipe,
  TimingPipe,
  NumberWithCommasPipe,
];

@NgModule({
    imports: [CommonModule, ...NB_MODULES, ...MAT_MODULES, RouterModule, SharedModule, ...COMPONENTS, ...PIPES, MainSectionComponent, CategoriesSectionComponent, SubscriptionAlertComponent],
    exports: [CommonModule, ...PIPES, ...COMPONENTS, SharedModule, SubscriptionAlertComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ThemeModule {
  static forRoot(): ModuleWithProviders<ThemeModule> {
    return {
      ngModule: ThemeModule,
      providers: [
        ...NbThemeModule.forRoot(
          {
            name: 'default',
          },
          [DEFAULT_THEME, COSMIC_THEME, CORPORATE_THEME, DARK_THEME],
        ).providers,
        { provide: ServiciosData, useClass: ServiciosService },
      ],
    };
  }
}
