import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PromotorVentasModalComponent } from './promotor-ventas-modal/promotor-ventas-modal.component';
import { UserData } from '../../@core/interfaces/users';
import { PaymentData, updatePagar } from '../../@core/interfaces/payments';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { PdfReportService, ReportData } from '../../@core/services/pdf-report.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatButton } from '@angular/material/button';
import { MatPaginator } from '@angular/material/paginator';
import { MatIcon } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'ngx-promotores',
    templateUrl: './promotores.component.html',
    styleUrls: ['./promotores.component.scss'],
    standalone: true,
    imports: [MatProgressSpinner, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatButton, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatPaginator, MatIcon, CurrencyPipe]
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

  ventasPromotor: any | null = null;
  totalPagado: number;
  totalDeuda: number;
  displayedColumns: string[] = ['nombre', 'email', 'telefono', 'cuponCode', 'descuento', 'abono', 'recaudado', 'ventas'];
  ventasDisplayedColumns: string[] = ['descripcion', 'monto', 'pagado'];

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public userService: UserData,
    public paymentsService: PaymentData,
    private breakpointObserver: BreakpointObserver,
    private pdfReportService: PdfReportService
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
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
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

  async pagar(promotor: any): Promise<void> {
    try {
      // Mostrar mensaje de generación de reporte
      this.snackBar.open('Generando reporte de pago...', '', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      // Generar reporte PDF antes del pago
      await this.generarReportePago(promotor);

      // Proceder con el pago
      const data: updatePagar = {
        id: promotor.idPromotor,
        totalPagar: this.totalDeuda
      };
      
      this.paymentsService.updatePagar(data).subscribe(
        (response) => {
          this.snackBar.open('¡Pago realizado exitosamente! Reporte descargado.', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
          this.dialog.closeAll();
        },
        (error) => {
          console.error('Error realizando el pago:', error);
          this.snackBar.open('Error al procesar el pago, pero el reporte se generó correctamente', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      );

    } catch (error) {
      console.error('Error generando reporte:', error);
      this.snackBar.open('Error al generar el reporte. Intenta nuevamente.', 'Cerrar', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  private async generarReportePago(promotor: any): Promise<void> {
    // Preparar datos para el reporte
    const reportData: ReportData = {
      promotor: promotor,
      ventas: this.ventasPromotor?.ventas || [],
      totalPagado: this.ventasPromotor?.totalRecaudado || 0,
      totalDeuda: this.totalDeuda,
      fechaReporte: new Date(),
      fechasVentas: this.obtenerFechasVentas(this.ventasPromotor?.ventas || []),
      paymentId: this.generarPaymentId()
    };

    // Generar y descargar el PDF
    await this.pdfReportService.generarReportePago(reportData);
  }

  private obtenerFechasVentas(ventas: any[]): Date[] {
    // Usar las fechas reales de las ventas si están disponibles
    return ventas.map(venta => {
      if (venta.paymentDate) {
        return new Date(venta.paymentDate);
      }
      // Si no hay fecha, usar la fecha actual como fallback
      return new Date();
    });
  }

  private generarPaymentId(): string {
    // Generar un ID único para el pago
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PAY-${timestamp}-${random}`;
  }
}