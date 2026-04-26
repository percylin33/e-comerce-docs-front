import { Injectable, inject } from '@angular/core';
import { ObjectivesApi } from '../api/objectives.api';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ObjectivesService {
  private api = inject(ObjectivesApi);


  getObjectives(): Observable<any> {
    return this.api.getObjectives();
  }

  createObjective(data: any, assignedToId?: number): Observable<any> {
    return this.api.createObjective(data, assignedToId);
  }

  updateObjective(id: number, data: any, assignedToId?: number): Observable<any> {
    return this.api.updateObjective(id, data, assignedToId);
  }

  deleteObjective(id: number): Observable<any> {
    return this.api.deleteObjective(id);
  }
}
