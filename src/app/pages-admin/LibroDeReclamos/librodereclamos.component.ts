import { Component, OnInit, ViewChild, TemplateRef, ElementRef, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ReclamationService } from '../../@core/backend/services/reclamation.service';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'ngx-librodereclamos',
  templateUrl: './librodereclamos.component.html',
  styleUrls: ['./librodereclamos.component.scss'],
})
export class LibrodereclamosComponent implements OnInit {
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

  constructor(private dialog: MatDialog, private reclamationService: ReclamationService) {}

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
          this.loadReclaims(this.currentPage, this.pageSize);
          this.closeModal();
        } else {
          console.error('Error al enviar la respuesta');
        }
      }, error => {
        this.isLoading = false;
        console.error('Error al enviar la respuesta', error);
      });
      
    } else {
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
