import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface VentaDetallada {
  id: number;
  documentName: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  commission: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
  cuponCode: string;
}

export interface VentasResumen {
  ventas: VentaDetallada[];
  totalVentas: number;
  totalComisiones: number;
  totalRecaudado: number;
}

@Injectable()
export class VentasApi {
  private readonly apiController: string = 'api/v1/promotores/ventas';

  constructor(private api: HttpService) {}

  getVentas(promotorId: string, desde?: string, hasta?: string, estado?: string): Observable<VentaDetallada[]> {
    let params = '';
    if (desde) params += `&desde=${desde}`;
    if (hasta) params += `&hasta=${hasta}`;
    if (estado) params += `&estado=${estado}`;
    
    const url = `${this.apiController}/${promotorId}${params ? '?' + params.substring(1) : ''}`;
    return this.api.get(url);
  }

  getResumen(promotorId: string, desde?: string, hasta?: string, estado?: string): Observable<VentasResumen> {
    let params = '';
    if (desde) params += `&desde=${desde}`;
    if (hasta) params += `&hasta=${hasta}`;
    if (estado) params += `&estado=${estado}`;
    
    const url = `${this.apiController}/${promotorId}/resumen${params ? '?' + params.substring(1) : ''}`;
    return this.api.get(url);
  }
}
