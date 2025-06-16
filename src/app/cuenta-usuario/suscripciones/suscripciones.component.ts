import { Component, OnInit } from '@angular/core';
import { MembresiaData, MembresiaSuscripcion } from '../../@core/interfaces/membresia';

@Component({
  selector: 'ngx-suscripciones',
  templateUrl: './suscripciones.component.html',
  styleUrls: ['./suscripciones.component.scss']
})
export class SuscripcionesComponent implements OnInit {
  // suscripciones = [
  //   {
  //     nombre: 'Membresía Mensual Secundaria',
  //     fechaInicio: '2024-01-01',
  //     fechaFin: '2025-01-01',
  //     pagos: [
  //       {
  //         amount: 20,
  //         paymentDate: '2024-01-01T00:00:00Z',
  //         paymentStatus: 'COMPLETED',
  //         isSubscription: true,
  //         documents: [
  //           { id: 1, title: 'Documento 1', fileUrlPublic: 'https://...' }
  //         ],
  //         name: 'Juan Pérez',
  //         phone: '+51 999 999 999',
  //         paidPromotor: false
  //       },
  //       {
  //         amount: 20,
  //         paymentDate: '2024-01-01T00:00:00Z',
  //         paymentStatus: 'COMPLETED',
  //         isSubscription: true,
  //         documents: [
  //           { id: 1, title: 'Documento 1', fileUrlPublic: 'https://...' }
  //         ],
  //         name: 'Juan Pérez',
  //         phone: '+51 999 999 999',
  //         paidPromotor: false
  //       }
  //     ],
  //     documentos: {
  //       SECUNDARIA: {
  //         COMUNICACION: {
  //           '3°': [
  //             {
  //               id: 356,
  //               title: 'prueba suscripcion',
  //               description: 'mi segundo documenotosd',
  //               format: 'ZIP',
  //               price: 23.55,
  //               numeroDePaginas: 10,
  //               fileUrlPublic: 'https://tu-enlace-de-ejemplo.com'
  //             }
  //           ],
  //           '4°': [
  //             {
  //               id: 356,
  //               title: 'prueba suscripcion',
  //               description: 'mi segundo documenotosd',
  //               format: 'ZIP',
  //               price: 23.55,
  //               numeroDePaginas: 10,
  //               fileUrlPublic: 'https://tu-enlace-de-ejemplo.com'
  //             },
  //             {
  //               id: 356,
  //               title: 'prueba suscripcion',
  //               description: 'mi segundo documenotosd',
  //               format: 'ZIP',
  //               price: 23.55,
  //               numeroDePaginas: 10,
  //               fileUrlPublic: 'https://tu-enlace-de-ejemplo.com'
  //             }
  //           ]
  //         },
  //         MATEMATICA: {
  //           '3°': [
  //             {
  //               id: 356,
  //               title: 'prueba suscripcion',
  //               description: 'mi segundo documenotosd',
  //               format: 'ZIP',
  //               price: 23.55,
  //               numeroDePaginas: 10,
  //               fileUrlPublic: 'https://tu-enlace-de-ejemplo.com'
  //             }
  //           ]
  //         }
  //       }
  //     }
  //   }
  // ];

  suscripciones: { [nombre: string]: MembresiaSuscripcion } = {};
  suscripcionesArray: MembresiaSuscripcion[] = [];
  id: number = 0;
  constructor(
    private membresiaData: MembresiaData
  ) {

  }


  ngOnInit(): void {

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      this.id = userData.id;
      console.log(this.id);

    }

    this.membresiaData.getMembresiasUser(this.id).subscribe({
      next: (response) => {
        if (response.result) {
          this.suscripciones = response.data;
          this.suscripcionesArray = Object.values(response.data); // <-- transforma a array
          //this.suscripcionesArray = Object.values(response.data);
        }
      }
      ,
      error: (error) => {
        console.error('Error al obtener las suscripciones:', error);
      }
    });
  }
  pagosVisibles: { [key: number]: boolean } = {};
  nivelesVisibles: { [key: string]: boolean } = {};
  materiasVisibles: { [key: string]: boolean } = {};
  gradosVisibles: { [key: string]: boolean } = {};

  togglePagos(index: number) {
    this.pagosVisibles[index] = !this.pagosVisibles[index];
  }

  toggleNivel(nivel: string) {
    this.nivelesVisibles[nivel] = !this.nivelesVisibles[nivel];
  }

  toggleMateria(index: number, nivel: string, materia: string) {
    const key = `${index}-${nivel}-${materia}`;
    this.materiasVisibles[key] = !this.materiasVisibles[key];
  }
  toggleGrado(nivel: string, materia: string, grado: string) {
    const key = `${nivel}-${materia}-${grado}`;
    this.gradosVisibles[key] = !this.gradosVisibles[key];
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  verDocumento(url: string) {
    window.open(url, '_blank');
  }

  pagar(pago: any) {
  // Lógica para procesar el pago
  console.log('Pagar', pago);
}
}
