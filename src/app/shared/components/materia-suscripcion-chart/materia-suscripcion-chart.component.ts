import { Component, Input, OnChanges } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle } from 'ng-apexcharts';

@Component({
  selector: 'ngx-materia-suscripcion-chart',
  templateUrl: './materia-suscripcion-chart.component.html',
  styleUrls: ['./materia-suscripcion-chart.component.scss']
})
export class MateriaSuscripcionChartComponent implements OnChanges {
  @Input() data: any[] = [];
  public chartOptions: any = {};
  public sortByAmount = true;

  ngOnChanges() {

    const series = this.sortByAmount
      ? [{ name: 'Monto', data: this.data.map(item => item.montoTotal || item.monto || item.amount || 0) }]
      : [{ name: 'Cantidad', data: this.data.map(item => item.cantidad || item.count || 0) }];

    this.chartOptions = {
      // ... (existing options omitted, just rebuilding object with new categories)
      chart: { type: 'bar', height: 350 },
      plotOptions: {
        bar: {
          horizontal: true
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          if (this.sortByAmount) {
            return 'S/. ' + val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else {
            return val + ' ventas';
          }
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            if (this.sortByAmount) {
              return 'S/. ' + val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else {
              return val + ' ventas';
            }
          }
        }
      },
      series: series,
      xaxis: {
        categories: this.data.map(item => item.materiaSuscripcion || item.materia || item.name || ''),
        labels: { style: { fontSize: '12px' } }
      },
      title: { text: 'Ventas por Materia de Suscripción' }
    };
  }

  public toggleSortBy(): void {
    this.sortByAmount = !this.sortByAmount;
    this.ngOnChanges();
  }

  public getSortButtonText(): string {
    return this.sortByAmount ? 'Mostrar Cantidad' : 'Mostrar Monto';
  }
}
