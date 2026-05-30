import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface PromotorDashboardData {
  cupon: {
    codigo: string;
    descuento: number;
    abono: number;
  } | null;
  estadisticas: {
    totalRecaudado: number;
    totalPorCobrar: number;
    ventas: number;
    dataDocument: Array<{
      documentName: string;
      salesCount: number;
    }>;
    dataPayment: Array<{
      month: string;
      salesCount: number;
    }>;
  };
  perfil: {
    id: number;
    name: string;
    lastname: string;
    email: string;
    phone: string;
    picture: string;
    descuento: number;
    abono: number;
  };
}

@Injectable()
export class PromotorDashboardApi {
  private api = inject(HttpService);

  private readonly apiController: string = 'api/v1/promotores';

  getDashboardData(userId: number): Observable<PromotorDashboardData> {
    return this.api.get(`${this.apiController}/dashboard/${userId}`);
  }
}
