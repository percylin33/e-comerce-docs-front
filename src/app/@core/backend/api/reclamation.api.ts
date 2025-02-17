import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { GetReclamacionesResponse, PostReclamacionResponse, Reclamation } from '../../interfaces/reclamation';

@Injectable({
  providedIn: 'root'
})
export class ReclamationApi {
  constructor(private api: HttpService) { }

  sendReclamation(data: Reclamation): Observable<PostReclamacionResponse> {
    return this.api.post('api/v1/libro-reclamaciones', data);
  }

  getReclamaciones(pagina: number, cantElementos: number): Observable<GetReclamacionesResponse> {
    return this.api.get(`api/v1/libro-reclamaciones?pagina=${pagina}&cantElementos=${cantElementos}`);
  }

  updateReclamation(id: number, mensajeJson: String): Observable<PostReclamacionResponse> {
    return this.api.put(`api/v1/libro-reclamaciones/${id}`, mensajeJson);
  }
}
