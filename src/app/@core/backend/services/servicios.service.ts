import { Injectable, inject } from '@angular/core';
import { GetServiciosResponse, Servicios, ServiciosData } from '../../interfaces/servicios';
import { ServiciosApi } from '../api/servicios.api';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService extends ServiciosData {
  private api = inject(ServiciosApi);


  getServicios(): Observable<GetServiciosResponse> {
    return this.api.getServicios();
  }
}
