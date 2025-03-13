import { Observable } from "rxjs";

export interface User {
  id: string;
  name: string;
  email: string;
  totalFacturas: string;
  totalPagado: string;
  //avatar: string;
  roles: any[];
  //permissions: string[];
}

export interface SelectedUser {
  id: string;
  name: string;
  roles: Array<{id: number, name: string}>;
  checked: boolean;
}

export interface RecuperacionResponse {
  result: boolean;
  status: number;
  data: string | boolean;
  timestamp:string;
  pass_token?: string;
}

export interface Promotores {
  idPromotor: number;
  name: string;
  email: string;
  phone: string;
  totalRecaudado: Number;
}

export interface GetUserResponse {
  result: boolean;
  status: number;
  data: User[];
  timestamp:string;
  pagination: {
      paginaActual: number;
      cantidadDePaginas: number;
      cantidadDeDocumentos: number;
      cantidadElementosPorPagina: number;
    };
}

export interface GetPromotoresResponse {
  result: boolean;
  status: number;
  data: Promotores[];
  timestamp:string;
  pagination: {
      paginaActual: number;
      cantidadDePaginas: number;
      cantidadDeDocumentos: number;
      cantidadElementosPorPagina: number;
    };
}


export abstract class UserData {
  abstract getUsers(pagina: number, cantElementos: number): Observable<GetUserResponse>;
  abstract delete(id: string): Observable<any>;
  abstract searchUser(userEmail: string): Observable<GetUserResponse>;
  abstract updateRoles(id: string, updatedData: any): Observable<any>;
  abstract recuperacion(email: string): Observable<RecuperacionResponse>;
  abstract tokenRecuperacion(token: string, email: string): Observable<RecuperacionResponse>;
  abstract passwordRecuperacion(email: string, password: string, options?: any): Observable<RecuperacionResponse>;
  abstract getPromotores(): Observable<GetPromotoresResponse>;
}
