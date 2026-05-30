import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VentasApi, VentaDetallada, VentasResumen } from '../backend/api/ventas.api';

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private api = inject(VentasApi);


  getVentas(promotorId: string, filtros?: { desde?: string; hasta?: string; estado?: string }): Observable<VentaDetallada[]> {
    return this.api.getVentas(
      promotorId,
      filtros?.desde,
      filtros?.hasta,
      filtros?.estado
    ).pipe(
      map((response: any) => response?.data || response)
    );
  }

  getResumen(promotorId: string, filtros?: { desde?: string; hasta?: string; estado?: string }): Observable<VentasResumen> {
    return this.api.getResumen(
      promotorId,
      filtros?.desde,
      filtros?.hasta,
      filtros?.estado
    ).pipe(
      map((response: any) => response?.data || response)
    );
  }
}
