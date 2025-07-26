import { Component, Input, OnInit, HostListener } from '@angular/core';
import { Document, DocumentData } from '../../../@core/interfaces/documents';

@Component({
  selector: 'ngx-carrousel-vertical',
  templateUrl: './carrousel-vertical.component.html',
  styleUrls: ['./carrousel-vertical.component.scss']
})
export class CarrouselVerticalComponent implements OnInit {
  @Input() category: string;

  listDocuments: Document[];
  isHorizontalLayout: boolean = false;

  constructor(private documentService: DocumentData) { }

  ngOnInit(): void {
    this.loadRecommendedDocuments();
    this.checkLayoutMode();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkLayoutMode();
  }

  private checkLayoutMode(): void {
    // Detectar si debe ser horizontal basado en el ancho de pantalla
    // y la posición del contenedor (abajo vs lateral)
    const screenWidth = window.innerWidth;
    this.isHorizontalLayout = screenWidth >= 1000 && screenWidth <= 1399;
  }

  private loadRecommendedDocuments(): void {
    this.documentService.getRecentDocuments(this.category).subscribe(
      response => {
        this.listDocuments = response.data.map((doc: Document) => {
          if (doc.format === 'ZIP') {
            const urls = doc.imagenUrlPublic.split('|');
            if (urls.length > 0) {
              doc.imagenUrlPublic = urls[0];
            }
          }
          return doc;
        });
      },
      error => {
        console.error('Error al obtener los documentos:', error);
      }
    );
  }

  trackByDocument(index: number, document: Document): any {
    return document.id || index;
  }
}
