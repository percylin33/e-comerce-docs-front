import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VisitService {
  private base = 'http://localhost:8080/api/v1/visits';
  constructor(private http: HttpClient) {}

  sendVisit(page: string) {
    // prevenir duplicados: usar localStorage para no enviar más de una visita por sesión en la misma ruta
    const key = `visit:${page}`;
    const last = localStorage.getItem(key);
    const now = Date.now();
    if (last && (now - parseInt(last, 10)) < 30 * 1000) {
      // ya fue enviada hace menos de 30s
      return;
    }
    localStorage.setItem(key, String(now));

    const payload = {
      page,
      userAgent: navigator.userAgent
    };
    
    // Agregar manejo de errores mejorado
    this.http.post(this.base, payload, { 
      responseType: 'text' as 'json'
    }).subscribe({
      next: () => {
        console.log('Visit tracked successfully for page:', page);
      },
      error: (error) => {
        console.warn('Failed to track visit for page:', page, error);
        // No hacer nada más para evitar bucles
      }
    });
  }

  // obtener stats
  getDailyStats(from: string, to: string) {
    return this.http.get<{[k: string]: number}>(`${this.base}/stats/daily?from=${from}&to=${to}`);
  }

  getPageStats(from: string, to: string) {
    return this.http.get<{[k: string]: number}>(`${this.base}/stats/pages?from=${from}&to=${to}`);
  }
}