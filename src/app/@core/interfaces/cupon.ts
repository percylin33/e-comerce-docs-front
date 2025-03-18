import { Observable } from "rxjs";


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

  export abstract class CuponData {
    abstract getValidar(code: string): Observable<responseCupon>;
    abstract postGenerar(userId: number): Observable<responseCreateCupon>;
    abstract getCupont(userId: number): Observable<responseCupon>;
  }