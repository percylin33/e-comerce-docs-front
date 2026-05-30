import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface TerminosCondiciones {
  id: number;
  titulo: string;
  contenido: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
  vistaPrevia: boolean;
}

@Injectable({ providedIn: 'root' })
export class TerminosCondicionesApi {
  private api = inject(HttpService);


  getAll(): Observable<TerminosCondiciones[]> {
    return this.api.get('api/v1/terminos-condiciones');
  }

  getById(id: number): Observable<TerminosCondiciones> {
    return this.api.get(`api/v1/terminos-condiciones/${id}`);
  }

  create(data: Partial<TerminosCondiciones>): Observable<TerminosCondiciones> {
    return this.api.post('api/v1/terminos-condiciones', data);
  }

  update(id: number, data: Partial<TerminosCondiciones>): Observable<TerminosCondiciones> {
    return this.api.put(`api/v1/terminos-condiciones/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`api/v1/terminos-condiciones/${id}`);
  }
}
