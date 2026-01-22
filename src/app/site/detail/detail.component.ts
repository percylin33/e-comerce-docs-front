import { Component, OnDestroy, OnInit } from '@angular/core';
import { DocumentData, DocumentDetail, GetDocumentDetailResponse } from '../../@core/interfaces/documents';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DocumentsService } from '../../@core/backend/services/documents.service';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';

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
  
  // URL procesada para el visor iframe
  pdfViewerUrl: string = '';

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
   * A: https://drive.google.com/file/d/FILE_ID/preview?embedded=true
   */
  private processGoogleDriveUrl(url: string): string {
    if (!url) return url;
    
    // Si ya tiene /preview, agregar parámetro embedded=true
    if (url.includes('/preview')) {
      // Remover parámetros existentes y agregar solo embedded=true
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?embedded=true`;
    }
    
    // Extraer FILE_ID de URLs de Google Drive
    const fileIdMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      // Usar embedded=true para modo embebido sin botones extra
      return `https://drive.google.com/file/d/${fileId}/preview?embedded=true`;
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

}
