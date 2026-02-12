import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, takeUntil, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { DashboardFilters } from '../../../shared/components/dashboard-filters/dashboard-filters.component';
import { Subject } from 'rxjs';
import { DashboardStats } from '../../interfaces/dashboard';
import { DashboardApi } from '../api/dashboard.api';
import { DebugTokenService } from '../../../debug-token.service';
import { jwtDecode } from 'jwt-decode';

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
  salesByTipoSuscripcion?: Array<VentasPorTipoSuscripcionDto>;
  salesByMateriaSuscripcion?: Array<VentasPorMateriaSuscripcionDto>;
  salesByOpcionSuscripcion?: Array<VentasPorOpcionSuscripcionDto>;
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

export interface VentasPorTipoSuscripcionDto {
  tipoSuscripcion: string;
  monto: number;
  cantidad: number;
}

export interface VentasPorMateriaSuscripcionDto {
  materiaSuscripcion: string;
  monto: number;
  cantidad: number;
}

export interface VentasPorOpcionSuscripcionDto {
  opcionSuscripcion: string;
  cantidad: number;
}

export interface TopEmbajadorDto {
  promotorId: string;
  firstname: string;
  lastname: string;
  email: string;
  total: number;
}

export interface DashboardActivityDto {
  id: number;
  actorEmail: string;
  action: string;
  targetTable: string;
  targetId: number;
  payload?: string;
  timestamp?: string;
  ipAddress?: string;
  mensaje?: string; // texto legible en español proporcionado por el backend
}

export interface DashboardReleaseDto {
  content: string;
  updatedAt?: string;
  updatedBy?: string;
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

  constructor(private http: HttpClient, private dashboardApi: DashboardApi, private debugToken: DebugTokenService) { }

  // Fetch top embajadores for current month
  getTopEmbajadores(limit = 5): Observable<TopEmbajadorDto[]> {
    return this.http.get<any>(`${this.apiUrl}/top-embajadores?limit=${limit}`).pipe(
      map((resp) => resp?.data || []),
      catchError((err) => {
        console.warn('Error fetching top embajadores', err);
        return new Observable<TopEmbajadorDto[]>(observer => { observer.next([]); observer.complete(); });
      })
    );
  }

  // Get recent audit activities (for activity feed)
  getRecentActivities(limit = 5): Observable<DashboardActivityDto[]> {
    return this.http.get<any>(`${this.apiUrl}/recent-activities?limit=${limit}`).pipe(
      map((resp) => resp?.data || []),
      catchError((err) => {
        console.warn('Error fetching recent activities', err);
        return new Observable<DashboardActivityDto[]>(observer => { observer.next([]); observer.complete(); });
      })
    );
  }

  // Get the shared 'Próximo lanzamiento' from backend
  getNextLaunch(): Observable<DashboardReleaseDto> {
    return this.http.get<any>(`${this.apiUrl}/next-launch`).pipe(
      map(resp => resp?.data || { content: '' }),
      catchError(err => {
        console.warn('Error fetching next-launch', err);
        return new Observable<DashboardReleaseDto>(observer => { observer.next({ content: '' }); observer.complete(); });
      })
    );
  }

  saveNextLaunch(content: string): Observable<DashboardReleaseDto> {
    // Try to extract user identifier from token to send as updatedBy
    let updatedBy: string | null = null;
    try {
      const token = localStorage.getItem('auth_app_token');
      if (token) {
        const decoded: any = jwtDecode(token as string);
        updatedBy = decoded?.sub || decoded?.email || null;
      }
    } catch (e) {
      // ignore - we'll let backend fallback to security context if needed
      console.warn('Could not decode token for updatedBy', e);
      updatedBy = null;
    }

    const body: any = { content };
    if (updatedBy) {
      body.updatedBy = updatedBy;
    }

    return this.http.put<any>(`${this.apiUrl}/next-launch`, body).pipe(
      map(resp => resp?.data || { content }),
      catchError(err => {
        console.warn('Error saving next-launch', err);
        return new Observable<DashboardReleaseDto>(observer => { observer.next({ content }); observer.complete(); });
      })
    );
  }

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

  // Simple stats endpoint (embajadores, retiros, ventas, comisiones)
  // Try dedicated GET /stats first; if it fails, fall back to POST /data mapping for backward compatibility.
  getStats(): Observable<DashboardStats> {
    return this.dashboardApi.getStats().pipe(
      // ResponseHandler wraps the payload in { data, result, status, timestamp }
      map((resp: any) => resp?.data as DashboardStats),
      catchError((err) => {
        console.warn('GET /api/v1/dashboard/stats failed, falling back to /data mapping', err);
        return this.getDashboardData().pipe(
          map(response => {
            const d: any = response?.data || {};
            const m: any = d.metrics || {};

            const embajadores = m.totalPromotores ?? m.totalUsuarios ?? m.totalUsers ?? m.embajadoresActivos ?? m.totalUsersCount ?? 0;
            const retiros = m.pendingWithdrawals ?? m.retirosPendientes ?? m.withdrawalsPending ?? 0;
            const ventas = m.totalVentas ?? m.salesLast30d ?? m.salesLast30Days ?? m.totalSales ?? 0;
            const comisiones = m.comisionesPagadasMes ?? m.commissionsPaidMonth ?? m.commissionPaidMonth ?? m.totalCommissionsMonth ?? 0;

            return {
              embajadoresActivos: embajadores,
              retirosPendientes: retiros,
              ventasUltimos30d: ventas,
              comisionesPagadasMes: comisiones,
            } as DashboardStats;
          })
        );
      })
    );
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