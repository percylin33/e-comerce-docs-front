/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { enableProdMode, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { setupNativeHttpErrorInterception } from './app/@core/interceptors/native-http-interceptor';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ForbiddenInterceptor } from './app/@core/interceptors/forbidden.interceptor';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app/app-routing.module';
import { NbSidebarModule, NbMenuModule, NbDatepickerModule, NbDialogModule, NbWindowModule, NbToastrModule, NbGlobalPhysicalPosition, NbChatModule, NbThemeModule, NbLayoutModule, NbIconModule, NbCardModule, NbSpinnerModule, NbButtonModule, NbAccordionModule } from '@nebular/theme';
import { CoreModule } from './app/@core/core.module';
import { ThemeModule } from './app/@theme/theme.module';
import { AuthModule } from './app/@auth/auth.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { OAuthModule } from 'angular-oauth2-oidc';
import { AppComponent } from './app/app.component';
// Configurar interceptor nativo ANTES de arrancar Angular
setupNativeHttpErrorInterception();

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, NbSidebarModule.forRoot(), NbMenuModule.forRoot(), NbDatepickerModule.forRoot(), NbDialogModule.forRoot(), NbWindowModule.forRoot(), NbToastrModule.forRoot({
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
            duration: 5000,
            destroyByClick: true,
            preventDuplicates: true,
            hasIcon: true,
            limit: 3
        }), NbChatModule.forRoot({
            messageGoogleMapKey: 'AIzaSyA_wNuCzia92MAmdLRzmqitRGvCF7wCZPY',
        }), CoreModule.forRoot(), ThemeModule.forRoot(), AuthModule, // Asegúrate de importar el módulo de autenticación aquí
        PdfViewerModule, NgApexchartsModule, NbThemeModule.forRoot({ name: 'default' }), NbLayoutModule, NbIconModule, NbCardModule, NbSpinnerModule, NbButtonModule, NbAccordionModule, NbEvaIconsModule, OAuthModule.forRoot()),
        { provide: LOCALE_ID, useValue: 'es-PE' }, // Establece la localización por defecto
        { provide: HTTP_INTERCEPTORS, useClass: ForbiddenInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations()
    ]
})
  .catch(err => console.error(err));
