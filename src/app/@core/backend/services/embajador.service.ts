import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EmbajadorData, ResponseGraficosPromotor, SalesChartData } from '../../interfaces/embajador';
import { EmbajadorApi } from '../api/embajador.api';

@Injectable({
  providedIn: 'root'
})
export class EmbajadorService extends EmbajadorData {
  private api = inject(EmbajadorApi);


  getGraficos(promotorId: string): Observable<ResponseGraficosPromotor> {
    return this.api.getGraficos(promotorId);
  }
  
  getSalesChart(userId: number, period: string): Observable<any> {
    return this.api.getSalesChart(userId, period);
  }
}
