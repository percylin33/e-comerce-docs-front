import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CuponData, responseCreateCupon, responseCupon } from '../../interfaces/cupon';
import { CuponApi } from '../api/cupon.api';

@Injectable({
  providedIn: 'root'
})
export class CuponService extends CuponData {

  constructor(private api: CuponApi) {
    super();
   }

  getValidar(code: String): Observable<responseCupon> {
    return this.api.getValidar(code);
  }

  postGenerar(userId: number): Observable<responseCreateCupon> {
    return this.api.postGenerar(userId);
  }

  getCupont(userId: number): Observable<responseCupon> {
    return this.api.getCupont(userId);
  }
}
