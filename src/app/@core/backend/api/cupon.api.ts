import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { responseCreateCupon, responseCupon } from '../../interfaces/cupon';

@Injectable({
  providedIn: 'root'
})
export class CuponApi {

  constructor(private api: HttpService) { }


  getValidar(code: String): Observable<responseCupon> {
    return this.api.get(`api/v1/cupons/validate/${code}`);
  }

  postGenerar(userId: number, prefijo?: string): Observable<responseCreateCupon> {
    const body: any = { userId };
    
    // Solo agregar prefijo si existe y no está vacío
    if (prefijo && prefijo.trim().length > 0) {
      body.prefijo = prefijo.trim();
    }
    
    return this.api.post(`api/v1/cupons/create`, body);
  }

  getCupont(userId: number): Observable<responseCupon> {
    return this.api.get(`api/v1/cupons/${userId}`);
  }
}
