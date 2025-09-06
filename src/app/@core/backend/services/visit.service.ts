import { Injectable, OnDestroy } from '@angular/core';
import { HttpService } from '../api/http.service';
import { Subject, timer } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
// import { UnifiedAntiLoopService } from '../../services/unified-anti-loop.service'; // TEMPORALMENTE DESACTIVADO

@Injectable({ providedIn: 'root' })
export class VisitService implements OnDestroy {
  private base = 'api/v1/visits';
  private destroy$ = new Subject<void>();
  private pendingRequests = new Set<string>();
  private consecutiveErrors = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 3;
  private readonly VISIT_COOLDOWN = 15 * 60 * 1000; // 15 minutos entre visits

  constructor(
    private api: HttpService
    // private antiLoopService: UnifiedAntiLoopService // TEMPORALMENTE DESACTIVADO
  ) {}

  sendVisit(page: string) {
    // ANTI-LOOP TEMPORALMENTE DESACTIVADO PARA TESTING
    // if (!this.antiLoopService.isNavigationAllowed()) {
    //   console.warn('🚫 Visit tracking blocked by anti-loop service');
    //   return;
    // }

    // Verificar si hay demasiados errores consecutivos
    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      console.warn('🚫 Visit tracking disabled due to consecutive errors');
      return;
    }
    
    // Verificar cooldown por página
    const key = `visit:${page}`;
    const lastVisit = localStorage.getItem(key);
    const now = Date.now();
    
    if (lastVisit && (now - parseInt(lastVisit, 10)) < this.VISIT_COOLDOWN) {
      return; // Cooldown activo
    }

    // Evitar múltiples requests para la misma página
    if (this.pendingRequests.has(page)) {
      return;
    }

    // Verificar que el backend está disponible
    const backendErrorKey = 'visit_backend_error';
    const lastError = localStorage.getItem(backendErrorKey);
    if (lastError && (now - parseInt(lastError)) < 5 * 60 * 1000) {
      console.warn('🚫 Visit tracking disabled - Backend unavailable');
      return;
    }

    // Registrar intento de visit
    localStorage.setItem(key, String(now));
    this.pendingRequests.add(page);

    const payload = {
      page,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId()
    };
    
    // Enviar con timeout corto y manejo robusto de errores
    this.api.post(this.base, payload).pipe(
      takeUntil(timer(5000)), // Timeout de 5 segundos
      takeUntil(this.destroy$),
      catchError(error => {
        console.warn('Visit tracking failed for page:', page, error);
        
        this.consecutiveErrors++;
        
        // Reportar actividad sospechosa si hay muchos errores
        if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
          // this.antiLoopService.reportSuspiciousActivity('VisitService', {
          //   page,
          //   consecutiveErrors: this.consecutiveErrors,
          //   error: error.message
          // }); // TEMPORALMENTE DESACTIVADO
          console.warn('🚫 VisitService: Demasiados errores consecutivos');
        }
        
        // Marcar backend como problemático
        localStorage.setItem(backendErrorKey, now.toString());
        
        // Remover timestamp para permitir retry más tarde
        localStorage.removeItem(key);
        
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          console.log('✅ Visit tracked successfully:', page);
          this.consecutiveErrors = 0; // Reset errores en éxito
          localStorage.removeItem(backendErrorKey); // Limpiar flag de error
        }
      },
      complete: () => {
        this.pendingRequests.delete(page);
      },
      error: (error) => {
        console.warn('Visit tracking error:', error);
        this.pendingRequests.delete(page);
      }
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // obtener stats
  getDailyStats(from: string, to: string) {
    return this.api.get(`${this.base}/stats/daily?from=${from}&to=${to}`);
  }

  getPageStats(from: string, to: string) {
    return this.api.get(`${this.base}/stats/pages?from=${from}&to=${to}`);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}