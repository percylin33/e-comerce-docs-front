import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LOCALE_ID, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthModule } from './@auth/auth.module'; // Importa el módulo de autenticación
import { PdfViewerModule } from 'ng2-pdf-viewer'
import { NbThemeModule, NbLayoutModule, NbIconModule, NbSidebarModule, NbMenuModule, NbDatepickerModule, NbDialogModule, NbWindowModule, NbToastrModule, NbChatModule, NbIconLibraries, NbGlobalPhysicalPosition } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { register } from 'swiper/element/bundle';
import { OAuthModule } from 'angular-oauth2-oidc';
// Importaciones para la localización
import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

// register Swiper custom elements
register();

// Registra la localización de 'es-PE'
registerLocaleData(localeEsPe, 'es-PE');

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
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
    NbThemeModule.forRoot({ name: 'default' }),
    NbLayoutModule,
    NbIconModule,
    NbEvaIconsModule,
    OAuthModule.forRoot(),
    HttpClientModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es-PE' }, // Establece la localización por defecto
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(private iconLibraries: NbIconLibraries) {
    this.iconLibraries.registerFontPack('font-awesome', { packClass: 'fa', iconClassPrefix: 'fa' });
    this.iconLibraries.registerFontPack('font-awesome-regular', { packClass: 'far', iconClassPrefix: 'fa' });

  }
}
