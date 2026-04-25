import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { GetDocumentDetailResponse, GetDocumentSituacionesResponse, GetDocumentsResponse, GetAniosResponse } from '../../interfaces/documents';

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

  searchDocuments(key: string, value: string, suscripcion?: boolean): Observable<GetDocumentsResponse> {
    let endpoint = `api/v1/document/searchBy?key=${key}&value=${value}`;

    if (suscripcion !== undefined) {
      endpoint += `&suscripcion=${suscripcion}`;
    }

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

  getDocumentFree(pagina: number, cantElementos: number): Observable<GetDocumentsResponse> {
    return this.api.get(`api/v1/document/free?pagina=${pagina}&cantElementos=${cantElementos}`);
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

  downloadFree(idDocument: number, idUsuario: number): Observable<any> {
    return this.api.post(`api/v1/payment/free`, { idDocument, idUsuario });
  }

  getSearch(params: Record<string, string>, pagina: number, cantElementos: number): Observable<GetDocumentsResponse> {
    // Agregar parámetros de paginación
    params['pagina'] = pagina.toString();
    params['cantElementos'] = cantElementos.toString();

    const query = new URLSearchParams(params).toString();
    return this.api.get(`api/v1/document/search?${query}`);
  }

  getSituaciones(): Observable<GetDocumentSituacionesResponse> {
    return this.api.get(`api/v1/document/situaciones`);
  }

  getSituacionesByNivel(nivel: string): Observable<GetDocumentSituacionesResponse> {
    return this.api.get(`api/v1/document/situaciones?nivel=${nivel}`);
  }

  getSituacionesByNivelAndAnio(nivel: string, anio: number): Observable<GetDocumentSituacionesResponse> {
    return this.api.get(`api/v1/document/situaciones?nivel=${nivel}&anio=${anio}`);
  }

  getAniosSituaciones(): Observable<GetAniosResponse> {
    return this.api.get(`api/v1/document/situaciones/anios`);
  }

  createSituacion(dto: any): Observable<any> {
    return this.api.post(`api/v1/document/situaciones`, dto);
  }

  updateSituacion(id: number, dto: any): Observable<any> {
    return this.api.put(`api/v1/document/situaciones/${id}`, dto);
  }

  getUnitSchedules(): Observable<any> {
    return this.api.get('api/v1/unit-schedule');
  }

  getUnitSchedulesBySubscriptionType(subscriptionTypeId: number): Observable<any> {
    return this.api.get(`api/v1/unit-schedule/subscription-type/${subscriptionTypeId}`);
  }

  getUnitSchedulesCurrent(subscriptionId: number): Observable<any> {
    return this.api.get(`api/v1/units/current?subscriptionId=${subscriptionId}`);
  }

  getUnitSchedulesHistory(subscriptionId: number): Observable<any> {
    return this.api.get(`api/v1/units/history?subscriptionId=${subscriptionId}`);
  }

    getDownloadUrl(documentId: number): Observable<any> {
      return this.api.get(`api/v1/document/${documentId}/download-link`);
    }

    getAdminDownloadUrl(documentId: number): Observable<any> {
      return this.api.get(`api/v1/document/${documentId}/admin-download-link`);
    }

    confirmDownload(documentId: number): Observable<any> {
      return this.api.post(`api/v1/document/${documentId}/confirm-download`, {});
    }

    replaceCoverImage(documentId: number, file: File): Observable<any> {
      const fd = new FormData();
      fd.append('file', file, file.name);
      return this.api.patch(`api/v1/document/${documentId}/assets/cover-image`, fd);
    }

    replacePreview(documentId: number, file: File): Observable<any> {
      const fd = new FormData();
      fd.append('file', file, file.name);
      return this.api.patch(`api/v1/document/${documentId}/assets/preview`, fd);
    }

    replaceMainFile(documentId: number, file: File): Observable<any> {
      const fd = new FormData();
      fd.append('file', file, file.name);
      return this.api.patch(`api/v1/document/${documentId}/assets/main-file`, fd);
    }
}
