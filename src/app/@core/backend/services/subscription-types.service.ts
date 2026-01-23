import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  SubscriptionTypesData, 
  SubscriptionType, 
  SubscriptionTypeDto,
  NivelEducativo
} from '../../data/subscription-types';
import { SubscriptionTypesApi } from '../api/subscription-types.api';

@Injectable()
export class SubscriptionTypesService extends SubscriptionTypesData {

  constructor(private api: SubscriptionTypesApi) {
    super();
  }

  // ========== MÉTODOS PÚBLICOS ==========

  getAll(): Observable<SubscriptionType[]> {
    return this.api.getAll();
  }

  getById(id: number): Observable<SubscriptionType> {
    return this.api.getById(id);
  }

  getByNivel(nivel: NivelEducativo): Observable<SubscriptionType[]> {
    return this.api.getByNivel(nivel);
  }

  getAllActive(): Observable<SubscriptionType[]> {
    return this.api.getAllActive();
  }

  getTitulos(id: number): Observable<string[]> {
    return this.api.getTitulos(id);
  }

  // ========== MÉTODOS ADMIN (Solo SUPADMIN) ==========

  create(dto: SubscriptionTypeDto): Observable<SubscriptionType> {
    return this.api.create(dto);
  }

  update(id: number, dto: SubscriptionTypeDto): Observable<SubscriptionType> {
    return this.api.update(id, dto);
  }

  toggleActivo(id: number): Observable<SubscriptionType> {
    return this.api.toggleActivo(id);
  }

  updatePosicion(id: number, nuevaPosicion: number): Observable<SubscriptionType> {
    return this.api.updatePosicion(id, nuevaPosicion);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(id);
  }
}
