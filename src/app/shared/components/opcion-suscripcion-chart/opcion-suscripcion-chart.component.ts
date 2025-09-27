import { Component, Input, OnChanges } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle } from 'ng-apexcharts';

@Component({
  selector: 'ngx-opcion-suscripcion-chart',
  templateUrl: './opcion-suscripcion-chart.component.html',
  styleUrls: ['./opcion-suscripcion-chart.component.scss']
})
export class OpcionSuscripcionChartComponent implements OnChanges {
  @Input() data: any[] = [];

  public chartOptions: any = {
    series: [],
    chart: { type: 'bar', height: 350 },
    xaxis: { categories: [] },
    title: { text: 'Ventas por Opción de Suscripción' }
  };

  ngOnChanges() {
    this.chartOptions = {
      ...this.chartOptions,
      chart: { type: 'bar', height: 350 },
      series: [
        {
          name: 'Cantidad',
          data: this.data.map(item => item.cantidadVentas || item.cantidad || item.count || 0)
        }
      ],
      xaxis: {
        categories: this.data.map(item => item.nombreOpcion || item.opcion || item.name || '')
      },
      title: { text: 'Ventas por Opción de Suscripción' }
    };
  }
}
