import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ComentarioCliente } from '../../interfaces/comentario-cliente';
import { ComentarioClienteApi } from '../api/comentario-cliente.api';

@Injectable({ providedIn: 'root' })
export class ComentarioClienteService {
  constructor(private api: ComentarioClienteApi) {}

  getAll(): Observable<ComentarioCliente[]> {
    return this.api.getAll();
  }

  getById(id: number): Observable<ComentarioCliente> {
    return this.api.getById(id);
  }

  create(comentario: ComentarioCliente): Observable<ComentarioCliente> {
    return this.api.create(comentario);
  }

  update(id: number, comentario: ComentarioCliente): Observable<ComentarioCliente> {
    return this.api.update(id, comentario);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }
}
