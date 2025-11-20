import { Observable } from "rxjs";

export interface EmbajadorStats {
  comisionPorVenta: number;
  totalRecaudado: number;
  codigosActivos: number;
  beneficios: number;
}

export interface CuponInfo {
  codigo: string;
  descuento: number;
  abono: number;
  ventas: number;
}

export interface DocumentPaymentGraphic {
  title: string;
  salesCount: number;
}

export interface PaymentPorMes {
  month: number;
  year: number;
  salesCount: number;
}

export interface GraficosPromotor {
  totalRecaudado: number;
  totalPorCobrar: number;
  ventas: number;
  dataDocument?: DocumentPaymentGraphic[];
  dataPayment?: PaymentPorMes[];
}

export interface ResponseGraficosPromotor {
  result: boolean;
  data: GraficosPromotor;
  timestamp: string;
  status: number;
}

export interface SalesChartData {
  labels: string[];
  data: number[];
  period: string;
}

export abstract class EmbajadorData {
  abstract getGraficos(promotorId: string): Observable<ResponseGraficosPromotor>;
}
