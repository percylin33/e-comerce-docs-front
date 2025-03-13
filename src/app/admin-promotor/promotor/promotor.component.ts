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
  
    ngOnInit(): void {
      const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      this.id = userData.id;
      console.log(this.id);
      
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

            const today = new Date();
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
