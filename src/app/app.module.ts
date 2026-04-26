import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LOCALE_ID, NgModule } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthModule } from './@auth/auth.module'; // Importa el módulo de autenticación
// import { UnifiedAntiLoopService } from './@core/services/unified-anti-loop.service'; // TEMPORALMENTE DESACTIVADO
import { PdfViewerModule } from 'ng2-pdf-viewer'
import { NbThemeModule, NbLayoutModule, NbIconModule, NbSidebarModule, NbMenuModule, NbDatepickerModule, NbDialogModule, NbWindowModule, NbToastrModule, NbChatModule, NbIconLibraries, NbGlobalPhysicalPosition, NbCardModule, NbSpinnerModule, NbButtonModule, NbAccordionModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { register } from 'swiper/element/bundle';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ForbiddenInterceptor } from './@core/interceptors/forbidden.interceptor';
import { OAuthModule } from 'angular-oauth2-oidc';
// Importaciones para la localización
import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

// register Swiper custom elements
register();

// Registra la localización de 'es-PE'
registerLocaleData(localeEsPe, 'es-PE');

@NgModule(/* TODO(standalone-migration): clean up removed NgModule class manually. 
{ declarations: [AppComponent],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        NbSidebarModule.forRoot(),
        NbMenuModule.forRoot(),
        NbDatepickerModule.forRoot(),
        NbDialogModule.forRoot(),
        NbWindowModule.forRoot(),
        NbToastrModule.forRoot({
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
            duration: 5000,
            destroyByClick: true,
            preventDuplicates: true,
            hasIcon: true,
            limit: 3
        }),
        NbChatModule.forRoot({
            messageGoogleMapKey: 'AIzaSyA_wNuCzia92MAmdLRzmqitRGvCF7wCZPY',
        }),
        CoreModule.forRoot(),
        ThemeModule.forRoot(),
        AuthModule, // Asegúrate de importar el módulo de autenticación aquí
        PdfViewerModule,
        NgApexchartsModule,
        NbThemeModule.forRoot({ name: 'default' }),
        NbLayoutModule,
        NbIconModule,
        NbCardModule,
        NbSpinnerModule,
        NbButtonModule,
        NbAccordionModule,
        NbEvaIconsModule,
        OAuthModule.forRoot()], providers: [
        { provide: LOCALE_ID, useValue: 'es-PE' }, // Establece la localización por defecto
        { provide: HTTP_INTERCEPTORS, useClass: ForbiddenInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
    ] } */)
export class AppModule {
  constructor(private iconLibraries: NbIconLibraries) {
    this.iconLibraries.registerFontPack('font-awesome', { packClass: 'fa', iconClassPrefix: 'fa' });
    this.iconLibraries.registerFontPack('font-awesome-regular', { packClass: 'far', iconClassPrefix: 'fa' });

  }
}
