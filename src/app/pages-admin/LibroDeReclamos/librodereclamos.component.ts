import { Component, OnInit, ViewChild, TemplateRef, ElementRef, HostListener, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { ReclamationService } from '../../@core/backend/services/reclamation.service';
import { MatPaginator } from '@angular/material/paginator';
import { NbToastrService, NbSpinnerModule } from '@nebular/theme';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'ngx-librodereclamos',
    templateUrl: './librodereclamos.component.html',
    styleUrls: ['./librodereclamos.component.scss'],
    standalone: true,
    imports: [
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatButton,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        MatPaginator,
        FormsModule,
        NbSpinnerModule,
        DatePipe,
    ],
})
export class LibrodereclamosComponent implements OnInit {
  private dialog = inject(MatDialog);
  private reclamationService = inject(ReclamationService);
  private toastrService = inject(NbToastrService);

  displayedColumns: string[] = [
    'name',
    'email',
    'reclaimDate',
    'reclaimCapture',
    'respuestaDate',
    'responseCapture',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]); // Fuente de datos para la tabla
  selectedReclaim: any = null;
  responseText: string = '';
  isModalOpen = false; // Añadir esta propiedad
  isLoading = false; 
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 6;
  isMobileView: boolean = false; 

  @ViewChild('replyModal') replyModal!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  getResponseLength(): number {
    return this.responseText ? this.responseText.length : 0;
  }

  ngOnInit() {
    this.loadReclaims(this.currentPage, this.pageSize); // Cargar los reclamos
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth <= 1000;
  }

  // Función que carga los reclamos de ejemplo
  loadReclaims(page: number, size: number) {
    this.reclamationService.getReclamaciones(page, size).subscribe(response => {
      if (response.result) {       
        this.dataSource.data = response.data;
        this.totalItems = response.pagination.cantidadDeDocumentos;
        this.paginator.length = this.totalItems;
      this.paginator.pageIndex = response.pagination.paginaActual - 1;      
      }
    });
  }

  openModal(reclaim: any) {
    this.selectedReclaim = reclaim;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  submitResponse() {
    if (this.selectedReclaim && this.responseText) {
      this.isLoading = true;
      const mensajeJson = JSON.stringify({ mensaje: this.responseText });
      this.reclamationService.updateReclamation(this.selectedReclaim.id, mensajeJson).subscribe(response => {
        this.isLoading = false;
        if (response.result) {
          this.toastrService.success(
            `La respuesta fue enviada exitosamente al correo ${this.selectedReclaim.email}`, 
            'Respuesta Enviada'
          );
          this.loadReclaims(this.currentPage, this.pageSize);
          this.responseText = ''; // Limpiar el textarea
          this.closeModal();
        } else {
          this.toastrService.warning('No se pudo procesar la respuesta', 'Error');
          console.error('Error al enviar la respuesta');
        }
      }, error => {
        this.isLoading = false;
        this.toastrService.danger(
          error.error?.message || 'Ocurrió un error al enviar la respuesta. Por favor, verifica los logs del servidor.',
          'Error al enviar'
        );
        console.error('Error al enviar la respuesta', error);
      });
      
    } else {
      this.toastrService.warning('Debe escribir una respuesta antes de enviar', 'Campo requerido');
      console.error('Reclamación seleccionada o texto de respuesta no válido');
    }
  }

  onReplyReclaim(reclaim: any) {
    this.openModal(reclaim);
  }

  openPDF(url: string) {
    window.open(url, '_blank');
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadReclaims(this.currentPage, this.pageSize);
  }
}
