import { Injectable, inject } from "@angular/core";
import { responseToken, TokenData } from "../../interfaces/token";
import { TokenApi } from "../api/token.api";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TokenService extends TokenData {
  private api = inject(TokenApi);


  postToken(driveFileId: String): Observable<responseToken> {
    return this.api.postToken(driveFileId);
  }

  postTokenByDocumentId(documentId: number): Observable<responseToken> {
    return this.api.postTokenByDocumentId(documentId);
  }
}