import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { GetDocumentDetailResponse, GetDocumentsResponse } from '../../interfaces/documents';

@Injectable({
  providedIn: 'root'
})
export class DocumentsApi {

  constructor(private api: HttpService) { }
  
  getDocuments(pagina: number, cantElementos: number): Observable<GetDocumentsResponse> {
    return this.api.get(`api/v1/dashboard?pagina=${pagina}&cantElementos=${cantElementos}`);
  }

  uploadDocument(formData: FormData): Observable<any> {
    return this.api.post('api/v1/dashboard', formData);
  }

  getDocument(id: string): Observable<GetDocumentDetailResponse> {
    return this.api.get(`api/v1/document/${id}`);
  }


  delete(id: number): Observable<any> {
    return this.api.delete(`api/v1/dashboard/${id}`);
}
  putLikes(id: string): Observable<any> {
    return this.api.put(`api/v1/document/likes/${id}`);
  }

  getRecentDocuments(value: string): Observable<GetDocumentsResponse> {
    return this.api.get(`api/v1/document/searchBy?key=category&value=${value}`);

  }

  updateDocument(id: string, fromData: FormData): Observable<any> {
    return this.api.put(`api/v1/dashboard/${id}`, fromData);
  }

  searchDocuments(key: string, value: string): Observable<GetDocumentsResponse> {
    const endpoint = `api/v1/document/searchBy?key=${key}&value=${value}`;
    return this.api.get(endpoint);
  }


  filterDocuments(params: Record<string, string>, pagina?: number, cantElementos?: number): Observable<GetDocumentsResponse> {
    // Agregar parámetros de paginación si se proporcionan
    if (pagina !== undefined && cantElementos !== undefined) {
      params['pagina'] = pagina.toString();
      params['cantElementos'] = cantElementos.toString();
    }
    
    const query = new URLSearchParams(params).toString();
    const endpoint = `api/v1/document/filtros?${query}`;
    return this.api.get(endpoint);
  }
  getDocumentRecientes(): Observable<GetDocumentsResponse> {
    return this.api.get('api/v1/document/recientes?pagina=1&cantElementos=10');
  }

  getDocumentMasVistos(): Observable<GetDocumentsResponse> {
    return this.api.get('api/v1/document/masvistos?pagina=1&cantElementos=10');
  }

  getDocumentFree(): Observable<GetDocumentsResponse> {
    return this.api.get('api/v1/document/free?pagina=1&cantElementos=33');
  }

  getDocumentMasVendidos(): Observable<GetDocumentsResponse> {
    return this.api.get('api/v1/document/masvendidos?pagina=1&cantElementos=10');
  }

  getDocumentBorradoLogico(pagina: number, cantElementos: number): Observable<GetDocumentsResponse> {
    return this.api.get(`api/v1/dashboard/borradoslogicos?pagina=${pagina}&cantElementos=${cantElementos}`);
  }

  deleteDocumentFisico(id: number): Observable<any> {
    return this.api.delete(`api/v1/dashboard/fisico/${id}`);
  }

  downloadFree(idDocument: number, idUsuario: number): Observable<GetDocumentDetailResponse> {
    return this.api.post(`api/v1/payment/free`, {idDocument, idUsuario});
  }
}
