import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, OnDestroy } from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';
import { DashboardFilters } from '../dashboard-filters/dashboard-filters.component';
import { DashboardService } from '../../../@core/backend/services/dashboard.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface ChartOptions {
  series: any[];
  chart: any;
  xaxis: any;
  yaxis: any;
  colors: string[];
  legend: any;
  fill: any;
  dataLabels: any;
  grid: any;
  stroke: any;
  tooltip: any;
}

@Component({
  selector: 'ngx-sales-chart',
  templateUrl: './sales-chart.component.html',
  styleUrls: ['./sales-chart.component.scss']
})
export class SalesChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chart') chart!: ChartComponent;
  @Input() filters!: DashboardFilters;

  public chartOptions: Partial<ChartOptions> = {};
  public isLoading = false;
  private destroy$ = new Subject<void>();
  private chartData: any[] = []; // Almacenar data completa para tooltips

  constructor(private dashboardService: DashboardService) {}

  // Datos simulados por ahora (como fallback)
  private sampleData = {
    categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    series: [
      {
        name: 'Ventas (S/)',
        data: [30000, 40000, 35000, 50000, 49000, 60000]
      }
    ]
  };

  ngOnInit(): void {
    this.initChart();
    // Suscribirse a los datos del dashboard en lugar de hacer petición independiente
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
          if (dashboardData && dashboardData.salesTrend) {
            
            this.handleSalesTrendData(dashboardData.salesTrend);
            this.isLoading = false;
          } else {
            this.isLoading = true;
          }
        },
        error: (error) => {
          console.error('❌ Sales-chart: Error obteniendo datos del dashboard:', error);
          this.updateChartWithSimulatedData();
          this.isLoading = false;
        }
      });
  }

  private handleSalesTrendData(salesTrend: any[]): void {
    if (!salesTrend || salesTrend.length === 0) {
      this.updateChartWithSimulatedData();
      return;
    }

    // Procesar datos de tendencia
    const categories = salesTrend.map(item => item.periodo || 'Sin período');
    const amounts = salesTrend.map(item => item.monto || 0);
    
    this.chartData = salesTrend;
    
    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: 'Ventas (S/)',
        data: amounts
      }],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: categories
      }
    };
    
  }

  private initChart(): void {
    this.chartOptions = {
      series: this.sampleData.series,
      chart: {
        height: 350,
        width: '100%',
        type: 'area',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      colors: ['#3366FF', '#00D68F'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: this.sampleData.categories,
        labels: {
          style: {
            colors: '#8F9BB3'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#8F9BB3'
          },
          formatter: function (value: number) {
            return 'S/ ' + value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        }
      },
      grid: {
        borderColor: '#E4E9F2',
        strokeDashArray: 5
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left'
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number, { dataPointIndex }: any) => {
            try {
              // Obtener la cantidad usando el índice del punto de datos
              const cantidad = this.chartData[dataPointIndex]?.cantidad || 0;
              return `S/ ${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${cantidad} ventas`;
            } catch (error) {
              console.warn('Error en formatter del tooltip sales-chart:', error);
              return 'S/ ' + value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
          }
        }
      }
    };
  }

 
  private updateChartWithSimulatedData(): void {
    // Usar datos simulados basados en filtros
    const filteredData = this.getFilteredData();
    
    this.chartOptions = {
      ...this.chartOptions,
      series: filteredData.series,
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: filteredData.categories
      }
    };
  }

  private getFilteredData() {
    // Lógica simulada para filtrar datos
    const baseData = [30000, 40000, 35000, 50000, 49000, 60000];
    
    // Aplicar factores basados en filtros
    let multiplier = 1;
    if (this.filters.categoria) multiplier *= 0.8;
    if (this.filters.materia) multiplier *= 0.7;
    if (this.filters.nivel) multiplier *= 0.9;
    if (this.filters.grado) multiplier *= 0.85;
    
    const filteredData = baseData.map(value => Math.round(value * multiplier));
    
    return {
      categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      series: [
        {
          name: `Ventas Filtradas (S/)`,
          data: filteredData
        }
      ]
    };
  }
}