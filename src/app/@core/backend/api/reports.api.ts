import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface VentaReporte {
  fecha: string;
  cliente: string;
  documento: string;
  monto: number;
  comision: number;
  estado: string;
}

export interface EstadisticaMensual {
  mes: string;
  cantidadVentas: number;
  totalVentas: number;
  totalComisiones: number;
}

export interface PromotorReportData {
  promotorNombre: string;
  promotorEmail: string;
  cuponCodigo: string;
  periodoDesde: string;
  periodoHasta: string;
  totalVentas: number;
  totalRecaudado: number;
  totalComisiones: number;
  porcentajeComision: number;
  ventas: VentaReporte[];
  estadisticasMensuales: EstadisticaMensual[];
}

@Injectable()
export class ReportsApi {
  private api = inject(HttpService);

  private readonly apiController: string = 'api/v1/promotores/reports';

  /**
   * Get report data for PDF generation
   */
  getReportData(userId: number, desde: string, hasta: string): Observable<any> {
    return this.api.get(`${this.apiController}/${userId}?desde=${desde}&hasta=${hasta}`);
  }
}
