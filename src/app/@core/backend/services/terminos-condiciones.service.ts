import { Injectable } from '@angular/core';
import { TerminosCondicionesApi, TerminosCondiciones } from '../api/terminos-condiciones.api';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TerminosCondicionesService {
  constructor(private api: TerminosCondicionesApi) {}

  getAll(): Observable<TerminosCondiciones[]> {
    return this.api.getAll();
  }

  getVistaPrevia(): Observable<TerminosCondiciones[]> {
    return this.api.getAll(); // Filtrado en el componente
  }

  getModal(): Observable<TerminosCondiciones[]> {
    return this.api.getAll(); // Filtrado en el componente
  }

  create(data: Partial<TerminosCondiciones>): Observable<TerminosCondiciones> {
    return this.api.create(data);
  }

  update(id: number, data: Partial<TerminosCondiciones>): Observable<TerminosCondiciones> {
    return this.api.update(id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }
}
