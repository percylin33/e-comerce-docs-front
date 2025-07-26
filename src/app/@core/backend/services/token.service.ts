import { Injectable } from "@angular/core";
import { responseToken, TokenData } from "../../interfaces/token";
import { TokenApi } from "../api/token.api";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TokenService extends TokenData {

  constructor(private api: TokenApi) {
    super();
   }

  postToken(driveFileId: String): Observable<responseToken> {
    return this.api.postToken(driveFileId);
  }
}