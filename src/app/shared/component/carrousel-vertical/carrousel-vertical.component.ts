import { Component, Input, OnInit } from '@angular/core';
import { Document, DocumentData } from '../../../@core/interfaces/documents';

@Component({
  selector: 'ngx-carrousel-vertical',
  templateUrl: './carrousel-vertical.component.html',
  styleUrls: ['./carrousel-vertical.component.scss']
})
export class CarrouselVerticalComponent implements OnInit {
  @Input() category: string;

  constructor(private documentService: DocumentData) { }

  listDocuments: Document[];

  ngOnInit(): void {
    this.documentService.getRecentDocuments(this.category).subscribe(
      response => {
        this.listDocuments = response.data.map((doc: Document) => {
          
          if (doc.format === 'ZIP') {
            console.log(doc.format);
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



}
