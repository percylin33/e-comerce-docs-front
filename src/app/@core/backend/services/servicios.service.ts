import { Injectable } from '@angular/core';
import { GetServiciosResponse, Servicios, ServiciosData } from '../../interfaces/servicios';
import { ServiciosApi } from '../api/servicios.api';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService extends ServiciosData {

  constructor(private api: ServiciosApi) {
    super();
   }

  getServicios(): Observable<GetServiciosResponse> {
    return this.api.getServicios();
  }
}
