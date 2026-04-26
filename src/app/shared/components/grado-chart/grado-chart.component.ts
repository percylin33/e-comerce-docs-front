import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, OnDestroy } from '@angular/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { DashboardFilters } from '../dashboard-filters/dashboard-filters.component';
import { DashboardService } from '../../../@core/backend/services/dashboard.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NbCardModule, NbButtonModule, NbIconModule, NbSpinnerModule } from '@nebular/theme';

export interface AreaChartOptions {
  series: any[];
  chart: any;
  xaxis: any;
  yaxis: any;
  dataLabels: any;
  stroke: any;
  fill: any;
  colors: string[];
  tooltip: any;
}

@Component({
    selector: 'ngx-grado-chart',
    templateUrl: './grado-chart.component.html',
    styleUrls: ['./grado-chart.component.scss'],
    standalone: true,
    imports: [NbCardModule, NbButtonModule, NbIconModule, NbSpinnerModule, NgApexchartsModule]
})
export class GradoChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chart') chart!: ChartComponent;
  @Input() filters!: DashboardFilters;

  public chartOptions: Partial<AreaChartOptions> = {};
  public isLoading = false;
  public hasData = false;
  public sortByAmount = true;
  private destroy$ = new Subject<void>();
  private chartData: any[] = [];
  private originalData: any[] = [];

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
      // Los datos se actualizar�n autom�ticamente via la suscripci�n al dashboard
    }
  }

  private setupDashboardSubscription(): void {
    
    this.dashboardService.dashboardData$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboardData) => {
          if (dashboardData && dashboardData.salesByGrado) {
            this.updateChart(dashboardData.salesByGrado);
            this.isLoading = false;
          } else {
            this.isLoading = true;
          }
        },
        error: (error) => {
          console.error(' Grado-chart: Error obteniendo datos del dashboard:', error);
          this.isLoading = false;
          this.hasData = false;
        }
      });
  }

  private initChart(): void {
    this.chartOptions = {
      series: [{
        name: 'Ventas',
        data: []
      }],
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: []
      },
      yaxis: {
        title: {
          text: this.sortByAmount ? 'Monto de Ventas (S/)' : 'Cantidad de Documentos'
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          stops: [0, 90, 100]
        }
      },
      colors: ['#00d68f']
    };
  }

  private updateChart(data: any[]): void {
    if (!data || data.length === 0) {
      this.hasData = false;
      this.originalData = [];
      this.chartData = [];
      this.chartOptions = {
        ...this.chartOptions,
        series: [{
          name: 'Ventas',
          data: []
        }],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: []
        }
      };
      return;
    }


    const normalizedData = data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          grado: item.grado || item.categoria || 'Sin grado',
          monto: item.monto || item.total || 0,
          cantidad: item.cantidad || 0
        };
      } else {
        console.warn(' Grado-chart: Formato de dato inesperado:', item);
        return {
          grado: 'Desconocido',
          monto: 0,
          cantidad: 0
        };
      }
    });

    this.originalData = [...normalizedData];

    const sortedData = [...normalizedData].sort((a, b) => {
      const gradoA = a.grado || 'Sin grado';
      const gradoB = b.grado || 'Sin grado';
      
      const getGradoOrder = (grado: string): number => {
        const gradoUpper = grado.toUpperCase();
        
        if (gradoUpper === '1°' || gradoUpper === '1') return 1;
        if (gradoUpper === '2°' || gradoUpper === '2') return 2;
        if (gradoUpper === '3°' || gradoUpper === '3') return 3;
        if (gradoUpper === '4°' || gradoUpper === '4') return 4;
        if (gradoUpper === '5°' || gradoUpper === '5') return 5;
        if (gradoUpper === '1°-2°' ) return 6;
        if (gradoUpper === '3°-4°' ) return 7;
        if (gradoUpper === '3 AÑOS') return 8;
        if (gradoUpper === '4 AÑOS') return 9;
        if (gradoUpper === '5 AÑOS') return 10;
        if (gradoUpper === 'UNIDOCENTE') return 11;

        return 1000;
      };
      
      const orderA = getGradoOrder(gradoA);
      const orderB = getGradoOrder(gradoB);
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return gradoA.localeCompare(gradoB);
    });

    this.chartData = sortedData;

    const categories = sortedData.map(item => item.grado);

    const values = sortedData.map(item => {
      if (this.sortByAmount) {
        return Math.round((item.monto || 0) * 100) / 100;
      } else {
        return item.cantidad || 0;
      }
    });

    this.hasData = values.length > 0 && values.some(value => value > 0);

    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: this.sortByAmount ? 'Monto' : 'Cantidad',
        data: values
      }],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: categories
      }
    };

  }

  toggleSortBy(): void {
    this.sortByAmount = !this.sortByAmount;
    this.initChart();
    this.updateChart(this.originalData);
  }

  public getSortButtonText(): string {
    return this.sortByAmount ? 'Ordenar por Cantidad' : 'Ordenar por Monto';
  }

  public getSortButtonIcon(): string {
    return this.sortByAmount ? 'hash-outline' : 'trending-up-outline';
  }
}
