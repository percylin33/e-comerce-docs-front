import { Component, ElementRef, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { VisitService } from '../../@core/backend/services/visit.service';
import { Chart } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

interface VisitStats {
  total: number;
  average: number;
  peak: number;
}

@Component({
  selector: 'ngx-visits-chart',
  templateUrl: './visits-chart.component.html',
  styleUrls: ['./visits-chart.component.scss']
})
export class VisitsChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  
  chart?: Chart;
  from: string = '';
  to: string = '';
  isLoading: boolean = false;
  hasData: boolean = false;
  stats: VisitStats | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(private visitService: VisitService) {
    // Chart.js v2 no requiere registro manual de componentes
  }

  ngOnInit() {
    // Solo inicializar fechas aquí
    this.setQuickRange('week');
  }

  ngAfterViewInit() {
    // Verificar que el canvas esté disponible y cargar datos
    if (this.canvas && this.canvas.nativeElement) {
      // Pequeño delay para asegurar que el DOM esté completamente renderizado
      setTimeout(() => {
        this.load();
      }, 100);
    } else {
      console.warn('Canvas no disponible en ngAfterViewInit');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  setQuickRange(range: 'week' | 'month') {
    const today = new Date();
    const startDate = new Date();
    
    switch (range) {
      case 'week':
        startDate.setDate(today.getDate() - 6);
        break;
      case 'month':
        startDate.setDate(today.getDate() - 29);
        break;
    }
    
    const newFrom = startDate.toISOString().slice(0, 10);
    const newTo = today.toISOString().slice(0, 10);
    
    // Solo actualizar y cargar si las fechas han cambiado o es la primera vez
    if (this.from !== newFrom || this.to !== newTo) {
      this.from = newFrom;
      this.to = newTo;
      
      // Solo cargar si ya hemos pasado por ngAfterViewInit
      if (this.canvas && this.canvas.nativeElement) {
        this.load();
      }
    }
  }

  onDateChange() {
    // Validar que la fecha 'from' no sea posterior a 'to'
    if (this.from && this.to && new Date(this.from) > new Date(this.to)) {
      const temp = this.from;
      this.from = this.to;
      this.to = temp;
    }
  }

  load() {
    if (!this.from || !this.to) {
      return;
    }

    this.isLoading = true;
    this.hasData = false;

    this.visitService.getDailyStats(this.from, this.to)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.processData(data);
        },
        error: (error) => {
          console.error('Error al cargar estadísticas:', error);
          this.hasData = false;
          this.stats = null;
        }
      });
  }

  private processData(data: {[key: string]: number}) {
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    this.hasData = values.length > 0 && values.some(v => v > 0);
    
    if (this.hasData) {
      this.calculateStats(values);
      this.updateChart(labels, values);
    } else {
      this.stats = null;
      if (this.chart) {
        this.chart.destroy();
        this.chart = undefined;
      }
    }
  }

  private calculateStats(values: number[]) {
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const peak = Math.max(...values);
    
    this.stats = { total, average, peak };
  }

  private updateChart(labels: string[], values: number[]) {
    if (this.chart && this.canvas && this.canvas.nativeElement) {
      this.chart.data.labels = labels.map(label => this.formatDate(label));
      this.chart.data.datasets![0].data = values;
      this.chart.update();
    } else {
      this.createChart(labels, values);
    }
  }

  private createChart(labels: string[], values: number[]) {
    // Verificar que el canvas esté disponible
    if (!this.canvas || !this.canvas.nativeElement) {
      console.error('❌ Canvas no está disponible para crear el gráfico');
      return;
    }

    console.log('✅ Creando gráfico con canvas disponible');

    // Calcular tamaños dinámicos basados en la cantidad de datos
    const pointRadius = this.calculatePointRadius(labels.length);
    const pointHoverRadius = pointRadius + 2;

    const config: any = {
      type: 'line',
      data: {
        labels: labels.map(label => this.formatDate(label)),
        datasets: [{
          label: 'Visitas Diarias',
          data: values,
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.1)',
          borderWidth: 3,
          fill: true,
          lineTension: 0.4, // En Chart.js v2 se usa lineTension en lugar de tension
          pointBackgroundColor: '#3f51b5',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: pointRadius,
          pointHoverRadius: pointHoverRadius,
          pointHoverBackgroundColor: '#303f9f',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        hover: {
          intersect: false,
          mode: 'index'
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            fontSize: 14,
            fontStyle: 'bold'
          }
        },
        tooltips: { // En Chart.js v2 se usa tooltips en lugar de tooltip
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFontColor: '#ffffff',
          bodyFontColor: '#ffffff',
          borderColor: '#3f51b5',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: function(tooltipItem: any, data: any) {
              return `Fecha: ${tooltipItem[0].xLabel}`;
            },
            label: function(tooltipItem: any, data: any) {
              const value = tooltipItem.yLabel;
              // Mostrar el número completo en el tooltip con formato de miles
              const formattedValue = value.toLocaleString('es-ES');
              return `Visitas: ${formattedValue}`;
            }
          }
        },
        scales: {
          xAxes: [{ // En Chart.js v2 se usa xAxes/yAxes en lugar de x/y
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Fecha',
              fontSize: 14,
              fontStyle: 'bold'
            },
            gridLines: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              fontSize: 12,
              maxTicksLimit: this.calculateMaxTicks(labels.length),
              autoSkip: true,
              maxRotation: 45,
              minRotation: 0
            }
          }],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Número de Visitas',
              fontSize: 14,
              fontStyle: 'bold'
            },
            gridLines: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              beginAtZero: true,
              stepSize: this.calculateStepSize(values),
              fontSize: 12,
              maxTicksLimit: 8,
              callback: function(value: any) {
                // Formatear números grandes de manera más legible
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(1) + 'K';
                }
                return value;
              }
            }
          }]
        },
        elements: {
          point: {
            hoverRadius: 8
          }
        }
      }
    };

    this.chart = new Chart(this.canvas.nativeElement, config);
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    });
  }

  private calculateMaxTicks(dataLength: number): number {
    // Limitar el número de etiquetas en el eje X según la cantidad de datos
    if (dataLength <= 7) {
      return dataLength; // Mostrar todas para datos pequeños
    } else if (dataLength <= 30) {
      return Math.ceil(dataLength / 2); // Mostrar la mitad para datos medianos
    } else {
      return Math.ceil(dataLength / 4); // Mostrar un cuarto para datos grandes
    }
  }

  private calculateStepSize(values: number[]): number {
    const maxValue = Math.max(...values);
    
    // Calcular step size dinámico basado en el valor máximo
    if (maxValue <= 10) {
      return 1;
    } else if (maxValue <= 50) {
      return 5;
    } else if (maxValue <= 100) {
      return 10;
    } else if (maxValue <= 500) {
      return 25;
    } else if (maxValue <= 1000) {
      return 50;
    } else if (maxValue <= 5000) {
      return 250;
    } else if (maxValue <= 10000) {
      return 500;
    } else {
      return Math.ceil(maxValue / 10); // Para valores muy grandes
    }
  }

  private calculatePointRadius(dataLength: number): number {
    // Ajustar el tamaño de los puntos según la cantidad de datos
    if (dataLength <= 7) {
      return 6; // Puntos grandes para pocos datos
    } else if (dataLength <= 15) {
      return 5; // Puntos medianos
    } else if (dataLength <= 30) {
      return 4; // Puntos más pequeños
    } else {
      return 3; // Puntos pequeños para muchos datos
    }
  }
}