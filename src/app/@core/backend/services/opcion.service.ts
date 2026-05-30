import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Opcion, OpcionData, OpcionDto } from '../../data/materia';
import { OpcionApi } from '../api/opcion.api';

@Injectable()
export class OpcionService extends OpcionData {
  private api = inject(OpcionApi);


  getById(id: number): Observable<Opcion> {
    return this.api.getById(id);
  }

  getByMateria(materiaId: number, incluirInactivas: boolean = false): Observable<Opcion[]> {
    return this.api.getByMateria(materiaId, incluirInactivas);
  }

  getActivasByMateria(materiaId: number): Observable<Opcion[]> {
    return this.api.getActivasByMateria(materiaId);
  }

  create(dto: OpcionDto): Observable<Opcion> {
    return this.api.create(dto);
  }

  update(id: number, dto: OpcionDto): Observable<Opcion> {
    return this.api.update(id, dto);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }

  toggleActivo(id: number): Observable<Opcion> {
    return this.api.toggleActivo(id);
  }

  updatePosicion(id: number, nuevaPosicion: number): Observable<Opcion> {
    return this.api.updatePosicion(id, nuevaPosicion);
  }
}
