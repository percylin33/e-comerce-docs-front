import { Observable } from "rxjs";

/** Generic wrapper matching ResponseHandler.generateResponse shape */
export interface ApiWrapped<T> {
  result: boolean;
  data: T;
  timestamp: string;
  status: number;
}

export interface responseCupon {
    result: boolean; 
    data: Data ;
    timestamp: string;
    status: number;
  }

export interface Cupon {
  code: string; 
  userID: string;
}

export interface Data {

    abono: number;
    descuento: number;
    codigo: string;
    
}

export interface responseCreateCupon {
  result: boolean; 
    data: CuponCreate;
    timestamp: string;
    status: number;
}

export interface CuponCreate {
  id: Number,
  code: string,
  discountValue: Number,
  abonoValue: Number,
  created_at: string,
  userId: Number
}

export interface GraficosPromotor {
  totalRecaudado: number;
  totalPorCobrar: number;
  ventas: number;
  dataDocument: any[];
  dataPayment: any[];
}

export interface responseGraficos {
  result: boolean;
  data: GraficosPromotor;
  timestamp: string;
  status: number;
}

export interface CuponLimitadoCreate {
  code?: string;
  discountValue: number;
  couponType: 'LIMITED_USE';
  maxUses: number;
  userId: null;
}

export interface CuponLimitadoResponse {
  id: number;
  code: string;
  discountValue: number;
  couponType: string;
  maxUses: number;
  remainingUses: number;
  active: boolean;
}

export interface CuponAdminDto {
  id: number;
  code: string;
  discountValue: number;
  couponType: string;
  maxUses: number;
  usesCount: number;
  remainingUses: number;
  active: boolean;
  createdAt: string;
}

export interface CuponUpdatePayload {
  code?: string;
  discountValue?: number;
  maxUses?: number;
  active?: boolean;
}

  export abstract class CuponData {
    abstract getValidar(code: string): Observable<responseCupon>;
    abstract postGenerar(userId: number): Observable<responseCreateCupon>;
    abstract getCupont(userId: number): Observable<responseCupon>;
    abstract getGraficos(promotorId: string): Observable<responseGraficos>;
  abstract crearCuponLimitado(data: CuponLimitadoCreate): Observable<ApiWrapped<CuponLimitadoResponse>>;
  abstract listLimitedCoupons(): Observable<ApiWrapped<CuponAdminDto[]>>;
  abstract updateLimitedCoupon(id: number, data: CuponUpdatePayload): Observable<ApiWrapped<CuponAdminDto>>;
  abstract toggleCoupon(id: number): Observable<ApiWrapped<CuponAdminDto>>;
  }