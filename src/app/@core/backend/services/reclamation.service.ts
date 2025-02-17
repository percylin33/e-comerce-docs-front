import { Injectable } from '@angular/core';
import { ReclamationApi } from '../api/reclamation.api';
import { GetReclamacionesResponse, PostReclamacionResponse, Reclamation, ReclamationData } from '../../interfaces/reclamation';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReclamationService extends ReclamationData {
  constructor(private api: ReclamationApi) {
    super();
  }

  sendReclamation(data: Reclamation): Observable<PostReclamacionResponse> {
    return this.api.sendReclamation(data);
  }

  getReclamaciones(pagina: number, cantElementos: number): Observable<GetReclamacionesResponse> {
    return this.api.getReclamaciones(pagina, cantElementos);
  }

  updateReclamation(id: number, mensajeJson: String): Observable<PostReclamacionResponse> {
    return this.api.updateReclamation(id, mensajeJson);
  }
}
