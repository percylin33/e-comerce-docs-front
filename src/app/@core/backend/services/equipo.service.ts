import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Equipo } from '../../interfaces/equipo';
import { EquipoApi } from '../api/equipo.api';

@Injectable({ providedIn: 'root' })
export class EquipoService {
  constructor(private api: EquipoApi) {}

  getAll(): Observable<Equipo[]> {
    return this.api.getAll();
  }

  getById(id: number): Observable<Equipo> {
    return this.api.getById(id);
  }

  create(equipo: Equipo): Observable<Equipo> {
    return this.api.create(equipo);
  }

  update(id: number, equipo: Equipo): Observable<Equipo> {
    return this.api.update(id, equipo);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }
}
