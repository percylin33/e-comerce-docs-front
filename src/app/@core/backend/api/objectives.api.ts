  import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { ResponseObjectives } from '../../interfaces/objectives';

@Injectable({ providedIn: 'root' })
export class ObjectivesApi {
  private api = inject(HttpService);


  getObjectives(): Observable<any> {
    return this.api.get('api/v1/promotores/objectives');
  }

  createObjective(data: any, assignedToId?: number): Observable<any> {
    const endpoint = assignedToId ? `api/v1/promotores/objectives?assignedToId=${assignedToId}` : 'api/v1/promotores/objectives';
    return this.api.post(endpoint, data);
  }

  updateObjective(id: number, data: any, assignedToId?: number): Observable<any> {
    const endpoint = assignedToId ? `api/v1/promotores/objectives/${id}?assignedToId=${assignedToId}` : `api/v1/promotores/objectives/${id}`;
    return this.api.put(endpoint, data);
  }

  deleteObjective(id: number): Observable<any> {
    return this.api.delete(`api/v1/promotores/objectives/${id}`);
  }

  // Nuevos métodos para promotores
  getObjectivesForPromotor(userId: number): Observable<ResponseObjectives> {
    return this.api.get(`api/v1/promotores/objectives/promotor/${userId}`);
  }

  getPersonalObjectives(userId: number): Observable<ResponseObjectives> {
    return this.api.get(`api/v1/promotores/objectives/promotor/${userId}/personal`);
  }

  getGeneralObjectives(): Observable<ResponseObjectives> {
    return this.api.get(`api/v1/promotores/objectives/general`);
  }
}
