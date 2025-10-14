import { Component, OnInit } from '@angular/core';
import { TutorialApi } from '../../@core/backend/api/tutorial.api';


@Component({
  selector: 'ngx-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss']
})
export class TutorialComponent implements OnInit {
  ejemploDatosEmbajador: any = null;

  constructor(private tutorialApi: TutorialApi) {}

  ngOnInit() {
    // Cambia el id por el que corresponda (puedes obtenerlo de localStorage, route params, etc)
    const userId = 1;
    this.tutorialApi.getUserById(userId).subscribe({
      next: (data) => {
        this.ejemploDatosEmbajador = {
          nombre: data.nombre + ' ' + data.apellido,
          pais: data.country,
          email: data.correo,
          beneficios: [
            'Comisión del 10% por venta',
            'Código promocional único',
            ...(Array.isArray(data.roles) && data.roles.includes('PROMOTOR') ? ['Acceso a panel de Embajador'] : [])
          ]
        };
      },
      error: (err) => {
        this.ejemploDatosEmbajador = {
          nombre: 'No disponible',
          pais: '-',
          email: '-',
          beneficios: ['No se pudo cargar la información']
        };
      }
    });
  }
}
