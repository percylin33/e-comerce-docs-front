import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PreEmbajador, PreEmbajadorResponse } from '../api/preembajador.api';
import { PreEmbajadorApi } from '../api/preembajador.api';

@Injectable({ providedIn: 'root' })
export class PreEmbajadorService {
  constructor(private api: PreEmbajadorApi) {}

  postPreEmbajador(data: PreEmbajador): Observable<PreEmbajadorResponse> {
    return this.api.postPreEmbajador(data);
  }

  getPendingPreEmbajadores(): Observable<PreEmbajador[]> {
    return this.api.getPendingPreEmbajadores();
  }

  updateProceso(id: number, proceso: boolean): Observable<any> {
    return this.api.updateProceso(id, proceso);
  }
}
