/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { enableProdMode, LOCALE_ID, importProvidersFrom, isDevMode } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

import { environment } from './environments/environment';

// Registrar datos de localización es-PE para CurrencyPipe / DatePipe (NG0701)
registerLocaleData(localeEsPe, 'es-PE');
import { setupNativeHttpErrorInterception } from './app/@core/interceptors/native-http-interceptor';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ForbiddenInterceptor } from './app/@core/interceptors/forbidden.interceptor';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app/app-routing.module';
import { NbSidebarModule, NbMenuModule, NbDialogModule, NbWindowModule, NbToastrModule, NbGlobalPhysicalPosition, NbLayoutModule, NbIconModule, NbCardModule, NbSpinnerModule, NbButtonModule } from '@nebular/theme';
import { CoreModule } from './app/@core/core.module';
import { ThemeModule } from './app/@theme/theme.module';
import { AuthModule } from './app/@auth/auth.module';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { OAuthModule } from 'angular-oauth2-oidc';
import { AppComponent } from './app/app.component';
import { provideServiceWorker } from '@angular/service-worker';
import { register } from 'swiper/element/bundle';
// Configurar interceptor nativo ANTES de arrancar Angular
setupNativeHttpErrorInterception();

register();

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, NbSidebarModule.forRoot(), NbMenuModule.forRoot(), NbDialogModule.forRoot(), NbWindowModule.forRoot(), NbToastrModule.forRoot({
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
            duration: 5000,
            destroyByClick: true,
            preventDuplicates: true,
            hasIcon: true,
            limit: 3
        }), CoreModule.forRoot(), ThemeModule.forRoot(), AuthModule,
        NbLayoutModule, NbIconModule, NbCardModule, NbSpinnerModule, NbButtonModule, NbEvaIconsModule, OAuthModule.forRoot()),
        { provide: LOCALE_ID, useValue: 'es-PE' }, // Establece la localización por defecto
        { provide: HTTP_INTERCEPTORS, useClass: ForbiddenInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
    ]
})
  .catch(err => console.error(err));
