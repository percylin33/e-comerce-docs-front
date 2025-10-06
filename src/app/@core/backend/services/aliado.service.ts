import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Aliado } from '../../interfaces/aliado';
import { AliadoApi } from '../api/aliado.api';

@Injectable({ providedIn: 'root' })
export class AliadoService {
  constructor(private api: AliadoApi) {}

  getAll(): Observable<Aliado[]> {
    return this.api.getAll();
  }

  getById(id: number): Observable<Aliado> {
    return this.api.getById(id);
  }

  create(aliado: Aliado): Observable<Aliado> {
    return this.api.create(aliado);
  }

  update(id: number, aliado: Aliado): Observable<Aliado> {
    return this.api.update(id, aliado);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }
}
