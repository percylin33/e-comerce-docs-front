import { Observable } from "rxjs";

export interface GetGraphicsResponse {
  result: boolean;
  status: number;
  data: GraphicsData | GraphicsDataPromotor;
  timestamp: string;
}

export interface GraphicsData {
  allUsers: number;
  allPayments: number;
  allSales: number;
  dataPayment: PaymentDataGraph[];
  dataDocument: DocumentDataGraph[];
}

export interface PaymentDataGraph {
  month: number;
  year: number;
  salesCount: number;
}

export interface DocumentDataGraph {
  title: string;
  salesCount: number;
}

export interface GraphicsDataPromotor {
  totalRecaudado: Number,
  totalPorCobrar: Number,
  ventas: Number,
  dataPayment: PaymentDataGraph[];
  dataDocument: DocumentDataGraph[];
}

export abstract class GraphicsData {
  abstract getGraphics(): Observable<GetGraphicsResponse>;
  abstract getGraphicsSoles(): Observable<GetGraphicsResponse>;
  abstract getGraphicsPromotor(promotorId: string): Observable<GetGraphicsResponse>;
}
