import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Materia, MateriaData, MateriaDto } from '../../data/materia';
import { MateriaApi } from '../api/materia.api';

@Injectable()
export class MateriaService extends MateriaData {
  private api = inject(MateriaApi);


  getById(id: number): Observable<Materia> {
    return this.api.getById(id);
  }

  getBySubscriptionType(subscriptionTypeId: number, incluirInactivas: boolean = false): Observable<Materia[]> {
    return this.api.getBySubscriptionType(subscriptionTypeId, incluirInactivas);
  }

  getActivasBySubscriptionType(subscriptionTypeId: number): Observable<Materia[]> {
    return this.api.getActivasBySubscriptionType(subscriptionTypeId);
  }

  create(dto: MateriaDto): Observable<Materia> {
    return this.api.create(dto);
  }

  update(id: number, dto: MateriaDto): Observable<Materia> {
    return this.api.update(id, dto);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }

  toggleActivo(id: number): Observable<Materia> {
    return this.api.toggleActivo(id);
  }

  updatePosicion(id: number, nuevaPosicion: number): Observable<Materia> {
    return this.api.updatePosicion(id, nuevaPosicion);
  }
}
