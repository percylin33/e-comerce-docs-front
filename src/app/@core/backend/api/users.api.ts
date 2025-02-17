import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { GetUserResponse, RecuperacionResponse, User } from '../../interfaces/users';
import { HttpParams } from '@angular/common/http';

// interface UsersApiResponse {
//   result: boolean;
//   data: User[];
//   timestamp: string;
//   status: number;
// }

@Injectable({
  providedIn: 'root'
})
export class UsersApi {

  constructor(private api: HttpService) { }

  getUsers(pagina: number, cantElementos: number): Observable<GetUserResponse> { // Cambiar el tipo de retorno aquí
    return this.api.get(`api/v1/dashboard/users?pagina=${pagina}&cantElementos=${cantElementos}`);
  }

  delete(id: string): Observable<any> {
    return this.api.delete(`api/v1/dashboard/user/${id}`);
  }

  searchUser(userEmail: string): Observable<GetUserResponse> {
    const params = new HttpParams().set('userEmail', userEmail);
    return this.api.get(`api/v1/dashboard/searchUser`, { params });
  }

  updateRoles(id: string, updatedData: any): Observable<any> {
    return this.api.put(`api/v1/dashboard/user/${id}`, updatedData);
  }

  recuperacion(email: string): Observable<RecuperacionResponse> {
    return this.api.post(`api/v1/recuperacion`, { emailUsuario: email });
  }

  tokenRecuperacion(token: string, email: string): Observable<RecuperacionResponse> {
    return this.api.post(`api/v1/recuperacion/token`, { token: token, emailUsuario: email });
  }

  passwordRecuperacion(email: string, password: string, options: any): Observable<RecuperacionResponse> {
    return this.api.post(`api/v1/recuperacion/password`, { emailUsuario: email, password }, options);
  }
}
