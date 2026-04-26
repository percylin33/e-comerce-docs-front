import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { GetPromotoresResponse, GetUserResponse, RecuperacionResponse, responseUserUpdate, User, User2, UserUpdateDto } from '../../interfaces/users';
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
  private api = inject(HttpService);


  getUsers(pagina: number, cantElementos: number, sortBy?: string, sortDirection?: string): Observable<GetUserResponse> { // Cambiar el tipo de retorno aquí
    let url = `api/v1/dashboard/users?pagina=${pagina}&cantElementos=${cantElementos}`;
    
    if (sortBy && sortDirection) {
      url += `&sortBy=${sortBy}&sortDirection=${sortDirection}`;
    }
    
    return this.api.get(url);
  }

  delete(id: string): Observable<any> {
    return this.api.delete(`api/v1/dashboard/user/${id}`);
  }

  searchUser(search: string): Observable<GetUserResponse> {
    const params = new HttpParams().set('search', search);
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

  getPromotores(pagina: number, cantElementos: number, search?: string, status?: string): Observable<GetPromotoresResponse> {
    const params = new HttpParams()
      .set('pagina', String(pagina))
      .set('cantElementos', String(cantElementos));

    let finalParams = params;
    if (search !== undefined && search !== null && search !== '') {
      finalParams = finalParams.set('search', search);
    }
    if (status !== undefined && status !== null && status !== '') {
      finalParams = finalParams.set('status', status);
    }

    return this.api.get(`api/v1/dashboard/promotores`, { params: finalParams });
  }

  getVentasPromotor(id: string): Observable<any> {
    return this.api.get(`api/v1/dashboard/ventasPromotor/${id}`);
  }

  postVentasPromotor(id: string): Observable<any> {
    // send id in body to avoid path-variable parsing issues on the server
    return this.api.post(`api/v1/dashboard/ventasPromotor`, { id });
  }

  postUpdateUser(formData: FormData): Observable<responseUserUpdate> {
    return this.api.post(`auth/update-user`, formData);
  }

  getUserById(id: number): Observable<User2> {
    return this.api.get(`auth/user/${id}`);
  }
}