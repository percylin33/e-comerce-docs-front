import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { Historia, HistoriaResponse } from '../../interfaces/historia';

@Injectable({ providedIn: 'root' })
export class HistoriaApi {
  constructor(private api: HttpService) {}

  getAll(): Observable<Historia[]> {
    return this.api.get('api/v1/historia');
  }

  getById(id: number): Observable<Historia> {
    return this.api.get(`api/v1/historia/${id}`);
  }

  create(historia: Historia): Observable<Historia> {
    return this.api.post('api/v1/historia', historia);
  }

  update(id: number, historia: Historia): Observable<Historia> {
    return this.api.put(`api/v1/historia/${id}`, historia);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`api/v1/historia/${id}`);
  }
}
