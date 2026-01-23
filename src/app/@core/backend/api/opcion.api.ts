import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Opcion, OpcionDto } from '../../data/materia';
import { HttpService } from './http.service';

@Injectable()
export class OpcionApi {
  private readonly API_URL = 'api/v1/opciones';

  constructor(private api: HttpService) {}

  getById(id: number): Observable<Opcion> {
    return this.api.get(`${this.API_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  getByMateria(materiaId: number, incluirInactivas: boolean = false): Observable<Opcion[]> {
    return this.api.get(`${this.API_URL}/materia/${materiaId}?incluirInactivas=${incluirInactivas}`)
      .pipe(map(response => response.data));
  }

  getActivasByMateria(materiaId: number): Observable<Opcion[]> {
    return this.api.get(`${this.API_URL}/materia/${materiaId}/activas`)
      .pipe(map(response => response.data));
  }

  create(dto: OpcionDto): Observable<Opcion> {
    return this.api.post(this.API_URL, dto)
      .pipe(map(response => response.data));
  }

  update(id: number, dto: OpcionDto): Observable<Opcion> {
    return this.api.put(`${this.API_URL}/${id}`, dto)
      .pipe(map(response => response.data));
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`${this.API_URL}/${id}`);
  }

  toggleActivo(id: number): Observable<Opcion> {
    return this.api.put(`${this.API_URL}/${id}/toggle-activo`, {})
      .pipe(map(response => response.data));
  }

  updatePosicion(id: number, nuevaPosicion: number): Observable<Opcion> {
    return this.api.put(`${this.API_URL}/${id}/posicion?nuevaPosicion=${nuevaPosicion}`, {})
      .pipe(map(response => response.data));
  }
}
