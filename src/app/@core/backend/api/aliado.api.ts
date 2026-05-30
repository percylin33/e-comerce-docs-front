import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { Aliado } from '../../interfaces/aliado';

@Injectable({ providedIn: 'root' })
export class AliadoApi {
  private api = inject(HttpService);


  getAll(): Observable<Aliado[]> {
    return this.api.get('api/v1/aliado');
  }

  getById(id: number): Observable<Aliado> {
    return this.api.get(`api/v1/aliado/${id}`);
  }

  create(aliado: Aliado): Observable<Aliado> {
    return this.api.post('api/v1/aliado', aliado);
  }

  update(id: number, aliado: Aliado): Observable<Aliado> {
    return this.api.put(`api/v1/aliado/${id}`, aliado);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`api/v1/aliado/${id}`);
  }
}
