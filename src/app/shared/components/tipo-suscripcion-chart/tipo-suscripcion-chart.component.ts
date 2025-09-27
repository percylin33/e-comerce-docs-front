import { Component, Input, OnChanges } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle } from 'ng-apexcharts';

@Component({
  selector: 'ngx-tipo-suscripcion-chart',
  templateUrl: './tipo-suscripcion-chart.component.html',
  styleUrls: ['./tipo-suscripcion-chart.component.scss']
})
export class TipoSuscripcionChartComponent implements OnChanges {
  @Input() data: any[] = [];
  public chartType: 'monto' | 'cantidad' = 'monto';

  public chartOptions: any = {
    series: [],
    chart: { type: 'donut', height: 350 },
    labels: [],
    title: { text: 'Ventas por Tipo de Suscripción' }
  };

  ngOnChanges() {
    this.updateChart();
  }

  updateChart() {
    let series;
    let title;
    if (this.chartType === 'monto') {
      series = this.data.map(item => item.montoTotal || item.monto || item.amount || 0);
      title = 'Ventas por Tipo de Suscripción (Monto)';
    } else {
      series = this.data.map(item => item.cantidad || 0);
      title = 'Ventas por Tipo de Suscripción (Cantidad)';
    }
    this.chartOptions = {
      ...this.chartOptions,
      chart: { type: 'donut', height: 350 },
      series,
      labels: this.data.map(item => {
        const nombre = item.tipoSuscripcion || item.tipo || item.name || '';
        const cantidad = item.cantidad || 0;
        return nombre.replace(/Membresía\s*/gi, '').trim() ;
      }),
      title: { text: title }
    };
  }

  toggleChartType() {
    this.chartType = this.chartType === 'monto' ? 'cantidad' : 'monto';
    this.updateChart();
  }
}
