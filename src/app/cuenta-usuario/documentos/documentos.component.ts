import { Component, OnInit } from '@angular/core';
import { TokenData } from '../../@core/interfaces/token';
import { PaymentService } from '../../@core/backend/services/payment.service';
import { NbCardModule, NbSpinnerModule, NbAlertModule, NbIconModule, NbButtonModule, NbTooltipModule } from '@nebular/theme';
import { RouterLink } from '@angular/router';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';

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
    styleUrls: ['./documentos.component.scss'],
    standalone: true,
    imports: [NbCardModule, NbSpinnerModule, NbAlertModule, NbIconModule, NbButtonModule, RouterLink, MatCard, MatCardHeader, MatCardContent, NbTooltipModule]
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
    
    // El backend lee el userId desde el token JWT (SecurityContext)
    this.paymentService.getMyPurchases().subscribe({
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
  }

  toggleDocumentos(compra: CompraAgrupada): void {
    compra.mostrarDocumentos = !compra.mostrarDocumentos;
  }

  descargarDocumento(documento: DocumentoComprado): void {
    // Validar si el documento es descargable
    if (!documento.descargable) {
      this.error = documento.mensajeDescarga || 'Este documento no está disponible para descarga';
      setTimeout(() => { this.error = ''; }, 5000);
      return;
    }

    if (!documento.fileUrlPublic) {
      this.error = 'Error: No se encontró la URL del documento';
      console.error('fileUrlPublic is missing for document:', documento);
      setTimeout(() => { this.error = ''; }, 5000);
      return;
    }

    const url = documento.fileUrlPublic;

    // Documentos de Firebase Storage: URL completa que se abre directamente
    if (url.startsWith('https://firebasestorage.googleapis.com') ||
        url.startsWith('https://storage.googleapis.com')) {
      // Verificar que la URL sea accesible antes de abrir
      fetch(url, { method: 'HEAD' }).then(res => {
        if (res.ok) {
          window.open(url, '_blank');
        } else if (res.status === 403) {
          this.error = 'El enlace de descarga ha expirado. Contacta al soporte para obtener un nuevo enlace.';
          setTimeout(() => { this.error = ''; }, 7000);
        } else {
          this.error = `No se pudo acceder al documento (error ${res.status}). Intenta más tarde.`;
          setTimeout(() => { this.error = ''; }, 7000);
        }
      }).catch(() => {
        // Si fetch falla (CORS), intentar abrir de todas formas
        window.open(url, '_blank');
      });
      return;
    }

    // Documentos de Google Drive u otros: generar token seguro usando el ID interno del documento
    // (el Drive file ID se resuelve en el backend — nunca viaja en la URL)
    this.tokenData.postTokenByDocumentId(documento.id).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          window.open(response.data, '_blank');
        } else {
          this.error = 'Error: No se pudo generar el enlace de descarga';
          console.error('Invalid response:', response);
          setTimeout(() => { this.error = ''; }, 5000);
        }
      },
      error: (error) => {
        console.error('Error al obtener el token de descarga:', error);
        if (error.status === 401 || error.status === 403) {
          this.error = 'No tienes permiso para descargar este documento.';
        } else if (error.status === 0) {
          this.error = 'No se pudo conectar al servidor. Verifica tu conexión.';
        } else {
          this.error = 'Error al generar el enlace de descarga. Intenta de nuevo.';
        }
        setTimeout(() => { this.error = ''; }, 7000);
      }
    });
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
