import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PromotorDashboardApi, PromotorDashboardData } from '../backend/api/promotor-dashboard.api';
import { CachedDataService } from './cached-data.service';

@Injectable({
  providedIn: 'root'
})
export class PromotorDashboardService {
  private api = inject(PromotorDashboardApi);
  private cache = inject(CachedDataService);


  /**
   * Obtiene todos los datos del dashboard en una sola llamada
   * Utiliza caché para evitar llamadas repetidas
   */
  getDashboardData(userId: number, useCache: boolean = true): Observable<PromotorDashboardData> {
    const cacheKey = `dashboard-${userId}`;
    
    const fetcher = () => this.api.getDashboardData(userId).pipe(
      map((response: any) => {
        // Extraer la propiedad 'data' de la respuesta del backend
        // Backend retorna: { result: true, data: {...}, timestamp: ..., status: 200 }
        if (response && response.data) {
          return response.data;
        }
        return response;
      })
    );
    
    if (useCache) {
      return this.cache.get(
        cacheKey,
        fetcher,
        3 * 60 * 1000 // 3 minutos de caché
      );
    }
    
    return fetcher();
  }

  /**
   * Fuerza actualización de datos (invalida caché)
   */
  refreshDashboard(userId: number): Observable<PromotorDashboardData> {
    const cacheKey = `dashboard-${userId}`;
    this.cache.invalidate(cacheKey);
    return this.getDashboardData(userId, false);
  }

  /**
   * Obtiene solo las estadísticas del dashboard
   */
  getEstadisticas(userId: number): Observable<PromotorDashboardData['estadisticas']> {
    return this.getDashboardData(userId).pipe(
      map(data => data.estadisticas)
    );
  }

  /**
   * Obtiene solo los datos del cupón
   */
  getCuponData(userId: number): Observable<PromotorDashboardData['cupon']> {
    return this.getDashboardData(userId).pipe(
      map(data => data.cupon)
    );
  }

  /**
   * Obtiene solo el perfil del usuario
   */
  getPerfilData(userId: number): Observable<PromotorDashboardData['perfil']> {
    return this.getDashboardData(userId).pipe(
      map(data => data.perfil)
    );
  }
}
