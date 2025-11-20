import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexFill,
  ChartComponent,
  ApexTooltip,
  ApexGrid
} from 'ng-apexcharts';

export type SalesChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  fill: ApexFill;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  selector: 'ngx-sales-trend-chart',
  templateUrl: './sales-trend-chart.component.html',
  styleUrls: ['./sales-trend-chart.component.scss']
})
export class SalesTrendChartComponent implements OnChanges {
  @ViewChild('chart') chart: ChartComponent;
  @Input() salesData: Array<{ month: string; salesCount: number }> = [];
  @Input() height: number = 300;
  @Input() type: 'area' | 'line' | 'bar' = 'area';

  public chartOptions: Partial<SalesChartOptions>;

  constructor() {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['salesData'] && this.salesData.length > 0) {
      this.updateChartData();
    }
  }

  private initChart(): void {
    this.chartOptions = {
      series: [
        {
          name: 'Ventas',
          data: []
        }
      ],
      chart: {
        height: this.height,
        type: this.type,
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        fontFamily: 'Roboto, Arial, sans-serif'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      colors: ['#1e1ecc'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: '#5f5f61',
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#5f5f61',
            fontSize: '12px'
          },
          formatter: (value) => Math.round(value).toString()
        }
      },
      grid: {
        borderColor: '#e6e7e8',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        y: {
          formatter: (value) => `${value} venta${value !== 1 ? 's' : ''}`
        },
        theme: 'light'
      },
      legend: {
        show: false
      },
      title: {
        text: undefined
      }
    };
  }

  private updateChartData(): void {
    const categories = this.salesData.map(item => item.month);
    const data = this.salesData.map(item => item.salesCount);

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Ventas',
          data: data
        }
      ],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: categories
      }
    };
  }
}
