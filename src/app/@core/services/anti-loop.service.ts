import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AntiLoopService {
  private navigationCount = 0;
  private lastUrl = '';
  private lastNavigationTime = 0;
  private readonly MAX_RAPID_NAVIGATIONS = 3;
  private readonly TIME_WINDOW = 3000; // 3 segundos
  private readonly COOLDOWN_DURATION = 5000; // 5 segundos de cooldown
  private isInCooldown = false;

  constructor(private router: Router) {
    this.initializeNavigationTracking();
  }

  private initializeNavigationTracking(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.trackNavigation(event.url);
    });
  }

  private trackNavigation(url: string): void {
    const currentTime = Date.now();
    
    // Si estamos en cooldown, ignorar tracking adicional
    if (this.isInCooldown) {
      return;
    }

    // Reset si ha pasado el tiempo
    if (currentTime - this.lastNavigationTime > this.TIME_WINDOW) {
      this.navigationCount = 0;
    }

    // Si es la misma URL, incrementar contador
    if (url === this.lastUrl) {
      this.navigationCount++;
    } else {
      this.navigationCount = 1; // Nueva URL, reset contador
    }

    this.lastUrl = url;
    this.lastNavigationTime = currentTime;

    // Si hay demasiadas navegaciones rápidas
    if (this.navigationCount >= this.MAX_RAPID_NAVIGATIONS) {
      this.activateCooldown();
    }
  }

  private activateCooldown(): void {
    console.warn('🚨 Anti-loop activated: Too many rapid navigations detected');
    this.isInCooldown = true;
    
    // Limpiar posibles flags de localStorage que causen loops
    localStorage.removeItem('forcedLogout');
    localStorage.removeItem('forcedLogoutTime');
    
    // Desactivar cooldown después del tiempo especificado
    setTimeout(() => {
      this.isInCooldown = false;
      this.navigationCount = 0;
      console.log('✅ Anti-loop cooldown deactivated');
    }, this.COOLDOWN_DURATION);
  }

  public isNavigationAllowed(): boolean {
    return !this.isInCooldown;
  }

  public reportSuspiciousActivity(source: string, details: any): void {
    console.warn(`🚨 Suspicious activity detected from ${source}:`, details);
    
    // Si detectamos actividad sospechosa, activar cooldown inmediatamente
    if (!this.isInCooldown) {
      this.activateCooldown();
    }
  }
}
