import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { ResponseGraficosPromotor } from '../../interfaces/embajador';

@Injectable({
  providedIn: 'root'
})
export class EmbajadorApi {
  private api = inject(HttpService);


  getGraficos(promotorId: string): Observable<ResponseGraficosPromotor> {
    return this.api.get(`api/v1/cupons/graficos/${promotorId}`);
  }
  
  getSalesChart(userId: number, period: string): Observable<any> {
    return this.api.get(`api/v1/promotores/sales-chart/${userId}?period=${period}`);
  }
}
