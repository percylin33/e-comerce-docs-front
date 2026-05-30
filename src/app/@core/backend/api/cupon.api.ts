import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { ApiWrapped, CuponAdminDto, CuponLimitadoCreate, CuponLimitadoResponse, CuponUpdatePayload, responseCreateCupon, responseCupon, responseGraficos } from '../../interfaces/cupon';

@Injectable({
  providedIn: 'root'
})
export class CuponApi {
  private api = inject(HttpService);



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

  getGraficos(promotorId: string): Observable<responseGraficos> {
    return this.api.get(`api/v1/cupons/graficos/${promotorId}`);
  }

  postCrearCuponLimitado(data: CuponLimitadoCreate): Observable<ApiWrapped<CuponLimitadoResponse>> {
    return this.api.post(`api/v1/cupons/admin/create`, data);
  }

  getLimitedCoupons(): Observable<ApiWrapped<CuponAdminDto[]>> {
    return this.api.get(`api/v1/cupons/admin/limited`);
  }

  putUpdateLimitedCoupon(id: number, data: CuponUpdatePayload): Observable<ApiWrapped<CuponAdminDto>> {
    return this.api.put(`api/v1/cupons/admin/${id}`, data);
  }

  patchToggleCoupon(id: number): Observable<ApiWrapped<CuponAdminDto>> {
    return this.api.patch(`api/v1/cupons/admin/${id}/toggle`, {});
  }
}
