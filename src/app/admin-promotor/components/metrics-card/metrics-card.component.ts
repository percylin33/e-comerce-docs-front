import { Component, Input, OnInit, HostListener } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

export interface MetricItem {
  iconClass?: string;
  label: string;
  value?: string;
  progressPercent?: number; // 0-100
  progressColor?: string;
}

@Component({
    selector: 'ngx-metrics-card',
    templateUrl: './metrics-card.component.html',
    styleUrls: ['./metrics-card.component.scss'],
    standalone: true,
    imports: [NgClass, NgStyle]
})
export class MetricsCardComponent implements OnInit {
  @Input() title = 'Métricas Clave';
  @Input() metrics: MetricItem[] | null = null;

  isMobile = false;

  ngOnInit(): void {
    this.checkScreenSize();
    
    if (!this.metrics) {
      // sensible defaults matching the current template
      this.metrics = [
        { iconClass: 'fas fa-shopping-cart metric-icon icon-sales', label: 'Ventas (Últimos 30 días)', value: '1' },
        { iconClass: 'fas fa-hand-holding-usd metric-icon icon-revenue-dark', label: 'Comisiones (Últimos 30 días)', value: 'S/ 2.70' },
        { iconClass: 'fas fa-coins metric-icon icon-minimo', label: 'Progreso al Próximo Retiro', value: 'S/ 2.70 / S/ 50.00', progressPercent: 5.4, progressColor: 'var(--primary-yellow)' },
        { iconClass: 'fas fa-bullseye metric-icon icon-objetivo', label: 'Objetivo del Mes', value: '1 / 5 Ventas', progressPercent: 20, progressColor: 'var(--info)' },
      ];
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 575;
  }
}
