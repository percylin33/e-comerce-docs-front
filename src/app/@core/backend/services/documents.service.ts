import { Injectable } from '@angular/core';
import { DocumentData, GetDocumentDetailResponse, GetDocumentSituacionesResponse, GetDocumentsResponse, GetAniosResponse } from '../../interfaces/documents';
import { Observable } from 'rxjs';
import { DocumentsApi } from '../api/documents.api';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService extends DocumentData {

  constructor(private api: DocumentsApi) {
    super();
  }

  getDocuments(pagina: number, cantElementos: number): Observable<GetDocumentsResponse> {
    return this.api.getDocuments(pagina, cantElementos);
  }

  getDocument(id: string): Observable<GetDocumentDetailResponse> {
    return this.api.getDocument(id);
  }

  getRecentDocuments(value: string): Observable<GetDocumentsResponse> {
    return this.api.getRecentDocuments(value);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(id);
  }

  uploadDocument(formData: FormData): Observable<any> {
    return this.api.uploadDocument(formData);
  }

  updateDocument(id: string, fromData: FormData): Observable<any> {
    return this.api.updateDocument(id, fromData);
  }

  putLikes(id: string): Observable<any> {
    return this.api.putLikes(id);
  }

  searchDocuments(key: string, value: string, suscripcion?: boolean): Observable<GetDocumentsResponse> {
    return this.api.searchDocuments(key, value, suscripcion);
  }

  filterDocuments(params: Record<string, string>, pagina?: number, cantElementos?: number): Observable<GetDocumentsResponse> {
    return this.api.filterDocuments(params, pagina, cantElementos);
  }

  getDocumentServiceRecientes(): Observable<GetDocumentsResponse> {
    return this.api.getDocumentRecientes();
  }

  getDocumentServiceMasVistos(): Observable<GetDocumentsResponse> {
    return this.api.getDocumentMasVistos();
  }

  getDocumentServiceMasVendidos(): Observable<GetDocumentsResponse> {
    return this.api.getDocumentMasVendidos();
  }

  getDocumentFree(pagina: number, cantElementos: number): Observable<GetDocumentsResponse> {
    return this.api.getDocumentFree(pagina, cantElementos);
  }

  getDocumentBorradoLogico(pagina: number, cantElementos: number): Observable<GetDocumentsResponse> {
    return this.api.getDocumentBorradoLogico(pagina, cantElementos);
  }

  deleteDocumentFisico(id: number): Observable<any> {
    return this.api.deleteDocumentFisico(id);
  }

  downloadFree(idDocument: number, idUsuario: number): Observable<any> {
    return this.api.downloadFree(idDocument, idUsuario);
  }

  getSearch(params: Record<string, string>, pagina?: number, cantElementos?: number): Observable<GetDocumentsResponse> {
    return this.api.getSearch(params, pagina, cantElementos);
  }

  getSituaciones(): Observable<GetDocumentSituacionesResponse> {
    return this.api.getSituaciones();
  }

  getSituacionesByNivel(nivel: string): Observable<GetDocumentSituacionesResponse> {
    return this.api.getSituacionesByNivel(nivel);
  }

  getSituacionesByNivelAndAnio(nivel: string, anio: number): Observable<GetDocumentSituacionesResponse> {
    return this.api.getSituacionesByNivelAndAnio(nivel, anio);
  }

  getAniosSituaciones(): Observable<GetAniosResponse> {
    return this.api.getAniosSituaciones();
  }

  createSituacion(dto: any): Observable<any> {
    return this.api.createSituacion(dto);
  }

  updateSituacion(id: number, dto: any): Observable<any> {
    return this.api.updateSituacion(id, dto);
  }

  getUnitSchedules(): Observable<any> {
    return this.api.getUnitSchedules();
  }

  getUnitSchedulesBySubscriptionType(subscriptionTypeId: number): Observable<any> {
    return this.api.getUnitSchedulesBySubscriptionType(subscriptionTypeId);
  }

  getUnitSchedulesCurrent(subscriptionId: number): Observable<any> {
    return this.api.getUnitSchedulesCurrent(subscriptionId);
  }

  getUnitSchedulesHistory(subscriptionId: number): Observable<any> {
    return this.api.getUnitSchedulesHistory(subscriptionId);
  }

  getDownloadUrl(documentId: number): Observable<string> {
    return this.api.getDownloadUrl(documentId);
  }

  confirmDownload(documentId: number): Observable<any> {
    return this.api.confirmDownload(documentId);
  }
}
