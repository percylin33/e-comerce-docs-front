import { Component, OnInit, OnDestroy } from '@angular/core';
import { NbToastrService, NbCardModule, NbIconModule, NbAlertModule } from '@nebular/theme';
import { GraphicsData } from '../../@core/interfaces/graphics';
import { DashboardService } from '../../@core/backend/services/dashboard.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DashboardFilters, DashboardFiltersComponent } from '../../shared/components/dashboard-filters/dashboard-filters.component';
import { SalesChartComponent } from '../../shared/components/sales-chart/sales-chart.component';
import { CategoryChartComponent } from '../../shared/components/category-chart/category-chart.component';
import { NivelChartComponent } from '../../shared/components/nivel-chart/nivel-chart.component';
import { MateriaChartComponent } from '../../shared/components/materia-chart/materia-chart.component';
import { GradoChartComponent } from '../../shared/components/grado-chart/grado-chart.component';
import { TipoSuscripcionChartComponent } from '../../shared/components/tipo-suscripcion-chart/tipo-suscripcion-chart.component';
import { MateriaSuscripcionChartComponent } from '../../shared/components/materia-suscripcion-chart/materia-suscripcion-chart.component';
import { OpcionSuscripcionChartComponent } from '../../shared/components/opcion-suscripcion-chart/opcion-suscripcion-chart.component';
import { DecimalPipe, CurrencyPipe } from '@angular/common';

@Component({
    selector: 'ngx-panel-control',
    templateUrl: './panel-control.component.html',
    styleUrls: ['./panel-control.component.scss', './panel-control-dashboard.component.scss'],
    standalone: true,
    imports: [
        NbCardModule,
        NbIconModule,
        DashboardFiltersComponent,
        SalesChartComponent,
        CategoryChartComponent,
        NivelChartComponent,
        MateriaChartComponent,
        GradoChartComponent,
        TipoSuscripcionChartComponent,
        MateriaSuscripcionChartComponent,
        OpcionSuscripcionChartComponent,
        NbAlertModule,
        DecimalPipe,
        CurrencyPipe,
    ],
})
export class PanelControlComponent implements OnInit, OnDestroy {
  isSupAdmin: boolean = false;
  // Métodos para transformar datos para ng-apexcharts
  getTipoSuscripcionCategories(): string[] {
    return this.ventasPorTipoSuscripcion.map(item => item.tipo || item.name || item.tipoSuscripcion || '');
  }
  getTipoSuscripcionSeries(): any[] {
    return [{
      name: 'Monto',
      data: this.ventasPorTipoSuscripcion.map(item => item.monto || item.amount || 0)
    }, {
      name: 'Cantidad',
      data: this.ventasPorTipoSuscripcion.map(item => item.cantidad || item.count || 0)
    }];
  }

  getMateriaSuscripcionCategories(): string[] {
    return this.ventasPorMateriaSuscripcion.map(item => item.materia || item.name || item.materiaSuscripcion || '');
  }
  getMateriaSuscripcionSeries(): any[] {
    return [{
      name: 'Monto',
      data: this.ventasPorMateriaSuscripcion.map(item => item.monto || item.amount || 0)
    }, {
      name: 'Cantidad',
      data: this.ventasPorMateriaSuscripcion.map(item => item.cantidad || item.count || 0)
    }];
  }

  getOpcionSuscripcionCategories(): string[] {
    return this.ventasPorOpcionSuscripcion.map(item => item.opcion || item.name || item.opcionSuscripcion || '');
  }
  getOpcionSuscripcionSeries(): any[] {
    return [{
      name: 'Cantidad',
      data: this.ventasPorOpcionSuscripcion.map(item => item.cantidad || item.count || 0)
    }];
  }
  private destroy$ = new Subject<void>();

  // Datos básicos del dashboard
  allUsers: number = 0;
  allPayments: number = 0;
  allSales: number = 0;
  showSales: boolean = false;

  // Filtros del dashboard (actualizado para incluir tipoProducto y selects condicionales)
  currentFilters: DashboardFilters = {
    tipoProducto: 'todos',
    categoria: '',
    materia: '',
    nivel: '',
    grado: '',
    periodo: '365',
    tipoSuscripcion: '',
    materiaSuscripcion: '',
    opcionSuscripcion: ''
  };

  // Métricas filtradas
  filteredTotal: number = 0;
  filteredDocuments: number = 0;
  filteredAverage: number = 0;
  salesTrend: any[] = [];

  // Nuevos datos para gráficos de suscripción
  ventasPorTipoSuscripcion: any[] = [];
  ventasPorMateriaSuscripcion: any[] = [];
  ventasPorOpcionSuscripcion: any[] = [];

  constructor(
    private graphicsService: GraphicsData,
    private dashboardService: DashboardService,
    private toastrService: NbToastrService
  ) { }

  ngOnInit(): void {
    // Aquí deberías obtener el rol del usuario desde tu servicio de autenticación
    // Por ejemplo:
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.isSupAdmin = Array.isArray(user.roles) && user.roles.includes('SUPADMIN');
    } else {
      this.isSupAdmin = false;
    }

    this.setupDashboardSubscription(); // Configurar suscripción 
    this.loadBasicData(); // Cargar datos básicos (usuarios, pagos totales)
    this.loadDashboardData(); // Cargar datos del dashboard una sola vez
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDashboardSubscription(): void {
    // Suscribirse a los datos del dashboard
    this.dashboardService.dashboardData$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboardData) => {
          if (dashboardData) {
            this.updateMetricsFromDashboard(dashboardData);
          }
        },
        error: (error) => {
          console.error('Error obteniendo datos del dashboard:', error);
          this.toastrService.danger('Error al cargar datos del dashboard', 'Error');
        }
      });
  }

  private updateMetricsFromDashboard(dashboardData: any): void {
    const metrics = dashboardData.metrics;

    if (metrics) {
      this.filteredTotal = metrics.totalVentas || 0;
      this.filteredDocuments = metrics.totalDocumentos || 0;
      this.filteredAverage = this.filteredDocuments > 0 ? this.filteredTotal / this.filteredDocuments : 0;



      // Extraer nuevos datos para gráficos de suscripción usando los nombres correctos del backend
      this.ventasPorTipoSuscripcion = dashboardData.salesByTipoSuscripcion || (dashboardData as any).ventasPorTipoSuscripcion || [];
      this.ventasPorMateriaSuscripcion = dashboardData.salesByMateriaSuscripcion || (dashboardData as any).ventasPorMateriaSuscripcion || [];
      this.ventasPorOpcionSuscripcion = dashboardData.salesByOpcionSuscripcion || (dashboardData as any).ventasPorOpcionSuscripcion || [];
    }

    if (dashboardData.salesTrend) {
      this.salesTrend = dashboardData.salesTrend;
    }

  }

  private loadDashboardData(): void {
    this.dashboardService.loadDashboardData(this.currentFilters);
  }

  private loadBasicData(): void {
    this.graphicsService.getGraphics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.allUsers = res.data.allUsers;
          this.allPayments = res.data.allPayments;
        },
        error: () => {
          this.toastrService.danger('No se pudo cargar la información', 'Error');
        },
      });

    this.graphicsService.getGraphicsSoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.allSales = res.data.allSales;
        },
        error: () => {
          this.toastrService.danger('No se pudo cargar la información', 'Error');
        },
      });
  }

  onFiltersChanged(filters: DashboardFilters): void {
    this.currentFilters = { ...filters };

    // Actualizar filtros en el servicio y recargar datos usando endpoint unificado
    this.dashboardService.updateFilters(filters);
    this.dashboardService.loadDashboardData(filters);

    // Mostrar información de filtros aplicados
    const activeFilters = this.getActiveFiltersCount(filters);
    if (activeFilters > 0) {
      this.toastrService.info(`Se aplicaron ${activeFilters} filtro(s)`, 'Filtros Activos');
    }
  }

  private getActiveFiltersCount(filters?: DashboardFilters): number {
    // Cuenta los filtros activos según el tipoProducto
    const f = filters || this.currentFilters;
    let count = 0;
    if (f.tipoProducto) count++;
    if (f.tipoProducto === 'suscripcion') {
      if (f.tipoSuscripcion) count++;
      if (f.materiaSuscripcion) count++;
      if (f.opcionSuscripcion) count++;
    } else {
      if (f.categoria) count++;
      if (f.nivel) count++;
      if (f.materia) count++;
      if (f.grado) count++;
    }
    if (f.periodo) count++;
    return count;
  }
}
