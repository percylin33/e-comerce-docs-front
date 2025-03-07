import { Observable } from "rxjs";


export interface responseCupon {
    result: boolean; 
    data: Data;
    timestamp: string;
    status: number;
  }

export interface Cupon {
  code: string; 
  userID: string;
}

export interface Data {
   
    descuento: number;
    
  }

  export abstract class CuponData {
    abstract getValidar(code: string): Observable<responseCupon>;
  }