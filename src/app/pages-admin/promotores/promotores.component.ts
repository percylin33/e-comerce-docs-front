import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
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
  @ViewChild(MatPaginator) paginator: MatPaginator;

  promotores = [];
  ventas = [];
  isSmallScreen: boolean = false;

  // Paginación - Similar a DashboardDocument
  currentPage: number = 1;
  pageSize: number = 6; // Cambiado a 20 para coincidir con tu payload
  totalItems: number = 0;
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

    this.loadPromotores(this.currentPage, this.pageSize);
  }

  loadPromotores(currentPage: number, pageSize: number): void {
    this.isLoading = true;
    console.log('Calling getPromotores with:', { currentPage, pageSize });

    this.userService.getPromotores(currentPage, pageSize).subscribe(
      (response) => {
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        console.log('Response pagination:', response.pagination);
        
        this.promotores = response.data;
        this.totalItems = response.pagination.cantidadDeDocumentos;
        this.isLoading = false;
        
        // Debug: verificar los valores
        console.log('Promotores loaded:', {
          promotores: this.promotores.length,
          totalItems: this.totalItems,
          currentPage: this.currentPage,
          pageSize: this.pageSize,
          pagination: response.pagination
        });
        
        // Sincronizar con el paginator si existe
        if (this.paginator) {
          this.paginator.length = this.totalItems;
          this.paginator.pageIndex = response.pagination.paginaActual - 1;
        }
      },
      (error) => {
        console.error('Error fetching promotores:', error);
        this.isLoading = false;
      }
    );
  }

  // Método similar al de DashboardDocument
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadPromotores(this.currentPage, this.pageSize);
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