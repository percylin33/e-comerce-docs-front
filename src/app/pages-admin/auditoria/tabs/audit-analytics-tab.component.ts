import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NbButtonModule, NbCardModule, NbIconModule, NbSpinnerModule, NbTooltipModule } from '@nebular/theme';
import { NgApexchartsModule, ApexAxisChartSeries, ApexNonAxisChartSeries } from 'ng-apexcharts';
import {
  AuditApiService,
  AuditSummary,
  ReconciliationApiService,
  WebhookHealth,
} from '../../../@core/backend/services/audit.service';
import { AuditLabelPipe } from '../audit-label.pipe';
import { translateCategory, translateSeverity } from '../audit-labels';

@Component({
  selector: 'ngx-audit-analytics-tab',
  standalone: true,
  templateUrl: './audit-analytics-tab.component.html',
  styleUrls: ['./audit-analytics-tab.component.scss'],
  imports: [
    CommonModule,
    NbCardModule,
    NbIconModule,
    NbSpinnerModule,
    NbTooltipModule,
    NbButtonModule,
    NgApexchartsModule,
    DecimalPipe,
    DatePipe,
    AuditLabelPipe,
  ],
})
export class AuditAnalyticsTabComponent implements OnInit, OnDestroy {
  private api = inject(AuditApiService);
  private reconcileApi = inject(ReconciliationApiService);
  loading = true;
  summary: AuditSummary | null = null;

  // ===== MVP Conciliación: card "Salud del webhook" =====
  webhookHealth: WebhookHealth | null = null;
  webhookHealthLoading = false;
  /** Handle del setInterval para limpiar en ngOnDestroy. */
  private healthRefreshHandle: any = null;

  hourlyChart: { series: ApexAxisChartSeries; xaxis: any; chart: any; stroke: any; dataLabels: any; colors: string[]; fill: any; grid: any; tooltip: any } = {
    series: [{ name: 'Eventos', data: [] }],
    xaxis: {
      categories: [],
      labels: { style: { fontFamily: 'Open Sans, sans-serif', colors: '#64748b', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    chart: {
      type: 'area',
      height: 260,
      toolbar: { show: false },
      fontFamily: 'Open Sans, sans-serif',
      sparkline: { enabled: false },
    },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    colors: ['#0c52d4'],
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
    },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 3 },
    tooltip: { theme: 'light' },
  };

  categoryDonut: { series: ApexNonAxisChartSeries; labels: string[]; chart: any; legend: any; colors: string[]; plotOptions: any; dataLabels: any; stroke: any } = {
    series: [],
    labels: [],
    chart: { type: 'donut', height: 280, fontFamily: 'Open Sans, sans-serif' },
    legend: { position: 'bottom', fontSize: '12px' },
    colors: ['#0c52d4', '#3d74e6', '#4db1f0', '#f5c044', '#f59e0b', '#00897b', '#dc3545', '#64748b'],
    plotOptions: { pie: { donut: { size: '65%' } } },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ['#ffffff'] },
  };

  severityDonut: { series: ApexNonAxisChartSeries; labels: string[]; chart: any; legend: any; colors: string[]; plotOptions: any; dataLabels: any; stroke: any } = {
    series: [],
    labels: [],
    chart: { type: 'donut', height: 280, fontFamily: 'Open Sans, sans-serif' },
    legend: { position: 'bottom', fontSize: '12px' },
    colors: ['#0c52d4', '#f59e0b', '#dc3545', '#b91c1c'],
    plotOptions: { pie: { donut: { size: '65%' } } },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ['#ffffff'] },
  };

  ngOnInit(): void {
    this.api.getSummary().subscribe({
      next: data => {
        this.summary = data;
        this.populateCharts(data);
        this.loading = false;
        // ApexCharts cachea las dimensiones que midio al montar. Si el
        // contenedor estaba oculto / con ancho 0 (caso clasico dentro de
        // nb-tabset), los charts quedan invisibles hasta que el listener
        // interno de window:resize se dispara. Forzamos una corrida a
        // proposito para que re-midan el contenedor real.
        this.kickResize();
      },
      error: () => (this.loading = false),
    });

    this.refreshWebhookHealth();
    // Refresh cada 60s mientras la tab está activa. NbTabset no la
    // desmonta cuando se cambia de tab (lazy=false por default), así que
    // dejamos el timer ligero corriendo siempre y limpiamos en ngOnDestroy.
    this.healthRefreshHandle = setInterval(() => this.refreshWebhookHealth(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.healthRefreshHandle) {
      clearInterval(this.healthRefreshHandle);
      this.healthRefreshHandle = null;
    }
  }

  refreshWebhookHealth(): void {
    this.webhookHealthLoading = true;
    this.reconcileApi.webhookHealth(24).subscribe({
      next: env => {
        this.webhookHealth = env?.data || null;
        this.webhookHealthLoading = false;
      },
      error: () => {
        this.webhookHealthLoading = false;
      },
    });
  }

  /**
   * True si hay al menos un webhook con error o firma inválida en las 24h.
   * El template lo usa para colorear la card y mostrar warning.
   */
  webhookHealthAlert(): boolean {
    if (!this.webhookHealth || !this.webhookHealth.available) return false;
    return (this.webhookHealth.failed || 0) > 0
        || (this.webhookHealth.invalidSignature || 0) > 0;
  }

  private populateCharts(s: AuditSummary): void {
    this.hourlyChart = {
      ...this.hourlyChart,
      series: [{ name: 'Eventos', data: (s.hourlyHistogram || []).map(p => p.count) }],
      xaxis: {
        ...this.hourlyChart.xaxis,
        categories: (s.hourlyHistogram || []).map(p => p.bucket.slice(5)),
      },
    };

    const catKeys = Object.keys(s.byCategory || {});
    this.categoryDonut = {
      ...this.categoryDonut,
      labels: catKeys.map(k => translateCategory(k)),
      series: catKeys.map(k => s.byCategory[k]),
    };

    const sevOrder = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const sevKeys = sevOrder.filter(k => (s.bySeverity || {})[k] !== undefined);
    this.severityDonut = {
      ...this.severityDonut,
      labels: sevKeys.map(k => translateSeverity(k)),
      series: sevKeys.map(k => s.bySeverity[k]),
    };
  }

  /**
   * Dispara dos eventos resize escalonados (next frame y +250ms) para cubrir
   * tanto el primer paint despues de cargar la data como un eventual cambio
   * de tab posterior. Es el patron recomendado por la propia documentacion
   * de ApexCharts cuando el chart vive dentro de tabs/accordions/dialogs.
   */
  private kickResize(): void {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
  }
}
