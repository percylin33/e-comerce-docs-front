import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Historia } from '../../interfaces/historia';
import { HistoriaApi } from '../api/historia.api';

@Injectable({ providedIn: 'root' })
export class HistoriaService {
  private api = inject(HistoriaApi);


  getAll(): Observable<Historia[]> {
    return this.api.getAll();
  }

  getById(id: number): Observable<Historia> {
    return this.api.getById(id);
  }

  create(historia: Historia): Observable<Historia> {
    return this.api.create(historia);
  }

  update(id: number, historia: Historia): Observable<Historia> {
    return this.api.update(id, historia);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }
}
