import { Injectable, inject } from '@angular/core';
import { DocumentData, GetDocumentDetailResponse, GetDocumentSituacionesResponse, GetDocumentsResponse, GetAniosResponse } from '../../interfaces/documents';
import { Observable } from 'rxjs';
import { DocumentsApi } from '../api/documents.api';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService extends DocumentData {
  private api = inject(DocumentsApi);


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

  getDocumentServiceRecientes(pagina = 1, cantElementos = 10): Observable<GetDocumentsResponse> {
    return this.api.getDocumentRecientes(pagina, cantElementos);
  }

  getDocumentServiceMasVistos(pagina = 1, cantElementos = 10): Observable<GetDocumentsResponse> {
    return this.api.getDocumentMasVistos(pagina, cantElementos);
  }

  getDocumentServiceMasVendidos(pagina = 1, cantElementos = 10): Observable<GetDocumentsResponse> {
    return this.api.getDocumentMasVendidos(pagina, cantElementos);
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

  getAdminDownloadUrl(documentId: number): Observable<any> {
    return this.api.getAdminDownloadUrl(documentId);
  }

  confirmDownload(documentId: number): Observable<any> {
    return this.api.confirmDownload(documentId);
  }

  replaceCoverImage(documentId: number, file: File): Observable<any> {
    return this.api.replaceCoverImage(documentId, file);
  }

  replacePreview(documentId: number, file: File): Observable<any> {
    return this.api.replacePreview(documentId, file);
  }

  replaceMainFile(documentId: number, file: File): Observable<any> {
    return this.api.replaceMainFile(documentId, file);
  }
}
