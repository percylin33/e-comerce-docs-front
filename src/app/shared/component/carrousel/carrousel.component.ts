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

  constructor(private router: Router,
              private documents: DocumentData
              ) {}

  ngOnInit(): void {
    this.documents.getDocumentServiceRecientes().subscribe(
      (response) => {
        // Accede a response.data para obtener la lista de documentos
        this.resientesList = response.data;
      },
      (error) => {
        console.error('Error al obtener los documentos mas recientes ', error);
      }
    );

    this.documents.getDocumentServiceMasVistos().subscribe(
      (response) => {
        this.popularesList = response.data;
      },
      (error) => {
        console.error('Error al obtener los documentos populares', error);
      }
    );

    this.documents.getDocumentServiceMasVendidos().subscribe(
      (response) => {
        this.vendidosList = response.data;
      },
      (error) => {
        console.error('Error al obtener los documentos vendidos', error);
      }
    );
  }

}
