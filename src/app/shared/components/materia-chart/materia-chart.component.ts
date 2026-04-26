import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../../../@core/backend/services/dashboard.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NbCardModule, NbButtonModule, NbIconModule, NbSpinnerModule } from '@nebular/theme';
import { NgApexchartsModule } from 'ng-apexcharts';

interface BarChartOptions {
  series: {
    name: string;
    data: number[];
  }[];
  chart: {
    type: 'bar';
    height: number;
    toolbar: {
      show: boolean;
    };
  };
  plotOptions: {
    bar: {
      horizontal: boolean;
      columnWidth: string;
      endingShape: string;
    };
  };
  dataLabels: {
    enabled: boolean;
    formatter?: (val: number) => string;
  };
  stroke: {
    show: boolean;
    width: number;
    colors: string[];
  };
  xaxis: {
    categories: string[];
  };
  yaxis: {
    title: {
      text: string;
    };
  };
  fill: {
    opacity: number;
  };
  tooltip: {
    y: {
      formatter: (val: number, context?: any) => string;
    };
  };
  colors: string[];
  responsive?: any[];
}

@Component({
    selector: 'ngx-materia-chart',
    templateUrl: './materia-chart.component.html',
    styleUrls: ['./materia-chart.component.scss'],
    standalone: true,
    imports: [NbCardModule, NbButtonModule, NbIconModule, NbSpinnerModule, NgApexchartsModule]
})
export class MateriaChartComponent implements OnInit, OnDestroy {
  public chartOptions: BarChartOptions;
  public isLoading = false;
  public hasData = false;
  public sortByAmount = true; // true = ordenar por monto, false = ordenar por cantidad
  
  private destroy$ = new Subject<void>();
  private filters$ = new Subject<any>();
  private chartData: any[] = []; // Almacenar data completa para tooltips
  private originalData: any[] = []; // Almacenar data original sin ordenar

  constructor(private dashboardService: DashboardService) {
    this.initializeChart();
    this.setupFilterSubscription();
  }

  ngOnInit(): void {
    this.setupDashboardSubscription();
    
    // Escuchar cambios de tamaño de ventana para ajustar el gráfico
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar event listener
    window.removeEventListener('resize', () => {
      this.handleResize();
    });
  }

  private handleResize(): void {
    // Reinicializar el chart con nuevas dimensiones
    setTimeout(() => {
      this.initializeChart();
      if (this.originalData && this.originalData.length > 0) {
        this.updateChart(this.originalData);
      }
    }, 100);
  }

  private setupDashboardSubscription(): void {
    
    // Suscribirse a los datos unificados del dashboard
    this.dashboardService.dashboardData$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboardData) => {
          if (dashboardData && dashboardData.salesByMateria) {
            this.updateChart(dashboardData.salesByMateria);
            this.isLoading = false;
          } else {
            this.isLoading = true;
          }
        },
        error: (error) => {
          console.error('❌ Materia-chart: Error obteniendo datos del dashboard:', error);
          this.isLoading = false;
          this.hasData = false;
        }
      });
  }

  private initializeChart(): void {
    // Calcular altura responsiva
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let chartHeight = 550; // Desktop - reducido para mejor proporción en ancho completo
    if (isSmallMobile) {
      chartHeight = 450; // Mobile pequeño
    } else if (isMobile) {
      chartHeight = 500; // Mobile
    }

    this.chartOptions = {
      series: [{
        name: 'Ventas',
        data: []
      }],
      chart: {
        type: 'bar',
        height: chartHeight,
        toolbar: {
          show: !isMobile // Ocultar toolbar en móvil
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          columnWidth: isMobile ? '40%' : '30%', // Reducido para más espacio horizontal
          endingShape: 'rounded'
        }
      },
      dataLabels: {
        enabled: true, // Siempre mostrar valores
        formatter: function(val: number) {
          return val.toLocaleString('es-ES');
        }
      },
      stroke: {
        show: true,
        width: 1,
        colors: ['transparent']
      },
      xaxis: {
        categories: []
      },
      yaxis: {
        title: {
          text: 'Materias'
        }
      },
      fill: {
        opacity: 0.9 // Reducir opacidad ligeramente
      },
      tooltip: {
        y: {
          formatter: (val: number, { dataPointIndex }: any) => {
            try {
              const dataItem = this.chartData[dataPointIndex];
              if (!dataItem) {
                return `${val}`;
              }

              const monto = dataItem.monto || 0;
              const cantidad = dataItem.cantidad || 0;
              
              if (this.sortByAmount) {
                return `S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${cantidad} documentos`;
              } else {
                return `${cantidad} documentos - S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            } catch (error) {
              console.warn('Error en formatter del tooltip materia-chart:', error);
              return `${val}`;
            }
          }
        }
      },
      colors: [
        '#00d68f', '#0095ff', '#ffaa00', '#ff3d71', '#8f5fe8', 
        '#40dc7e', '#ffa726', '#9c27b0', '#ff5722', '#00bcd4',
        '#795548', '#607d8b', '#e91e63', '#4caf50', '#673ab7'
      ], // Expandir paleta de colores
      responsive: [{
        breakpoint: 768,
        options: {
          chart: {
            height: 500
          },
          plotOptions: {
            bar: {
              columnWidth: '60%'
            }
          }
        }
      }, {
        breakpoint: 480,
        options: {
          chart: {
            height: 450
          },
          plotOptions: {
            bar: {
              columnWidth: '65%'
            }
          }
        }
      }]
    };
  }

  private setupFilterSubscription(): void {
    this.dashboardService.filters$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(() => {
        // Los filtros ya se aplicarán automáticamente cuando se recarguen los datos del dashboard
      });
  }

  private updateChart(data: any[]): void {
    if (!data || data.length === 0) {
      this.hasData = false;
      this.chartData = [];
      this.originalData = [];
      this.chartOptions = {
        ...this.chartOptions,
        series: [{
          name: this.sortByAmount ? 'Monto (S/)' : 'Cantidad',
          data: []
        }],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: []
        }
      };
      return;
    }


    // Verificar estructura de datos y normalizar
    const normalizedData = data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          materia: item.materia || item.categoria || 'Sin materia',
          monto: item.monto || item.total || 0,
          cantidad: item.cantidad || 0
        };
      } else {
        console.warn('📚 Materia-chart: Formato de dato inesperado:', item);
        return {
          materia: 'Desconocido',
          monto: 0,
          cantidad: 0
        };
      }
    });

    // Guardar data original sin ordenar
    this.originalData = [...normalizedData];

    // Ordenar según la preferencia actual
    const sortedData = [...normalizedData].sort((a, b) => {
      if (this.sortByAmount) {
        return (b.monto || 0) - (a.monto || 0); // Ordenar por monto descendente
      } else {
        return (b.cantidad || 0) - (a.cantidad || 0); // Ordenar por cantidad descendente
      }
    });

    // Guardar data ordenada para usar en tooltips
    this.chartData = sortedData;

    const categories = sortedData.map(item => item.materia);

    const values = sortedData.map(item => {
      if (this.sortByAmount) {
        return Math.round((item.monto || 0) * 100) / 100; // Usar monto para el gráfico
      } else {
        return item.cantidad || 0; // Usar cantidad para el gráfico
      }
    });

    this.hasData = values.length > 0 && values.some(value => value > 0);

    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: this.sortByAmount ? 'Monto (S/)' : 'Cantidad',
        data: values
      }],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: categories
      }
    };

  }

  public onFiltersChange(filters: any): void {
    this.filters$.next(filters);
  }

  public toggleSortBy(): void {
    this.sortByAmount = !this.sortByAmount;
    
    if (this.originalData && this.originalData.length > 0) {
      this.updateChart(this.originalData);
    }
  }

  public getSortButtonText(): string {
    return this.sortByAmount ? 'Ordenar por Cantidad' : 'Ordenar por Monto';
  }

  public getSortButtonIcon(): string {
    return this.sortByAmount ? 'hash-outline' : 'trending-up-outline';
  }
}