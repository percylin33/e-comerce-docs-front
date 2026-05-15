import { Injectable, inject } from '@angular/core';
import { GetPromotoresResponse, GetUserResponse, RecuperacionResponse, responseUserUpdate, User, User2, UserData } from '../../interfaces/users';
import { Observable, throwError } from 'rxjs';
import { UsersApi } from '../api/users.api';
import { map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsersService extends UserData {
  private api = inject(UsersApi);


  getUsers(pagina: number, cantElementos: number, sortBy?: string, sortDirection?: string): Observable<GetUserResponse> {
    return this.api.getUsers(pagina, cantElementos, sortBy, sortDirection);
  }

  delete(id: string): Observable<any> {
    return this.api.delete(id);
  }

  searchUser(search: string): Observable<GetUserResponse> {
    return this.api.searchUser(search);
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

  getPromotores(pagina: number, cantElementos: number, search?: string, status?: string): Observable<GetPromotoresResponse> {
    return this.api.getPromotores(pagina, cantElementos, search, status);
  }

  getVentasPromotor(id: string): Observable<any> {
    // prefer POST body to avoid issues with empty or malformed path variables
    return this.api.postVentasPromotor(id);
  }

  postUpdateUser(formData: FormData): Observable<responseUserUpdate> {
    return this.api.postUpdateUser(formData);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ result: boolean; message?: string }> {
    return this.api.changePassword(currentPassword, newPassword);
  }

  getUserById(id: number): Observable<User2> {
    return this.api.getUserById(id);
  }
}
