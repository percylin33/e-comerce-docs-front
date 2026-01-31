import { Component, OnInit } from '@angular/core';
import { TokenData } from '../../@core/interfaces/token';
import { PaymentService } from '../../@core/backend/services/payment.service';

interface DocumentoComprado {
  id: number;
  title: string;
  description: string;
  price: number;
  fileUrlPublic: string;
  fechaCompra: string;
  format: string;
  nivel?: string;
  materia?: string;
  grado?: string;
  descargable: boolean;
  mensajeDescarga?: string;
}

interface CompraAgrupada {
  paymentId: number;
  fechaCompra: string;
  montoTotal: number;
  documentos: DocumentoComprado[];
  mostrarDocumentos: boolean;
}

@Component({
  selector: 'ngx-documentos',
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.scss']
})
export class DocumentosComponent implements OnInit {
  
  compras: CompraAgrupada[] = [];
  loading: boolean = true;
  error: string = '';
  userId: number = 0;

  constructor(
    private tokenData: TokenData,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    this.loadUserDocuments();
  }

  loadUserDocuments(): void {
    this.loading = true;
    this.error = '';
    
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      this.userId = userData.id;
      
      // Llamar al endpoint del backend
     this.paymentService.getMyPurchases(this.userId).subscribe({
          next: (response) => {
            if (response.result && response.data) {
              this.compras = response.data.map((compra: any) => ({
                ...compra,
                mostrarDocumentos: false
              }));
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error al cargar documentos:', error);
            this.error = 'Error al cargar tus documentos. Por favor, intenta de nuevo.';
            this.loading = false;
          }
        });
    } else {
      this.error = 'No se pudo identificar al usuario';
      this.loading = false;
    }
  }

  toggleDocumentos(compra: CompraAgrupada): void {
    compra.mostrarDocumentos = !compra.mostrarDocumentos;
  }

  descargarDocumento(documento: DocumentoComprado): void {
    // Validar si el documento es descargable
    if (!documento.descargable) {
      this.error = documento.mensajeDescarga || 'Este documento no está disponible para descarga';
      setTimeout(() => {
        this.error = '';
      }, 5000);
      return;
    }

    if (!documento.fileUrlPublic) {
      this.error = 'Error: No se encontró la URL del documento';
      console.error('fileUrlPublic is missing for document:', documento);
      setTimeout(() => {
        this.error = '';
      }, 5000);
      return;
    }

    // Si es una URL completa de Firebase Storage, abrirla directamente
    if (documento.fileUrlPublic.startsWith('http://') || documento.fileUrlPublic.startsWith('https://')) {
     
      window.open(documento.fileUrlPublic, '_blank');
    } else {
      // Si es un ID de Google Drive, generar token JWT
      
      this.tokenData.postToken(documento.fileUrlPublic).subscribe({
        next: (response) => {
          if (response.result && response.data) {
            window.open(response.data, '_blank');
          } else {
            this.error = 'Error: No se pudo generar el enlace de descarga';
            console.error('Invalid response:', response);
            setTimeout(() => {
              this.error = '';
            }, 5000);
          }
        },
        error: (error) => {
          console.error('Error al obtener el token de descarga:', error);
          this.error = 'Error al descargar el documento';
          setTimeout(() => {
            this.error = '';
          }, 5000);
        }
      });
    }
  }

  formatDate(date: string): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalDocumentos(): number {
    return this.compras.reduce((total, compra) => total + compra.documentos.length, 0);
  }

  getFormatIcon(format: string): string {
    switch (format.toUpperCase()) {
      case 'PDF':
        return 'file-text-outline';
      case 'ZIP':
        return 'archive-outline';
      case 'DOCX':
      case 'DOC':
        return 'file-outline';
      default:
        return 'download-outline';
    }
  }
}
