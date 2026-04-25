import { Component, OnDestroy, OnInit } from '@angular/core';
import { DocumentData, DocumentDetail, GetDocumentDetailResponse } from '../../@core/interfaces/documents';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DocumentsService } from '../../@core/backend/services/documents.service';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'ngx-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy {
  documentId: string;
  documentDetail: DocumentDetail; // Define el tipo de tu documento
  urls: string[] = [];
  private routeSub: Subscription;
  
  // URL procesada para el visor iframe (legacy: fallback Drive)
  pdfViewerUrl: string = '';

  // URL del PDF servido por nuestro backend (proxy a Drive) para <ngx-extended-pdf-viewer>
  pdfStreamUrl: string = '';

  // Estado de carga del visor PDF
  pdfLoading: boolean = false;
  pdfError: boolean = false;

  // Cuando se abre el diálogo de PDF ampliado, ocultamos el visor principal
  // porque ngx-extended-pdf-viewer no soporta dos instancias simultáneas.
  previewDialogOpen: boolean = false;

  constructor(private route: ActivatedRoute,
              private documentsService: DocumentData,
              private dialog: MatDialog) { }

  ngOnInit(): void {
    // Suscribirse a los cambios en los parámetros de la ruta
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.documentId = params.get('id');
      this.loadDocument(this.documentId); // Llama a una función para cargar el documento
    });
  }

  ngOnDestroy(): void {
    // Desuscribirse de los cambios en los parámetros de la ruta para evitar fugas de memoria
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    
    // Limpiar el contexto del documento al salir
    try {
      sessionStorage.removeItem('currentDocument');
    } catch (error) {
    }
  }

  loadDocument(id: string): void {
    if (id) {
      // Limpiar estado anterior para evitar que se muestre contenido del documento previo
      this.pdfViewerUrl = '';
      this.pdfStreamUrl = '';
      this.pdfLoading = false;
      this.pdfError = false;
      this.documentDetail = null;
      
      // Llamar al servicio para obtener el documento por ID
      this.documentsService.getDocument(id).subscribe((response) => {
        
        
        this.urls = response.data.imagenUrlPublic.split('|');
        if (this.urls && response.data.format === 'ZIP') {
          response.data.imagenUrlPublic = this.urls[0];
        }
        this.documentDetail = response.data;
        
        // Procesar URL para visor compatible
        if (response.data.pdfPreviewUrl) {
          this.pdfViewerUrl = this.processGoogleDriveUrl(response.data.pdfPreviewUrl);
          // PDF servido por nuestro backend (sin branding Drive)
          this.pdfStreamUrl = `${environment.apiUrl}/api/v1/document/${response.data.id}/preview-pdf`;
          this.pdfLoading = true;
          this.pdfError = false;
        }
        
        // Guardar contexto del documento para que el carrousel vertical pueda usarlo
        this.saveCurrentDocumentContext(response.data);
      }, (error) => {
        console.error('❌ Error al cargar documento:', error);
      });
    } else {
    }
  }

  /**
   * Procesa URL de Google Drive para hacerla compatible con iframe embebido
   * Convierte: https://drive.google.com/file/d/FILE_ID/...
   * A: https://drive.google.com/file/d/FILE_ID/preview
   */
  private processGoogleDriveUrl(url: string): string {
    if (!url) return url;

    // Extraer FILE_ID de URLs de Google Drive
    const fileIdMatch = url.match(/\/file\/d\/([^\/\?]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }

    // Si no es una URL de Drive reconocida pero parece un ID suelto
    if (!url.includes('/') && !url.includes('.')) {
      return `https://drive.google.com/file/d/${url}/preview`;
    }

    // Si no es una URL de Drive reconocida, retornar original
    return url;
  }

  /**
   * Guarda el contexto del documento actual para uso de otros componentes
   */
  private saveCurrentDocumentContext(document: DocumentDetail): void {
    try {
      const documentContext = {
        id: document.id,
        category: document.category,
        materia: document.materia,
        nivel: document.nivel,
        grado: document.grado,
        subjectId: document.grade?.subject?.id,
        format: document.format
      };
      
      // Guardar en sessionStorage (se limpia al cerrar la pestaña)
      sessionStorage.setItem('currentDocument', JSON.stringify(documentContext));
      
    } catch (error) {
    }
  }

  openImageDialog(imageUrl: string): void {
    this.dialog.open(ImageDialogComponent, {
      data: { imageUrl },
      panelClass: 'full-screen-dialog'
    });
  }

  /**
   * Abre el preview ampliado: si hay PDF disponible muestra el visor,
   * en caso contrario muestra la imagen de portada.
   */
  openPreview(): void {
    if (this.pdfStreamUrl) {
      // Ocultar el visor principal antes de abrir el del modal
      this.previewDialogOpen = true;
      const ref = this.dialog.open(ImageDialogComponent, {
        data: { pdfUrl: this.pdfStreamUrl, title: this.documentDetail?.title },
        panelClass: 'full-screen-dialog',
        maxWidth: '100vw',
        width: '100vw',
        height: '100vh'
      });
      ref.afterClosed().subscribe(() => {
        // Restaurar el visor principal y forzar reload del PDF
        this.previewDialogOpen = false;
        this.pdfLoading = true;
      });
      return;
    }
    if (this.documentDetail?.imagenUrlPublic) {
      this.openImageDialog(this.documentDetail.imagenUrlPublic);
    }
  }

  /** Handlers del visor PDF */
  onPdfLoaded(): void {
    this.pdfLoading = false;
    this.pdfError = false;
  }

  onPdfLoadError(_err: any): void {
    this.pdfLoading = false;
    this.pdfError = true;
  }

}
