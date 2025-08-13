/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from './@core/utils/analytics.service';
import { SeoService } from './@core/utils/seo.service';
import { VisitService } from './@core/backend/services/visit.service';
import { AntiLoopService } from './@core/services/anti-loop.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  private lastVisitedPath = '';

  constructor(
    private analytics: AnalyticsService, 
    private seoService: SeoService, 
    private visitService: VisitService,
    private antiLoopService: AntiLoopService,
    private router: Router
  ) {
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
    
    // Enviar visita inicial con debounce
    setTimeout(() => {
      this.sendVisitSafely(window.location.pathname);
    }, 1000);
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
    // Verificar si las navegaciones están permitidas
    if (!this.antiLoopService.isNavigationAllowed()) {
      console.warn('🚨 Visit tracking skipped - Anti-loop protection active');
      return;
    }

    // Verificar si el backend está disponible antes de enviar
    const lastError = localStorage.getItem('visit_backend_error');
    if (lastError && (Date.now() - parseInt(lastError)) < 5 * 60 * 1000) {
      console.warn('🚨 Visit tracking skipped - Backend errors detected recently');
      return;
    }

    try {
      this.visitService.sendVisit(path);
    } catch (error) {
      console.error('Error sending visit:', error);
      localStorage.setItem('visit_backend_error', Date.now().toString());
      this.antiLoopService.reportSuspiciousActivity('VisitService', { path, error });
    }
  }
}
