import { Component, OnInit, inject } from '@angular/core';
import { AnalyticsService } from './@core/utils/analytics.service';
import { SeoService } from './@core/utils/seo.service';
import { VisitService } from './@core/backend/services/visit.service';
// import { UnifiedAntiLoopService } from './@core/services/unified-anti-loop.service'; // TEMPORALMENTE DESACTIVADO
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, debounceTime } from 'rxjs/operators';
import { SharedService } from './@auth/components/shared.service';
import { jwtDecode } from 'jwt-decode';
import { NbIconLibraries } from '@nebular/theme';

@Component({
    selector: 'ngx-app',
    template: '<router-outlet></router-outlet>',
    standalone: true,
    imports: [RouterOutlet],
})
export class AppComponent implements OnInit {
  private analytics = inject(AnalyticsService);
  private seoService = inject(SeoService);
  private visitService = inject(VisitService);
  private router = inject(Router);
  private sharedService = inject(SharedService);
  private iconLibraries = inject(NbIconLibraries);

  private lastVisitedPath = '';

  constructor() {
    // Registrar packs de Font Awesome para nb-icon (antes era en AppModule)
    this.iconLibraries.registerFontPack('font-awesome', { packClass: 'fa', iconClassPrefix: 'fa' });
    this.iconLibraries.registerFontPack('font-awesome-regular', { packClass: 'far', iconClassPrefix: 'fa' });

    // Monitorear navegaciones para detectar problemas
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      debounceTime(500) // Debounce para evitar spam
    ).subscribe((event: NavigationEnd) => {
      this.handleRouteChange(event.url);
    });
  }

  ngOnInit(): void {
    this.analytics.trackPageViews();
    this.seoService.trackCanonicalChanges();
    
    // Inicializar estado de autenticación desde localStorage
    this.initializeAuthState();
    
    // Enviar visita inicial con debounce
    setTimeout(() => {
      this.sendVisitSafely(window.location.pathname);
    }, 1000);
  }

  private initializeAuthState(): void {
    const currentUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('auth_app_token');
    
    if (currentUser && token) {
      try {
        // Validar si el token ha expirado
        if (this.isTokenExpired(token)) {
          this.clearAuthData();
          return;
        }

        const userData = JSON.parse(currentUser);
        this.sharedService.setAuthenticated(true);
        this.sharedService.setUser(userData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        // Limpiar datos corruptos
        this.clearAuthData();
      }
    } else {
      this.sharedService.setAuthenticated(false);
      this.sharedService.setUser(null);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decodedToken: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return true; // Si no se puede decodificar, considerarlo expirado
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_app_token');
    localStorage.removeItem('auth_app_refresh_token');
    this.sharedService.setAuthenticated(false);
    this.sharedService.setUser(null);
  }

  private handleRouteChange(url: string): void {
    // Solo enviar visita si es una ruta diferente y ha pasado suficiente tiempo
    if (url !== this.lastVisitedPath) {
      this.lastVisitedPath = url;
      
      // Esperar un poco más antes de enviar la visita para evitar spam
      setTimeout(() => {
        // Verificar que la URL sigue siendo la misma después del delay
        if (this.router.url === url) {
          this.sendVisitSafely(url);
        }
      }, 2000); // Aumentado a 2 segundos
    }
  }

  private sendVisitSafely(path: string): void {
    // ANTI-LOOP TEMPORALMENTE DESACTIVADO PARA TESTING
    // if (!this.antiLoopService.isNavigationAllowed()) {
    //   console.warn('🚨 Visit tracking skipped - Anti-loop protection active');
    //   return;
    // }

    try {
      this.visitService.sendVisit(path);
    } catch (error) {
      console.error('Error sending visit:', error);
      // this.antiLoopService.reportSuspiciousActivity('AppComponent', { 
      //   path, 
      //   error: error.message 
      // });
    }
  }
}
