import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PromotorVentasModalComponent } from './promotor-ventas-modal/promotor-ventas-modal.component';
import { UserData } from '../../@core/interfaces/users';
import { PaymentData, updatePagar } from '../../@core/interfaces/payments';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'ngx-promotores',
  templateUrl: './promotores.component.html',
  styleUrls: ['./promotores.component.scss']
})
export class PromotoresComponent implements OnInit {
  promotores = [];
  ventas = [];
  isSmallScreen: boolean = false;

  // Propiedades de paginación
  currentPage: number = 1;
  pageSize: number = 6;
  totalElements: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;

  // ventas: any[] | null = null;
  ventasPromotor: any | null = null;
  totalPagado: number 
  totalDeuda: number 
  displayedColumns: string[] = ['nombre', 'email', 'telefono', 'cuponCode', 'descuento', 'abono', 'recaudado', 'ventas'];
  ventasDisplayedColumns: string[] = ['descripcion', 'monto', 'pagado'];

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public userService: UserData,
    public paymentsService: PaymentData,
    private breakpointObserver: BreakpointObserver,
  ) {}

  ngOnInit(): void {
    this.breakpointObserver.observe(['(max-width: 960px)']).subscribe(result => {
      this.isSmallScreen = result.matches;
    });

    this.loadPromotores();
  }

  loadPromotores(): void {
    this.isLoading = true;
    
    this.userService.getPromotores(this.currentPage, this.pageSize).subscribe(
      (response) => {
        this.promotores = response.data;
        this.totalElements = response.pagination.cantidadDeDocumentos;
        this.totalPages = response.pagination.cantidadDePaginas;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching promotores:', error);
        this.isLoading = false;
        this.snackBar.open('Error al cargar promotores', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      }
    );
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1; // Material Paginator usa índice base 0
    this.pageSize = event.pageSize;
    this.loadPromotores();
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