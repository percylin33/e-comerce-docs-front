import { Component, Input, OnChanges } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
    selector: 'ngx-dynamic-chart',
    templateUrl: './dynamic-chart.component.html',
    styleUrls: ['./dynamic-chart.component.scss'],
    standalone: true,
    imports: [NgApexchartsModule]
})
export class DynamicChartComponent implements OnChanges {
  @Input() title = '';
  @Input() data: number[] = [];
  @Input() labels: string[] = [];

  chartOptions: any;

  // Provide a safe options object to avoid runtime errors in chart library
  get safeChartOptions(): any {
    const defaultYAxis = { min: 0, max: 1, labels: { style: { fontSize: '12px', colors: '#333' } } };
    return this.chartOptions || {
      series: [{ name: this.title, data: this.data || [] }],
      chart: { type: 'bar', height: 350 },
      xaxis: { categories: this.labels || [] },
      yaxis: defaultYAxis,
      title: { text: this.title || '' }
    };
  }

  ngOnChanges(): void {
    const maxValue = Math.max(...this.data);
    const yAxisMax = Math.ceil(maxValue * 1.2);
    this.chartOptions = {
      series: [{
        name: this.title,
        data: this.data
      }],
      chart: {
        type: 'bar',
        height: 350
      },
      title: {
        text: this.title,
        align: 'center',
        style: {
          fontSize: '16px',
          color: '#333'
        }
      },
      xaxis: {
        categories: this.labels,
        labels: {
          rotate: -45,
          style: {
            fontSize: window.innerWidth <= 768 ? '10px' : '12px',
            colors: '#333'
          },
          formatter: function(value: string) {
            const maxLength = window.innerWidth <= 768 ? 8 : 15;
            return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
          }
        }
      },
      yaxis: {
        min: 0,
        max: yAxisMax,
        labels: {
          style: {
            fontSize: window.innerWidth <= 768 ? '10px' : '12px',
            colors: '#333'
          }
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          columnWidth: window.innerWidth <= 768 ? '40%' : '60%'
        }
      },
      dataLabels: {
        enabled: true
      },
      tooltip: {
        enabled: true
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      }
    };
  }
}
