import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { Equipo } from '../../interfaces/equipo';

@Injectable({ providedIn: 'root' })
export class EquipoApi {
  constructor(private api: HttpService) {}

  getAll(): Observable<Equipo[]> {
    return this.api.get('api/v1/equipo');
  }

  getById(id: number): Observable<Equipo> {
    return this.api.get(`api/v1/equipo/${id}`);
  }

  create(equipo: Equipo): Observable<Equipo> {
    return this.api.post('api/v1/equipo', equipo);
  }

  update(id: number, equipo: Equipo): Observable<Equipo> {
    return this.api.put(`api/v1/equipo/${id}`, equipo);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`api/v1/equipo/${id}`);
  }
}
