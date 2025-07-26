import { Observable } from "rxjs";


export interface responseToken {
    result: boolean; 
    data: string;
    timestamp: string;
    status: number;
  }

export abstract class TokenData {
    abstract postToken(code: string): Observable<responseToken>;
  }



