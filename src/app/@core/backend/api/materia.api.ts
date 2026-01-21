import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Materia, MateriaData, MateriaDto } from '../../data/materia';
import { HttpService } from './http.service';

@Injectable()
export class MateriaApi {
  private readonly API_URL = 'api/v1/materias';

  constructor(private api: HttpService) {}

  getById(id: number): Observable<Materia> {
    return this.api.get(`${this.API_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  getBySubscriptionType(subscriptionTypeId: number, incluirInactivas: boolean = false): Observable<Materia[]> {
    return this.api.get(`${this.API_URL}/subscription-type/${subscriptionTypeId}?incluirInactivas=${incluirInactivas}`)
      .pipe(map(response => response.data));
  }

  getActivasBySubscriptionType(subscriptionTypeId: number): Observable<Materia[]> {
    return this.api.get(`${this.API_URL}/subscription-type/${subscriptionTypeId}/activas`)
      .pipe(map(response => response.data));
  }

  create(dto: MateriaDto): Observable<Materia> {
    return this.api.post(this.API_URL, dto)
      .pipe(map(response => response.data));
  }

  update(id: number, dto: MateriaDto): Observable<Materia> {
    return this.api.put(`${this.API_URL}/${id}`, dto)
      .pipe(map(response => response.data));
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`${this.API_URL}/${id}`);
  }

  toggleActivo(id: number): Observable<Materia> {
    return this.api.put(`${this.API_URL}/${id}/toggle-activo`, {})
      .pipe(map(response => response.data));
  }

  updatePosicion(id: number, nuevaPosicion: number): Observable<Materia> {
    return this.api.put(`${this.API_URL}/${id}/posicion?nuevaPosicion=${nuevaPosicion}`, {})
      .pipe(map(response => response.data));
  }
}
