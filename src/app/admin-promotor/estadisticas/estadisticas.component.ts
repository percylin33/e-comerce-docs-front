import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../@auth/components/shared.service';
import { CuponService } from '../../@core/backend/services/cupon.service';
import { EmbajadorService } from '../../@core/backend/services/embajador.service';
import { GraficosPromotor, DocumentPaymentGraphic, PaymentPorMes } from '../../@core/interfaces/embajador';
import { MetricItem, MetricsCardComponent } from '../components/metrics-card/metrics-card.component';
import { ObjectivesApi } from '../../@core/backend/api/objectives.api';
import { Objective, ObjectiveTarget } from '../../@core/interfaces/objectives';
import { PromotorHeaderActionsComponent } from '../../@theme/components/promotor-header-actions/promotor-header-actions.component';
import { InsightCardComponent } from '../components/insight-card/insight-card.component';
import { SimpleFooterComponent } from '../../@theme/components/simple-footer/simple-footer.component';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'ngx-estadisticas',
    templateUrl: './estadisticas.component.html',
    styleUrls: ['./estadisticas.component.scss'],
    standalone: true,
    imports: [PromotorHeaderActionsComponent, MetricsCardComponent, InsightCardComponent, SimpleFooterComponent, DecimalPipe]
})
export class EstadisticasComponent implements OnInit {
  loading = true;
  
  // Estadísticas principales
  totalRecaudado = 0;
  totalPorCobrar = 0;
  ventasRealizadas = 0;
  tasaConversion = 'Medio';
  
  // Usuario
  currentUser: any;
  userName = '';
  userInitials = '';
  
  // Datos para gráficos
  documentosVendidos: DocumentPaymentGraphic[] = [];
  ventasPorMes: PaymentPorMes[] = [];
  
  // Info del cupón
  descuentoCupon = 0;
  comisionCupon = 0;
  
  // Métricas para el card
  metricsData: MetricItem[] = [];
  
  // Objetivos
  objectives: Objective[] = [];
  currentObjective: Objective | null = null;
  generalObjectives: Objective[] = [];
  personalObjectives: Objective[] = [];
  
  // Período seleccionado para el gráfico
  selectedPeriod: 'today' | '7d' | '30d' | 'month' = '30d';
  chartInstance: any = null;
  
  constructor(
    private sharedService: SharedService,
    private cuponService: CuponService,
    private embajadorService: EmbajadorService,
    private objectivesApi: ObjectivesApi
  ) { }

  ngOnInit(): void {
    this.currentUser = this.sharedService.getCurrentUser();
    if (this.currentUser) {
      this.userName = `${this.currentUser.name || ''} ${this.currentUser.lastname || ''}`.trim();
      this.userInitials = this.getInitials(this.userName);
      this.loadData();
    }
  }
  
  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  private loadData(): void {
    this.loading = true;
    const userId = this.currentUser.id;
    
    // Cargar objetivos del promotor
    this.loadObjectives(userId);
    
    // Cargar información del cupón
    this.cuponService.getCupont(userId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.descuentoCupon = response.data.descuento || 0;
          this.comisionCupon = response.data.abono || 0;
        }
      },
      error: (err) => {
        console.error('Error al cargar cupón:', err);
      }
    });
    
    // Cargar gráficos/estadísticas
    this.embajadorService.getGraficos(userId.toString()).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.totalRecaudado = response.data.totalRecaudado || 0;
          this.totalPorCobrar = response.data.totalPorCobrar || 0;
          this.ventasRealizadas = response.data.ventas || 0;
          this.documentosVendidos = response.data.dataDocument || [];
          this.ventasPorMes = response.data.dataPayment || [];
          
          // Calcular tasa de conversión (puedes ajustar esta lógica)
          this.calcularTasaConversion();
          
          // Actualizar métricas
          this.updateMetrics();
          
          // Inicializar gráficos después de cargar los datos
          this.initializeCharts();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
        this.loading = false;
      }
    });
  }
  
  private loadObjectives(userId: number): void {
    this.objectivesApi.getObjectivesForPromotor(userId).subscribe({
      next: (response: any) => {
        
        // El backend devuelve directamente un array, no un objeto con result/data
        let objetivosData: any[] = [];
        
        if (Array.isArray(response)) {
          // Si response es directamente el array
          objetivosData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Si viene en formato {result: true, data: [...]}
          objetivosData = response.data;
        }
        
        
        if (objetivosData && objetivosData.length > 0) {
          // Filtrar solo objetivos generales (key = GENERAL_OBJECTIVE) 
          // y objetivos personalizados con key CUSTOM_OBJECTIVE asignados específicamente al usuario
          this.objectives = objetivosData.filter((obj: any) => 
            obj.key === 'GENERAL_OBJECTIVE' || 
            (obj.key === 'CUSTOM_OBJECTIVE' && obj.assignedTo !== null && obj.assignedTo === userId)
          );
          
          // Separar objetivos en categorías
          this.generalObjectives = this.objectives.filter(obj => obj.key === 'GENERAL_OBJECTIVE');
          this.personalObjectives = this.objectives.filter(obj => 
            obj.key === 'CUSTOM_OBJECTIVE' && obj.assignedTo !== null && obj.assignedTo === userId
          );
          
          // Priorizar objetivo personalizado CUSTOM_OBJECTIVE si existe
          this.currentObjective = this.personalObjectives[0] || this.generalObjectives[0] || null;
          
          
          
          // Actualizar métricas cuando tengamos los objetivos
          if (this.totalRecaudado > 0 || this.ventasRealizadas > 0) {
            this.updateMetrics();
          }
        } else {
          console.warn('No se encontraron objetivos o la estructura no es válida');
        }
      },
      error: (err) => {
        console.error('Error al cargar objetivos:', err);
      }
    });
  }
  
  private updateMetrics(): void {
    const minimoRetiro = 50;
    
    // Determinar objetivo dinámicamente desde los datos del backend
    let objetivoMes = 5; // valor por defecto
    let mensajeObjetivo = 'Objetivo del Mes';
    
    if (this.currentObjective) {
      try {
        const targetData: ObjectiveTarget = JSON.parse(this.currentObjective.target || '{}');
        if (targetData.value) {
          objetivoMes = targetData.value;
        }
        if (targetData.description) {
          mensajeObjetivo = targetData.description;
        }
      } catch (e) {
        console.error('Error parsing objective target:', e);
      }
    }
    
    const progresoRetiro = (this.totalPorCobrar / minimoRetiro) * 100;
    const progresoObjetivo = (this.ventasRealizadas / objetivoMes) * 100;
    
    this.metricsData = [
      { 
        iconClass: 'fas fa-shopping-cart metric-icon icon-sales', 
        label: 'Ventas (Últimos 30 días)', 
        value: this.ventasRealizadas.toString() 
      },
      { 
        iconClass: 'fas fa-hand-holding-usd metric-icon icon-revenue-dark', 
        label: 'Comisiones (Últimos 30 días)', 
        value: `S/ ${this.totalPorCobrar.toFixed(2)}` 
      },
      { 
        iconClass: 'fas fa-coins metric-icon icon-minimo', 
        label: 'Progreso al Próximo Retiro', 
        value: `S/ ${this.totalPorCobrar.toFixed(2)} / S/ ${minimoRetiro.toFixed(2)}`, 
        progressPercent: Math.min(progresoRetiro, 100), 
        progressColor: 'var(--primary-yellow)' 
      },
      { 
        iconClass: 'fas fa-bullseye metric-icon icon-objetivo', 
        label: mensajeObjetivo, 
        value: `${this.ventasRealizadas} / ${objetivoMes} Ventas`, 
        progressPercent: Math.min(progresoObjetivo, 100), 
        progressColor: 'var(--info)' 
      },
    ];
  }
  
  private calcularTasaConversion(): void {
    // Lógica simple de tasa de conversión basada en ventas
    if (this.ventasRealizadas >= 10) {
      this.tasaConversion = 'Alta';
    } else if (this.ventasRealizadas >= 5) {
      this.tasaConversion = 'Medio';
    } else {
      this.tasaConversion = 'Bajo';
    }
  }
  
  private initializeCharts(): void {
    // Cargar datos del gráfico según el período seleccionado
    this.loadSalesChartData(this.selectedPeriod);
  }
  
  private loadSalesChartData(period: string): void {
    const userId = this.currentUser?.id;
    if (!userId) {
      console.error('No se encontró userId');
      return;
    }
    
   
    
    this.embajadorService.getSalesChart(userId, period).subscribe({
      next: (response: any) => {
        
        
        if (response.result && response.data) {
          const chartData = response.data;
          
          // Esperar y crear el gráfico con los datos reales
          this.waitForChartAndCreate(0, chartData);
        } else {
          console.warn('⚠️ No hay datos disponibles, usando datos de ejemplo');
          this.waitForChartAndCreate();
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar datos del gráfico:', err);
        // En caso de error, usar datos de ejemplo
        this.waitForChartAndCreate();
      }
    });
  }
  
  private waitForChartAndCreate(attempts: number = 0, chartData?: any): void {
    if (typeof (window as any).Chart !== 'undefined') {
      // Chart.js está disponible, crear el gráfico
      setTimeout(() => {
        this.createSalesChart(chartData);
      }, 100);
    } else if (attempts < 10) {
      // Reintentar después de 200ms (máximo 10 intentos = 2 segundos)
      setTimeout(() => {
        this.waitForChartAndCreate(attempts + 1, chartData);
      }, 200);
    } else {
      console.error('Chart.js no se pudo cargar después de 2 segundos');
    }
  }
  
  private createSalesChart(chartData?: any): void {
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas #salesChart no encontrado');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas');
      return;
    }
    
    // Preparar datos para el gráfico
    let labels: string[] = [];
    let data: number[] = [];
    
    if (chartData && chartData.labels && chartData.data) {
      // Usar datos reales del backend
      labels = chartData.labels;
      data = chartData.data;
    } else {
      // Datos de ejemplo si no hay datos del backend
      switch (this.selectedPeriod) {
        case 'today':
          labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
          data = [0, 1, 2, 1, 3, 2];
          break;
        case '7d':
          labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
          data = [2, 3, 1, 4, 5, 6, 3];
          break;
        case '30d':
          labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
          data = [8, 12, 10, 15];
          break;
        case 'month':
          labels = ['Jun 2025', 'Jul 2025', 'Ago 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025'];
          data = [3, 7, 5, 12, 8, 15];
          break;
      }
    }
    
    
    // Crear el gráfico con Chart.js
    
    this.chartInstance = new (window as any).Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ventas',
          data: data,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#666'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#666',
              precision: 0
            }
          }
        }
      }
    });
  }
  
  changePeriod(period: 'today' | '7d' | '30d' | 'month'): void {
    this.selectedPeriod = period;
    
    // Destruir gráfico existente si existe
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    
    // Cargar datos del backend para el nuevo período
    this.loadSalesChartData(period);
  }
  
  getObjectiveDescription(): string {
    if (!this.currentObjective) return '';
    return this.getObjectiveDescriptionByObj(this.currentObjective);
  }
  
  getObjectiveDescriptionByObj(objective: Objective): string {
    if (!objective) return '';
    
    try {
      const targetData = JSON.parse(objective.target || '{}');
      
      // El target puede tener 'text' o 'value' dependiendo del tipo
      if (targetData.text) {
        // Si tiene 'text', es un objetivo personalizado, mostrar el texto directamente
        return targetData.text;
      }
      
      // Si tiene 'value', calcular ventas restantes
      const ventasNecesarias = (targetData.value || 5) - this.ventasRealizadas;
      const bonoComision = objective.commissionBonus || 15;
      
      if (ventasNecesarias > 0) {
        return `Alcanza <strong>${ventasNecesarias} ventas más</strong> este mes para desbloquear un bono especial del ${bonoComision}% de comisión.`;
      } else {
        return `¡Felicidades! Has alcanzado tu objetivo. Continúa así para mantener tu bono del ${bonoComision}%.`;
      }
    } catch (e) {
      console.error('Error parsing objective target:', e);
      return 'Alcanza tu objetivo de ventas este mes para desbloquear bonos especiales.';
    }
  }
}
