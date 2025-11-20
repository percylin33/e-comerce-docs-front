import { Injectable } from '@angular/core';
import { LegalApi } from '../api/legal.api';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LegalService {
  constructor(private api: LegalApi) {}

  getAll(type?: string): Observable<any> {
    return this.api.getAll(type);
  }

  create(data: any, authorId?: number): Observable<any> {
    return this.api.create(data, authorId);
  }

  update(id: number, data: any, authorId?: number): Observable<any> {
    return this.api.update(id, data, authorId);
  }

  publish(id: number): Observable<any> {
    return this.api.publish(id);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(id);
  }
}
