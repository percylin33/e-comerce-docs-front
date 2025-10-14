import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface PreEmbajador {
  nombres: string;
  apellidos: string;
  dni: string;
  ruc: string;
  email: string;
  telefono: string;
  banco: string;
  cuenta: string;
  proceso?: boolean;
  pais: string;
}

export interface PreEmbajadorResponse {
  result: boolean;
  data: PreEmbajador;
  timestamp: string;
  status: number;
}

@Injectable({ providedIn: 'root' })
export class PreEmbajadorApi {
  constructor(private api: HttpService) {}

  postPreEmbajador(data: PreEmbajador): Observable<PreEmbajadorResponse> {
    return this.api.post('api/v1/dashboard/pre-embajadores', data);
  }

  // Obtener preembajadores con proceso = null
  getPendingPreEmbajadores(): Observable<PreEmbajador[]> {
    return this.api.get('api/v1/dashboard/pre-embajadores/pending');
  }

  // Actualizar el campo proceso (true/false)
  updateProceso(id: number, proceso: boolean): Observable<any> {
    return this.api.put(`api/v1/dashboard/pre-embajadores/${id}/proceso?proceso=${proceso}`, {});
  }
}
