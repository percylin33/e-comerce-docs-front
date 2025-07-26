import { Component, OnInit } from '@angular/core';
import { GraphicsData } from '../../@core/interfaces/graphics';
import { NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ngx-promotor',
  templateUrl: './promotor.component.html',
  styleUrls: ['./promotor.component.scss']
})
export class PromotorComponent implements OnInit {
  private destroy$ = new Subject<void>();
  
    id: string ;

    totalRecaudado: number = 0;
    totalPorCobrar: number = 0;
    ventas: number = 0;

    datapayment

    documentChartData: number[] = []; // Datos en duro para el gráfico
    documentChartLabels: string[] = []; // Etiquetas en duro para el gráfico

    monthlyChartData: number[] = [];
  monthlyChartLabels: string[] = [];
  
  
  constructor(
    private graphicsService: GraphicsData,
    private toastrService: NbToastrService
  ) {}

  // Método utilitario para obtener la fecha actual en la zona horaria de Lima, Perú
  private getTodayInLima(): Date {
    // Usar la API nativa para obtener la fecha en la zona horaria de Lima
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(part => part.type === 'year')!.value);
    const month = parseInt(parts.find(part => part.type === 'month')!.value) - 1; // Los meses en JS son 0-indexados
    const day = parseInt(parts.find(part => part.type === 'day')!.value);
    const hour = parseInt(parts.find(part => part.type === 'hour')!.value);
    const minute = parseInt(parts.find(part => part.type === 'minute')!.value);
    const second = parseInt(parts.find(part => part.type === 'second')!.value);
    
    return new Date(year, month, day, hour, minute, second);
  }

  // Método público para obtener la hora actual de Lima como string (para debugging)
  getCurrentLimaTime(): string {
    const limaTime = this.getTodayInLima();
    return limaTime.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }    ngOnInit(): void {
      const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      this.id = userData.id;
      
    }

      this.graphicsService.getGraphicsPromotor(this.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.totalRecaudado = res.data.totalRecaudado;
            this.totalPorCobrar = res.data.totalPorCobrar;
            this.ventas = res.data.ventas;
            
            this.documentChartData = res.data.dataDocument.map(item => item.salesCount);
            this.documentChartLabels = res.data.dataDocument.map(item => item.title);

            const today = this.getTodayInLima(); // Usar hora de Lima
            const months = [];
            const salesData = [];

            // Generar los últimos 5 meses
            for (let i = -2; i <= 2; i++) {
              const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
              const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
              months.push(monthYear);

              // Buscar si hay datos para este mes
              const monthData = res.data.dataPayment.find(
                item => item.month === (date.getMonth() + 1) && item.year === date.getFullYear()
              );

              // Si hay datos usar el valor, si no hay usar 0
              salesData.push(monthData ? monthData.salesCount : 0);
            }

            this.monthlyChartData = salesData;
            this.monthlyChartLabels = months;
            
          },
          error: () => {
            this.toastrService.danger('No se pudo cargar la información', 'Error');
          },
        });
    }
}
