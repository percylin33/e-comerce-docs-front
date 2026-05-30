import { Observable } from "rxjs";


export interface responseToken {
    result: boolean; 
    data: string;
    timestamp: string;
    status: number;
  }

export abstract class TokenData {
    abstract postToken(code: string): Observable<responseToken>;
    /** Endpoint seguro: envía solo el ID interno del documento (PK de la BD). El Drive file ID nunca sale al cliente. */
    abstract postTokenByDocumentId(documentId: number): Observable<responseToken>;
  }



