import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../../../@core/backend/services/dashboard.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface DonutChartOptions {
  series: number[];
  chart: {
    type: 'donut';
    height: number;
    toolbar: {
      show: boolean;
    };
  };
  labels: string[];
  dataLabels: {
    enabled: boolean;
  };
  responsive: {
    breakpoint: number;
    options: {
      chart: {
        width: number;
      };
      legend: {
        position: string;
      };
    };
  }[];
  legend: {
    position: string;
    horizontalAlign: string;
  };
  plotOptions: {
    pie: {
      donut: {
        size: string;
        labels: {
          show: boolean;
          name: {
            show: boolean;
            fontSize: string;
            fontFamily: string;
            fontWeight: number;
            color: string;
            offsetY: number;
          };
          value: {
            show: boolean;
            fontSize: string;
            fontFamily: string;
            fontWeight: number;
            color: string;
            offsetY: number;
            formatter: (val: string) => string;
          };
          total: {
            show: boolean;
            showAlways: boolean;
            label: string;
            fontSize: string;
            fontFamily: string;
            fontWeight: number;
            color: string;
            formatter: (w: any) => string;
          };
        };
      };
    };
  };
  colors: string[];
  tooltip?: {
    theme: string;
    y: {
      formatter: (value: number, context?: any) => string;
    };
  };
}

@Component({
  selector: 'ngx-nivel-chart',
  templateUrl: './nivel-chart.component.html',
  styleUrls: ['./nivel-chart.component.scss']
})
export class NivelChartComponent implements OnInit, OnDestroy {
  public chartOptions: DonutChartOptions;
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
  }

  private setupDashboardSubscription(): void {
    
    // Suscribirse a los datos unificados del dashboard
    this.dashboardService.dashboardData$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboardData) => {
          if (dashboardData && dashboardData.salesByNivel) {
            console.log('📊 Nivel-chart: Recibiendo datos de niveles desde cache:', dashboardData.salesByNivel);
            this.updateChart(dashboardData.salesByNivel);
            this.isLoading = false;
          } else {
            console.log('⏳ Nivel-chart: Esperando datos del dashboard...');
            this.isLoading = true;
          }
        },
        error: (error) => {
          console.error('❌ Nivel-chart: Error obteniendo datos del dashboard:', error);
          this.isLoading = false;
          this.hasData = false;
        }
      });
  }

  toggleSortBy(): void {
    this.sortByAmount = !this.sortByAmount;
    // Actualizar las opciones del gráfico para reflejar el cambio en los formatters
    this.initializeChart();
    this.updateChart(this.originalData);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChart(): void {
    // Calcular configuración responsiva
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
        type: 'donut',
        height: chartHeight,
        toolbar: {
          show: !isMobile // Ocultar toolbar en móvil
        }
      },
      labels: [],
      dataLabels: {
        enabled: !isSmallMobile // Ocultar en móviles pequeños
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }],
      legend: {
        position: 'right',
        horizontalAlign: 'center'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 600,
                color: undefined,
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '16px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 400,
                color: undefined,
                offsetY: 16,
                formatter: (val: string) => {
                  if (this.sortByAmount) {
                    return `S/ ${parseFloat(val).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  } else {
                    return `${parseInt(val)} docs`;
                  }
                }
              },
              total: {
                show: true,
                showAlways: false,
                label: 'Total',
                fontSize: '14px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 600,
                color: '#373d3f',
                formatter: (w: any) => {
                  try {
                    // Validar que w y w.globals existen
                    if (!w || !w.globals || !w.globals.seriesTotals) {
                      return this.sortByAmount ? 'S/ 0.00' : '0 docs';
                    }
                    
                    const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                    if (this.sortByAmount) {
                      return `S/ ${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    } else {
                      return `${total} docs`;
                    }
                  } catch (error) {
                    console.warn('Error en formatter de nivel-chart:', error);
                    return this.sortByAmount ? 'S/ 0.00' : '0 docs';
                  }
                }
              }
            }
          }
        }
      },
      colors: ['#00d68f', '#0095ff', '#ffaa00', '#ff3d71', '#8f5fe8'],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number, { seriesIndex }: any) => {
            try {
              const dataItem = this.chartData[seriesIndex];
              if (!dataItem) {
                return `${value}`;
              }

              const monto = dataItem.monto || 0;
              const cantidad = dataItem.cantidad || 0;
              
              if (this.sortByAmount) {
                return `S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${cantidad} documentos`;
              } else {
                return `${cantidad} documentos - S/ ${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            } catch (error) {
              console.warn('Error en formatter del tooltip nivel-chart:', error);
              return `${value}`;
            }
          }
        }
      }
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
        console.log('📊 Nivel-chart: Filtros actualizados, esperando nuevos datos del dashboard...');
      });
  }

  private updateChart(data: any[]): void {
    if (!data || data.length === 0) {
      console.log('📊 Nivel-chart: No hay datos para mostrar');
      this.hasData = false;
      this.chartData = [];
      this.originalData = [];
      this.chartOptions = {
        ...this.chartOptions,
        series: [],
        labels: []
      };
      return;
    }

    console.log('📊 Nivel-chart: Actualizando gráfico con datos:', data);

    // Verificar estructura de datos y normalizar
    const normalizedData = data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          nivel: item.nivel || item.categoria || 'Sin nivel',
          monto: item.monto || item.total || 0,
          cantidad: item.cantidad || 0
        };
      } else {
        console.warn('📊 Nivel-chart: Formato de dato inesperado:', item);
        return {
          nivel: 'Desconocido',
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

    const labels = sortedData.map(item => item.nivel);

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
      series: values,
      labels: labels
    };

    console.log('📊 Nivel-chart: Gráfico actualizado correctamente');
  }

  public onFiltersChange(filters: any): void {
    this.filters$.next(filters);
  }

  public getSortButtonText(): string {
    return this.sortByAmount ? 'Ordenar por Cantidad' : 'Ordenar por Monto';
  }

  public getSortButtonIcon(): string {
    return this.sortByAmount ? 'hash-outline' : 'trending-up-outline';
  }
}