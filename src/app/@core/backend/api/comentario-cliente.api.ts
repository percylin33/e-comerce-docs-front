import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { ComentarioCliente } from '../../interfaces/comentario-cliente';

@Injectable({ providedIn: 'root' })
export class ComentarioClienteApi {
  constructor(private api: HttpService) {}

  getAll(): Observable<ComentarioCliente[]> {
    return this.api.get('api/v1/comentario-cliente');
  }

  getById(id: number): Observable<ComentarioCliente> {
    return this.api.get(`api/v1/comentario-cliente/${id}`);
  }

  create(comentario: ComentarioCliente): Observable<ComentarioCliente> {
    return this.api.post('api/v1/comentario-cliente', comentario);
  }

  update(id: number, comentario: ComentarioCliente): Observable<ComentarioCliente> {
    return this.api.put(`api/v1/comentario-cliente/${id}`, comentario);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`api/v1/comentario-cliente/${id}`);
  }
}
