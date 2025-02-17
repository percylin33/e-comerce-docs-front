import { Component, Input, OnChanges } from '@angular/core';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'ngx-dynamic-chart',
  templateUrl: './dynamic-chart.component.html',
  styleUrls: ['./dynamic-chart.component.scss']
})
export class DynamicChartComponent implements OnChanges {
  @Input() title = '';
  @Input() data: number[] = [];
  @Input() labels: string[] = [];

  chartOptions!: EChartsOption;

  ngOnChanges(): void {
    const maxValue = Math.max(...this.data);
    const yAxisMax = Math.ceil(maxValue * 1.2);

    this.chartOptions = {
      title: {
        text: this.title,
        textStyle: {
          color: '#333',
          fontSize: 16,
          fontWeight: 'normal',
          overflow: 'truncate', // Trunca el texto si es muy largo
          width: '90%' // Limita el ancho del título
        },
        left: 'center', // Centra el título
        top: 10,
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} ventas',
        confine: true // Mantiene el tooltip dentro del contenedor
      },
      grid: {
        top: 30,      // Aumentamos el espacio superior
        left: '10%',   // Aumentamos el margen izquierdo
        right: '5%',
        bottom: '15%', // Aumentamos el espacio inferior para las etiquetas rotadas
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: this.labels,
        axisLabel: {
          interval: 0, // Muestra todas las etiquetas
          rotate: 45, // Rota las etiquetas
          formatter: (value: string) => {
            const maxLength = window.innerWidth <= 768 ? 8 : 15; // Reducimos más en móviles
            if (value.length > maxLength) {
              return value.substring(0, maxLength) + '...';
            }
            return value;
          },
          overflow: 'truncate', // Permite saltos de línea
          width: window.innerWidth <= 768 ? 60 : 120, // Reducimos el ancho en móviles
          hideOverlap: true,
          align: 'right',      // Alineación del texto
          verticalAlign: 'top' // Alineación vertical
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        min: 0,
        max: yAxisMax,
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      series: [{
        type: 'bar',
        data: this.data,
        barWidth: window.innerWidth <= 768 ? '40%' : '60%', // Barras más delgadas en móviles
        itemStyle: {
          color: '#0C52D4',
          opacity: 0.8
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: window.innerWidth <= 768 ? 10 : 12 // Texto más pequeño en móviles
        }
      }]
    };
  }
}
