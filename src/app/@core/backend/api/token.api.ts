import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { responseToken } from "../../interfaces/token";

@Injectable({
  providedIn: 'root'
})
export class TokenApi {

  constructor(private api: HttpService) { }


postToken(driveFileId: String): Observable<responseToken> {
    return this.api.post(`api/v1/token/generate/${driveFileId}`, {});
}

/** Envía solo el ID interno del documento — el Drive file ID se resuelve en el backend. */
postTokenByDocumentId(documentId: number): Observable<responseToken> {
    return this.api.post(`api/v1/token/generate/by-document/${documentId}`, {});
}
}