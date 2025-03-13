import { Injectable } from '@angular/core';
import { GetPromotoresResponse, GetUserResponse, RecuperacionResponse, User, UserData } from '../../interfaces/users';
import { Observable, throwError } from 'rxjs';
import { UsersApi } from '../api/users.api';
import { map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsersService extends UserData {

  constructor(private api: UsersApi) {
    super();
   }

  getUsers(pagina: number, cantElementos: number): Observable<GetUserResponse> {
    return this.api.getUsers(pagina, cantElementos);
  }

  delete(id: string): Observable<any> {
    return this.api.delete(id);
  }

  searchUser(userEmail: string): Observable<GetUserResponse> {
    return this.api.searchUser(userEmail);
  }

  updateRoles(id: string, updatedData: any): Observable<any> {
    return this.api.updateRoles(id, updatedData);
  }
  recuperacion(email: string): Observable<RecuperacionResponse> {
    return this.api.recuperacion(email);
  }

  tokenRecuperacion(token: string, email: string): Observable<RecuperacionResponse> {
    return this.api.tokenRecuperacion(token, email);
  }

  passwordRecuperacion(email: string, password: string, options?: any): Observable<RecuperacionResponse> {
    return this.api.passwordRecuperacion(email, password, options);
  }

  getPromotores(): Observable<GetPromotoresResponse> {
    return this.api.getPromotores();
  }
}
