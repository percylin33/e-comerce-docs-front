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
      console.warn('⚠️ Error al limpiar contexto del documento:', error);
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
        
        // Guardar contexto del documento para que el carrousel vertical pueda usarlo
        this.saveCurrentDocumentContext(response.data);
      }, (error) => {
        console.error('Error al obtener el documento:', error);
      });
    } else {
      console.error('No se proporcionó un ID de documento válido');
    }
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
      
      console.log('📄 Contexto del documento guardado:', documentContext);
    } catch (error) {
      console.warn('⚠️ Error al guardar contexto del documento:', error);
    }
  }

  openImageDialog(imageUrl: string): void {
    this.dialog.open(ImageDialogComponent, {
      data: { imageUrl },
      panelClass: 'full-screen-dialog'
    });
  }

  

}
