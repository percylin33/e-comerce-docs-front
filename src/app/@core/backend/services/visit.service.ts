import { Injectable, OnDestroy } from '@angular/core';
import { HttpService } from '../api/http.service';
import { Subject, timer } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VisitService implements OnDestroy {
  private base = 'api/v1/visits';
  private destroy$ = new Subject<void>();
  private pendingRequests = new Set<string>();

  constructor(private api: HttpService) {}

  sendVisit(page: string) {
    // Verificar si está en modo de emergencia
    const emergencyMode = localStorage.getItem('emergency_mode');
    const visitsDisabled = localStorage.getItem('visits_disabled');
    
    if (emergencyMode === 'true' || visitsDisabled) {
      console.warn('🚫 Visit tracking disabled - Emergency mode active');
      return;
    }
    
    // Prevenir duplicados: usar localStorage para no enviar más de una visita por sesión en la misma ruta
    const key = `visit:${page}`;
    const last = localStorage.getItem(key);
    const now = Date.now();
    
    // Aumentar el tiempo de cooldown a 10 minutos para evitar spam
    if (last && (now - parseInt(last, 10)) < 10 * 60 * 1000) {
      return;
    }

    // Evitar múltiples requests para la misma página al mismo tiempo
    if (this.pendingRequests.has(page)) {
      return;
    }

    // Verificar si hay demasiados errores recientes
    const errorKey = `visit_errors:${page}`;
    const recentErrors = localStorage.getItem(errorKey);
    if (recentErrors && parseInt(recentErrors) > 3) {
      console.warn('🚫 Visit tracking disabled for page due to repeated errors:', page);
      return;
    }

    localStorage.setItem(key, String(now));
    this.pendingRequests.add(page);

    const payload = {
      page,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Agregar timeout y manejo de errores mejorado
    this.api.post(this.base, payload).pipe(
      takeUntil(timer(3000)), // Timeout reducido a 3 segundos
      takeUntil(this.destroy$),
      catchError(error => {
        console.warn('Failed to track visit for page:', page, error);
        
        // Contar errores para esta página
        const currentErrors = parseInt(localStorage.getItem(errorKey) || '0') + 1;
        localStorage.setItem(errorKey, currentErrors.toString());
        
        // Si hay demasiados errores, desactivar temporalmente
        if (currentErrors > 3) {
          setTimeout(() => {
            localStorage.removeItem(errorKey);
          }, 30 * 60 * 1000); // Reactivar después de 30 minutos
        }
        
        // Remover el timestamp en caso de error para permitir retry
        localStorage.removeItem(key);
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          console.log('Visit tracked successfully for page:', page);
          // Limpiar contador de errores en caso de éxito
          localStorage.removeItem(errorKey);
        }
        this.pendingRequests.delete(page);
      },
      error: (error) => {
        console.warn('Failed to track visit for page:', page, error);
        this.pendingRequests.delete(page);
        // No hacer nada más para evitar bucles
      }
    });
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