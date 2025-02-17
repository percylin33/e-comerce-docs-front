import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { GetServiciosResponse, Servicios } from '../../interfaces/servicios';

@Injectable({
  providedIn: 'root'
})
export class ServiciosApi {

  constructor(private api: HttpService) { }


  getServicios(): Observable<GetServiciosResponse> {
    return this.api.get('api/v1/sevicios');
  }
}
