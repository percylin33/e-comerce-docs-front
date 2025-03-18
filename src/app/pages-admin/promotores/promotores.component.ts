import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PromotorVentasModalComponent } from './promotor-ventas-modal/promotor-ventas-modal.component';
import { UserData } from '../../@core/interfaces/users';
import { PaymentData, updatePagar } from '../../@core/interfaces/payments';
import { MatSnackBar } from '@angular/material/snack-bar';
import {  NbToastrService } from '@nebular/theme';

@Component({
  selector: 'ngx-promotores',
  templateUrl: './promotores.component.html',
  styleUrls: ['./promotores.component.scss']
})
export class PromotoresComponent implements OnInit {
  promotores = [
  ];

  ventas = [];

  // ventas: any[] | null = null;
  ventasPromotor: any | null = null;
  totalPagado: number 
  totalDeuda: number 
  displayedColumns: string[] = ['nombre', 'email', 'telefono', 'recaudado', 'ventas'];
  ventasDisplayedColumns: string[] = ['descripcion', 'monto', 'pagado'];

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public userService: UserData,
    public paymentsService: PaymentData
  ) {}

  ngOnInit(): void {
    this.userService.getPromotores().subscribe(
      (response) => {
        this.promotores = response.data;
        console.log('Promotores:', this.promotores);
        
      },
      (error) => {
        console.error('Error fetching promotores:', error);
      }
    );
  }

  toggleVentas(promotor: any): void {
    this.paymentsService.getPaymentsPromotor(promotor.idPromotor).subscribe(
      (response) => {
        this.ventasPromotor = response.data;
        this.totalDeuda = this.ventasPromotor.totalDeuda;
        this.openVentasModal(promotor, this.ventasPromotor);     
      },
      (error) => {
        this.snackBar.open('Error el promotor no tiene nuevas ventas', 'Cerrar', {
          duration: 4000,               // Duración en milisegundos
          horizontalPosition: 'center', // 'start' | 'center' | 'end' | 'left' | 'right'
          verticalPosition: 'bottom',      // 'top' | 'bottom'
        });
        console.error('Error:', error);
      }
    );
  }

  openVentasModal(promotor: any, ventasData: any): void {
    const dialogRef = this.dialog.open(PromotorVentasModalComponent, {
      width: '80%',
      data: {
        promotor: promotor,
        ventas: ventasData.ventas,
        ventasDisplayedColumns: this.ventasDisplayedColumns,
        totalPagado: ventasData.totalRecaudado,
        totalDeuda: ventasData.totalDeuda,
        pagar: this.pagar.bind(this)
      }
    });
  }

  pagar(promotor: any): void {
    const data : updatePagar = {
      id: promotor.idPromotor,
      totalPagar: this.totalDeuda
    };
    
    // Lógica para realizar el pago
    this.paymentsService.updatePagar(data).subscribe(
      (response) => {
        this.snackBar.open('El pago al promotor fue exitoso', 'Cerrar', {
          duration: 4000,               // Duración en milisegundos
          horizontalPosition: 'center', // 'start' | 'center' | 'end' | 'left' | 'right'
          verticalPosition: 'bottom',      // 'top' | 'bottom'
        });
        this.dialog.closeAll();
      },
      (error) => {
        console.error('Error realizando el pago:', error);
        this.snackBar.open('Error al procesar la petición', 'Cerrar', {
          duration: 4000,               // Duración en milisegundos
          horizontalPosition: 'center', // 'start' | 'center' | 'end' | 'left' | 'right'
          verticalPosition: 'bottom',      // 'top' | 'bottom'
        });
      }
    );
  }
}