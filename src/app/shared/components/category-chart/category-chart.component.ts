import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, OnDestroy } from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';
import { DashboardFilters } from '../dashboard-filters/dashboard-filters.component';
import { DashboardService } from '../../../@core/backend/services/dashboard.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface PieChartOptions {
  series: number[];
  chart: any;
  labels: string[];
  colors: string[];
  legend: any;
  dataLabels: any;
  plotOptions: any;
  tooltip: any;
}

@Component({
  selector: 'ngx-category-chart',
  templateUrl: './category-chart.component.html',
  styleUrls: ['./category-chart.component.scss']
})
export class CategoryChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chart') chart!: ChartComponent;
  @Input() filters!: DashboardFilters;

  public chartOptions: Partial<PieChartOptions> = {};
  public isLoading = false;
  public hasData = false;
  public sortByAmount = true; // true = ordenar por monto, false = ordenar por cantidad
  private destroy$ = new Subject<void>();
  private chartData: any[] = []; // Almacenar data completa para tooltips
  private originalData: any[] = []; // Almacenar data original sin ordenar

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.initChart();
    this.setupDashboardSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters'] && !changes['filters'].firstChange) {
      // Los datos se actualizarán automáticamente via la suscripción al dashboard
    }
  }

  private setupDashboardSubscription(): void {
    
    // Suscribirse a los datos unificados del dashboard
    this.dashboardService.dashboardData$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboardData) => {
          if (dashboardData && dashboardData.salesByCategory) {
            this.processRealCategoryData(dashboardData.salesByCategory);
            this.isLoading = false;
          } else {
            console.log('⏳ Category-chart: Esperando datos del dashboard...');
            this.isLoading = true;
          }
        },
        error: (error) => {
          console.error('❌ Category-chart: Error obteniendo datos del dashboard:', error);
          this.isLoading = false;
          this.hasData = false;
        }
      });
  }

  // DEPRECATED: Ya no se usa con el nuevo patrón de suscripción directa
  // private loadInitialData(): void {
  //   this.isLoading = true;
  //   
  //   console.log('Cargando datos iniciales del gráfico de categorías...');
  //   
  //   // Filtros por defecto
  //   const defaultFilters: DashboardFilters = {
  //     categoria: '',
  //     materia: '',
  //     nivel: '',
  //     grado: '',
  //     periodo: '30'
  //   };
  //   
  //   this.loadCategoryData(defaultFilters);
  // }

  private initChart(): void {
    // Calcular altura responsiva
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let chartHeight = 350; // Desktop
    if (isSmallMobile) {
      chartHeight = 280;
    } else if (isMobile) {
      chartHeight = 320;
    }

    this.chartOptions = {
      series: [],
      chart: {
        type: 'pie',
        height: chartHeight,
        toolbar: {
          show: !isMobile, // Ocultar toolbar en móvil
          tools: {
            download: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      labels: [],
      colors: [
        '#3366FF', // Azul primario
        '#00D68F', // Verde esmeralda
        '#FFAA00', // Naranja dorado
        '#FF3D71', // Rosa/rojo
        '#8F9BB3', // Gris azulado
        '#228B22', // Verde bosque
        '#9C27B0', // Púrpura
        '#FF5722', // Naranja rojizo
        '#00BCD4', // Cian
        '#795548', // Marrón
      ],
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        floating: false,
        fontSize: isSmallMobile ? '10px' : '12px', // Fuente más pequeña en móvil
        fontFamily: 'Inter, sans-serif'
      },
      dataLabels: {
        enabled: true, // Siempre mostrar porcentajes
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: isSmallMobile ? '10px' : '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600', // Hacer el texto más visible
          colors: ['#ffffff'] // Color blanco para mejor contraste
        },
        dropShadow: {
          enabled: true,
          top: 1,
          left: 1,
          blur: 1,
          color: '#000',
          opacity: 0.45
        }
      },
      plotOptions: {
        pie: {
          expandOnClick: true,
          donut: {
            size: '0%'  // Cambiado de 45% a 0% para hacer un pie chart normal
          }
        }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number, { seriesIndex, w }: any) => {
            try {
              const dataItem = this.chartData[seriesIndex];
              if (!dataItem) {
                return `${value}`;
              }

              const monto = dataItem.monto || 0;
              const cantidad = dataItem.cantidad || 0;
              
              // Validar que w y w.globals existen
              if (!w || !w.globals || !w.globals.seriesTotals) {
                if (this.sortByAmount) {
                  return `S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${cantidad} ventas`;
                } else {
                  return `${cantidad} ventas - S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
              }
              
              const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              
              // Validar que el total es válido
              if (!total || total === 0) {
                if (this.sortByAmount) {
                  return `S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${cantidad} ventas`;
                } else {
                  return `${cantidad} ventas - S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
              }
              
              const percentage = ((value / total) * 100).toFixed(1);
              
              if (this.sortByAmount) {
                return `S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%) - ${cantidad} ventas`;
              } else {
                return `${cantidad} ventas (${percentage}%) - S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            } catch (error) {
              console.warn('Error en formatter del tooltip:', error);
              return `${value}`;
            }
          }
        }
      }
    };
  }

  // DEPRECATED: Ya no se usa con el nuevo patrón de suscripción directa
  // private updateChart(): void {
  //   this.isLoading = true;
  //   console.log('Actualizando gráfico de categorías con filtros:', this.filters);
  //   this.loadCategoryData(this.filters);
  // }

  // DEPRECATED: Ya no se usa con el nuevo patrón de suscripción directa  
  // private loadCategoryData(filters: DashboardFilters): void {
  //   console.log('Cargando datos reales de categorías desde el backend con filtros:', filters);
  //   
  //   this.dashboardService.getSalesByCategoria(filters)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (data) => {
  //         console.log('Datos de categorías recibidos del backend:', data);
  //         this.processRealCategoryData(data);
  //       },
  //       error: (error) => {
  //         console.error('Error al cargar datos de categorías:', error);
  //         this.isLoading = false;
  //         this.hasData = false;
  //       }
  //     });
  // }

  private processRealCategoryData(data: any[]): void {
    
    if (!data || data.length === 0) {
      this.hasData = false;
      this.isLoading = false;
      this.chartData = [];
      this.originalData = [];
      return;
    }

    // Guardar data original sin ordenar
    this.originalData = [...data];

    // Ordenar según la preferencia actual
    const sortedData = [...data].sort((a, b) => {
      if (this.sortByAmount) {
        return (b.monto || 0) - (a.monto || 0); // Ordenar por monto descendente
      } else {
        return (b.cantidad || 0) - (a.cantidad || 0); // Ordenar por cantidad descendente
      }
    });

    // Guardar data ordenada para usar en tooltips
    this.chartData = sortedData;

    const labels = sortedData.map(item => this.formatCategoryName(item.categoria));
    const series = sortedData.map(item => {
      if (this.sortByAmount) {
        return Math.round((item.monto || 0) * 100) / 100; // Usar monto para el gráfico
      } else {
        return item.cantidad || 0; // Usar cantidad para el gráfico
      }
    });

    this.hasData = series.length > 0 && series.some(s => s > 0);

    // Actualizar el gráfico de forma más robusta
    this.chartOptions = {
      ...this.chartOptions,
      series: series,
      labels: labels
    };


    // Forzar la actualización del gráfico
    setTimeout(() => {
      if (this.chart) {
        this.chart.updateOptions({
          series: series,
          labels: labels
        });
      } else {
        console.log('Referencia del gráfico no encontrada');
      }
    }, 100);

    this.isLoading = false;
  }

  private formatCategoryName(categoria: string): string {
    const formatMap: Record<string, string> = {
      'SUSCRIPCION': 'Suscripciones',
      'SESIONES': 'Sesiones',
      'KITS': 'Kits',
      'PLANIFICACION': 'Planificación',
      'REFORZAMIENTO': 'Reforzamiento',
      'PLAN_LECTOR': 'Plan Lector',
      'EVALUACION': 'Evaluación',
      'ESTRATEGIAS': 'Estrategias',
      'RECURSOS': 'Recursos',
      'EBOOKS': 'E-books',
      'TALLERES': 'Talleres',
      'MATERIAL_GRATIS': 'Material Gratis'
    };
    
    return formatMap[categoria] || categoria;
  }

  public toggleSortBy(): void {
    this.sortByAmount = !this.sortByAmount;
    
    if (this.originalData && this.originalData.length > 0) {
      this.processRealCategoryData(this.originalData);
    }
  }

  public getSortButtonText(): string {
    return this.sortByAmount ? 'Ordenar por Cantidad' : 'Ordenar por Monto';
  }

  public getSortButtonIcon(): string {
    return this.sortByAmount ? 'hash-outline' : 'trending-up-outline';
  }
}