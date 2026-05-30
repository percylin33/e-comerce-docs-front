import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CuponData, ApiWrapped, CuponAdminDto, CuponLimitadoCreate, CuponLimitadoResponse, CuponUpdatePayload, responseCreateCupon, responseCupon, responseGraficos } from '../../interfaces/cupon';
import { CuponApi } from '../api/cupon.api';

@Injectable({
  providedIn: 'root'
})
export class CuponService extends CuponData {
  private api = inject(CuponApi);


  getValidar(code: String): Observable<responseCupon> {
    return this.api.getValidar(code);
  }

  postGenerar(userId: number, prefijo?: string): Observable<responseCreateCupon> {
    return this.api.postGenerar(userId, prefijo);
  }

  getCupont(userId: number): Observable<responseCupon> {
    return this.api.getCupont(userId);
  }

  getGraficos(promotorId: string): Observable<responseGraficos> {
    return this.api.getGraficos(promotorId);
  }

  crearCuponLimitado(data: CuponLimitadoCreate): Observable<ApiWrapped<CuponLimitadoResponse>> {
    return this.api.postCrearCuponLimitado(data);
  }

  listLimitedCoupons(): Observable<ApiWrapped<CuponAdminDto[]>> {
    return this.api.getLimitedCoupons();
  }

  updateLimitedCoupon(id: number, data: CuponUpdatePayload): Observable<ApiWrapped<CuponAdminDto>> {
    return this.api.putUpdateLimitedCoupon(id, data);
  }

  toggleCoupon(id: number): Observable<ApiWrapped<CuponAdminDto>> {
    return this.api.patchToggleCoupon(id);
  }
}
