import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { responseCupon } from '../../interfaces/cupon';

@Injectable({
  providedIn: 'root'
})
export class CuponApi {

  constructor(private api: HttpService) { }


  getValidar(code: String): Observable<responseCupon> {
    return this.api.get(`api/v1/cupons/validate/${code}`);
  }
}
