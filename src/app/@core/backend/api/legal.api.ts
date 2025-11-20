import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LegalApi {
  constructor(private api: HttpService) {}

  getAll(type?: string): Observable<any> {
    const params: any = {};
    if (type) params.type = type;
    return this.api.get('api/v1/promotores/legal-texts', { params });
  }

  create(data: any, authorId?: number): Observable<any> {
    const endpoint = authorId ? `api/v1/promotores/legal-texts?authorId=${authorId}` : 'api/v1/promotores/legal-texts';
    return this.api.post(endpoint, data);
  }

  update(id: number, data: any, authorId?: number): Observable<any> {
    const endpoint = authorId ? `api/v1/promotores/legal-texts/${id}?authorId=${authorId}` : `api/v1/promotores/legal-texts/${id}`;
    return this.api.put(endpoint, data);
  }

  publish(id: number): Observable<any> {
    return this.api.put(`api/v1/promotores/legal-texts/${id}/publish`, {});
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`api/v1/promotores/legal-texts/${id}`);
  }
}
