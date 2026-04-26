import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { VisitService } from '../../@core/backend/services/visit.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DecimalPipe } from '@angular/common';

interface VisitStats {
  total: number;
  average: number;
  peak: number;
}

@Component({
    selector: 'ngx-visits-chart',
    templateUrl: './visits-chart.component.html',
    styleUrls: ['./visits-chart.component.scss'],
    standalone: true,
    imports: [MatIcon, MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatFormField, MatLabel, MatInput, FormsModule, MatSuffix, MatButton, MatProgressSpinner, NgApexchartsModule, DecimalPipe]
})
export class VisitsChartComponent implements OnInit, OnDestroy {
  private visitService = inject(VisitService);

  chartOptions: any;
  from: string = '';
  to: string = '';
  isLoading: boolean = false;
  hasData: boolean = false;
  stats: VisitStats | null = null;
  
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Solo inicializar fechas aquí
    this.setQuickRange('week');
  }

  // Eliminado ngAfterViewInit y lógica canvas

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setQuickRange(range: 'week' | 'month') {
    const today = new Date();
    // Asegurar que usamos la fecha local, no UTC
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDate = new Date(todayLocal);
    
    switch (range) {
      case 'week':
        startDate.setDate(todayLocal.getDate() - 6);
        break;
      case 'month':
        startDate.setDate(todayLocal.getDate() - 29);
        break;
    }
    
    // Formatear fechas en zona horaria local
    const newFrom = this.formatDateForAPI(startDate);
    const newTo = this.formatDateForAPI(todayLocal);
    
    
    // Solo actualizar y cargar si las fechas han cambiado o es la primera vez
    if (this.from !== newFrom || this.to !== newTo) {
      this.from = newFrom;
      this.to = newTo;
      
      // Cargar datos directamente
      this.load();
    }
  }

  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    }
  }

  private calculateStats(values: number[]) {
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const peak = Math.max(...values);
    
    this.stats = { total, average, peak };
  }

  private updateChart(labels: string[], values: number[]) {
    this.chartOptions = {
      series: [{
        name: 'Visitas Diarias',
        data: values
      }],
      chart: {
        type: 'line',
        height: 350
      },
      title: {
        text: 'Visitas Diarias',
        align: 'center',
        style: {
          fontSize: '16px',
          color: '#3f51b5'
        }
      },
      xaxis: {
        categories: labels.map(label => this.formatDate(label)),
        labels: {
          rotate: -45,
          style: {
            fontSize: '12px',
            colors: '#333'
          }
        },
        title: {
          text: 'Fecha',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        }
      },
      yaxis: {
        min: 0,
        labels: {
          style: {
            fontSize: '12px',
            colors: '#333'
          },
          formatter: function(value: number) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value;
          }
        },
        title: {
          text: 'Número de Visitas',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      markers: {
        size: 5,
        colors: ['#3f51b5'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
          size: 8
        }
      },
      dataLabels: {
        enabled: true
      },
      tooltip: {
        enabled: true,
        x: {
          format: 'dd/MM/yy'
        },
        y: {
          formatter: function(value: number) {
            return value.toLocaleString('es-ES');
          }
        }
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      }
    };
  }

  private formatDate(dateString: string): string {
    // Evitar problemas de zona horaria parseando la fecha manualmente
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day); // month - 1 porque Date usa índices base 0 para meses
    
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