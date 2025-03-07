import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CuponData, responseCupon } from '../../interfaces/cupon';
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
}
