import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { register } from 'swiper/element';
import { DocumentData, Document } from '../../../@core/interfaces/documents';
register();

@Component({
  selector: 'ngx-carrousel',
  templateUrl: './carrousel.component.html',
  styleUrls: [
    './carrousel.component.scss',
  ]
})
export class CarrouselComponent implements OnInit {
  titulos = [
    {
      titulo: 'Añadidos Recientemente',
    },
    {
      titulo: 'Los mas populares',
    },
    {
      titulo: 'Los mas vendidos',
    },
  ];


  resientesList: Document[] = [];
  popularesList: Document[] = [];
  vendidosList: Document[] = [];
  urls: string[] = [];

  constructor(private router: Router,
              private documents: DocumentData
              ) {}

  ngOnInit(): void {
    this.documents.getDocumentServiceRecientes().subscribe(
      (response) => {
        // Itera sobre response.data para modificar imagenUrlPublic
        this.resientesList = response.data.map((doc: Document) => {
          console.log(doc);
          if (doc.format === 'ZIP') {
            const urls = doc.imagenUrlPublic.split('|');
            if (urls.length > 0) {
              doc.imagenUrlPublic = urls[0];
            }
          }
          return doc;
        });
        console.log('Recientes List:', this.resientesList);
      },
      (error) => {
        console.error('Error al obtener los documentos mas recientes ', error);
      }
    );

    this.documents.getDocumentServiceMasVistos().subscribe(
      (response) => {
        this.popularesList = response.data.map((doc: Document) => {
          if (doc.format === 'ZIP') {
            const urls = doc.imagenUrlPublic.split('|');
            if (urls.length > 0) {
              doc.imagenUrlPublic = urls[0];
            }
          }
          return doc;
        });
        console.log('Populares List:', this.popularesList);
      },
      (error) => {
        console.error('Error al obtener los documentos populares', error);
      }
    );

    this.documents.getDocumentServiceMasVendidos().subscribe(
      (response) => {
        this.vendidosList = response.data.map((doc: Document) => {
          if (doc.format === 'ZIP') {
            const urls = doc.imagenUrlPublic.split('|');
            if (urls.length > 0) {
              doc.imagenUrlPublic = urls[0];
            }
          }
          return doc;
        });
        console.log('Vendidos List:', this.vendidosList);
      },
      (error) => {
        console.error('Error al obtener los documentos vendidos', error);
      }
    );
  }

}
