import { Injectable } from '@angular/core';
import { DocumentData, GetDocumentDetailResponse, GetDocumentsResponse } from '../../interfaces/documents';
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

  searchDocuments(key: string, value: string): Observable<GetDocumentsResponse> {
    return this.api.searchDocuments(key, value);
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

  getDocumentFree(): Observable<GetDocumentsResponse> {
    return this.api.getDocumentFree();
  }

  getDocumentBorradoLogico(pagina: number, cantElementos: number): Observable<GetDocumentsResponse> {
    return this.api.getDocumentBorradoLogico(pagina, cantElementos);
  }

  deleteDocumentFisico(id: number): Observable<any> {
    return this.api.deleteDocumentFisico(id);
  }

  downloadFree(idDocument: number, idUsuario: number): Observable<GetDocumentDetailResponse> {
    return this.api.downloadFree(idDocument, idUsuario);
  }
}
