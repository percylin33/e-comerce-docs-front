import { Component, OnDestroy, OnInit } from '@angular/core';
import { DocumentData, DocumentDetail, GetDocumentDetailResponse } from '../../@core/interfaces/documents';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DocumentsService } from '../../@core/backend/services/documents.service';

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
              private documentsService: DocumentData) { }

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
      }, (error) => {
        console.error('Error al obtener el documento:', error);
      });
    } else {
      console.error('No se proporcionó un ID de documento válido');
    }
  }
}
