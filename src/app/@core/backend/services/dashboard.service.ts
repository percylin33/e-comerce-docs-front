import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { DashboardFilters } from '../../../shared/components/dashboard-filters/dashboard-filters.component';
import { Subject } from 'rxjs';

export interface DashboardMetrics {
  totalVentas: number;
  totalDocumentos: number;
  promedioVentas: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  salesTrend: Array<{ periodo: string; monto: number; cantidad: number }>;
  salesByCategory: Array<{ categoria: string; monto: number; cantidad: number }>;
  salesByMateria: Array<{ materia: string; monto: number; cantidad: number }>;
  salesByNivel: Array<{ nivel: string; monto: number; cantidad: number }>;
  salesByGrado: Array<{ grado: string; monto: number; cantidad: number }>;
  appliedFilters?: any;
  timestamp?: number;
}

export interface DashboardResponse {
  data: DashboardData;
  result: boolean;
  message?: string;
  timestamp: string;
  status: number;
}

export interface VentasPorCategoriaDto {
  categoria: string;
  monto: number;
  cantidad: number;
}

export interface VentasPorMateriaDto {
  materia: string;
  monto: number;
  cantidad: number;
}

export interface VentasPorNivelDto {
  nivel: string;
  monto: number;
  cantidad: number;
}

export interface VentasPorGradoDto {
  grado: string;
  monto: number;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/api/v1/dashboard`;
  
  // Observable para los filtros actuales
  private filtersSubject = new BehaviorSubject<DashboardFilters>({
    categoria: '',
    materia: '',
    nivel: '',
    grado: '',
    periodo: '365'
  });
  
  public filters$ = this.filtersSubject.asObservable();

  // Cache para evitar múltiples llamadas HTTP
  private dashboardDataCache = new BehaviorSubject<DashboardData | null>(null);
  public dashboardData$ = this.dashboardDataCache.asObservable();
  
  // Mantener compatibilidad con metrics$
  public metrics$ = this.dashboardData$.pipe(
    map(data => data?.metrics || null)
  );
  
  private isLoading = new BehaviorSubject<boolean>(false);
  public loading$ = this.isLoading.asObservable();

  constructor(private http: HttpClient) {}

  // Método centralizado para cargar datos del dashboard
  loadDashboardData(filters?: DashboardFilters): void {
    const currentFilters = filters || this.getCurrentFilters();
    
    // Evitar múltiples llamadas simultáneas
    if (this.isLoading.value) {
      return;
    }

    this.isLoading.next(true);
    
    // Usar endpoint unificado
    this.getDashboardData(currentFilters).subscribe({
      next: (response) => {
        
        if (response.data) {
          this.dashboardDataCache.next(response.data);
        } else {
          console.warn('⚠️ No data in response:', response);
        }
        this.isLoading.next(false);
      },
      error: (error) => {
        console.error('❌ Error loading dashboard data:', error);
        this.isLoading.next(false);
      }
    });
  }

  // Método para obtener datos cacheados
  getCachedMetrics(): DashboardMetrics | null {
    const dashboardData = this.dashboardDataCache.value;
    return dashboardData?.metrics || null;
  }

  // Método principal para el endpoint unificado
  getDashboardData(filters?: DashboardFilters): Observable<DashboardResponse> {
    return this.http.post<DashboardResponse>(`${this.apiUrl}/data`, filters || {});
  }

  // Métodos de compatibilidad (deprecados)
  /** @deprecated Use getDashboardData() instead */
  getDashboardMetrics(filters?: DashboardFilters): Observable<any> {
    return this.getDashboardData(filters).pipe(
      map(response => ({
        ...response,
        data: response.data.metrics
      }))
    );
  }

  /** @deprecated Use getDashboardData() instead */
  getSalesTrend(filters?: DashboardFilters): Observable<any> {
    return this.getDashboardData(filters).pipe(
      map(response => ({
        ...response,
        data: response.data.salesTrend
      }))
    );
  }

  // Métodos optimizados para los gráficos que usan la nueva estructura
  getSalesByCategoria(filters?: DashboardFilters): Observable<VentasPorCategoriaDto[]> {
    return new Observable(observer => {
      const cachedData = this.dashboardDataCache.value;
      
      if (cachedData && cachedData.salesByCategory) {
        observer.next(cachedData.salesByCategory);
        observer.complete();
        return;
      }
      
      // Suscribirse una sola vez y completar
      const subscription = this.dashboardData$.subscribe({
        next: (dashboardData: any) => {
          if (dashboardData && dashboardData.salesByCategory) {
            observer.next(dashboardData.salesByCategory);
          } else {
            observer.next([]);
          }
          observer.complete();
          subscription.unsubscribe();
        },
        error: (error) => {
          console.error('📊 getSalesByCategoria: Error', error);
          observer.next([]);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  getSalesByMateria(filters?: DashboardFilters): Observable<VentasPorMateriaDto[]> {
    return new Observable(observer => {
      const cachedData = this.dashboardDataCache.value;
      
      if (cachedData && cachedData.salesByMateria) {
        observer.next(cachedData.salesByMateria);
        observer.complete();
        return;
      }
      
      const subscription = this.dashboardData$.subscribe({
        next: (dashboardData: any) => {
          if (dashboardData && dashboardData.salesByMateria) {
            observer.next(dashboardData.salesByMateria);
          } else {
            console.warn('📚 getSalesByMateria: No hay datos de materias');
            observer.next([]);
          }
          observer.complete();
          subscription.unsubscribe();
        },
        error: (error) => {
          console.error('📚 getSalesByMateria: Error', error);
          observer.next([]);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  getSalesByNivel(filters?: DashboardFilters): Observable<VentasPorNivelDto[]> {
    return new Observable(observer => {
      const cachedData = this.dashboardDataCache.value;
      
      if (cachedData && cachedData.salesByNivel) {
        observer.next(cachedData.salesByNivel);
        observer.complete();
        return;
      }
      
      const subscription = this.dashboardData$.subscribe({
        next: (dashboardData: any) => {
          if (dashboardData && dashboardData.salesByNivel) {
            observer.next(dashboardData.salesByNivel);
          } else {
            console.warn('🎓 getSalesByNivel: No hay datos de niveles');
            observer.next([]);
          }
          observer.complete();
          subscription.unsubscribe();
        },
        error: (error) => {
          console.error('🎓 getSalesByNivel: Error', error);
          observer.next([]);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  getSalesByGrado(filters?: DashboardFilters): Observable<VentasPorGradoDto[]> {
    return new Observable(observer => {
      const cachedData = this.dashboardDataCache.value;
      
      if (cachedData && cachedData.salesByGrado) {
        observer.next(cachedData.salesByGrado);
        observer.complete();
        return;
      }
      
      const subscription = this.dashboardData$.subscribe({
        next: (dashboardData: any) => {
          if (dashboardData && dashboardData.salesByGrado) {
            observer.next(dashboardData.salesByGrado);
          } else {
            console.warn('📝 getSalesByGrado: No hay datos de grados');
            observer.next([]);
          }
          observer.complete();
          subscription.unsubscribe();
        },
        error: (error) => {
          console.error('📝 getSalesByGrado: Error', error);
          observer.next([]);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  // Métodos para manejar filtros
  updateFilters(filters: DashboardFilters): void {
    this.filtersSubject.next(filters);
  }

  getCurrentFilters(): DashboardFilters {
    return this.filtersSubject.value;
  }
}