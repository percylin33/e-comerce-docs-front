import { Observable } from "rxjs";

export interface GetDocumentsResponse {
  result: boolean;
  status: number;
  data: Document[];
  pagination: {
    paginaActual: number;
    cantidadDePaginas: number;
    cantidadDeDocumentos: number;
    cantidadElementosPorPagina: number;
  };
}

export interface GetDocumentDetailResponse {
  result: boolean;
  status: number;
  data: DocumentDetail;
}

export interface DocumentTable {
  id: number,
  title: string,
  format: string,
  price: number,
  category: string,
  numeroDePaginas: 1,
}

export interface DocumentDetail{
  id: number,
  title: string,
  format: string,
  category: string,
  description: string,
  price: number,
  numeroDePaginas: number,
  imagenUrlPublic: string,
  materia: string,
  nivel: string,
  grado: string | null; // Añadir esta propiedad
  urlImagenPrivate: string,
  countLikes: number,
  countPreView: number,
  documentoLibre: boolean;
}

export interface Document {
  id: number,
  title: string,
  category: string,
  description: string,
  format: string,
  materia: string,
  nivel: string,
  grado: string,
  numeroDePaginas: 1,
  fileUrlPublic: string,
  fileUrlPrivate: string,
  price: number,
  fileNameId: string,
  webViewLink: string,
  webContentLink: string,
  borradoLogico: boolean,
  countPreView: number,
  createdAt: string,
  fileCreateTime: number,
  fileDownLoadToken: string,
  imageCreateTime: number,
  imageDownLoadToken: string,
  imagenNameId: string,
  imagenUrlPublic: string,
  imagenUrl_private: string,
  countLikes: number,
  documentoLibre: boolean,
}



export abstract class DocumentData {
  abstract getDocuments(pagina: number, cantElementos: number): Observable<GetDocumentsResponse>;
  abstract getDocument(id: string): Observable<GetDocumentDetailResponse>;
  abstract getRecentDocuments(value: string): Observable<GetDocumentsResponse>;
  abstract delete(id: number): Observable<any>;
  abstract uploadDocument(fromData: FormData): Observable<any>;
  abstract updateDocument(id: string, fromData: FormData): Observable<any>;
  abstract putLikes(id: string): Observable<any>;
  abstract searchDocuments(key: string, value: string): Observable<GetDocumentsResponse>;
  abstract filterDocuments(params: Record<string, string>): Observable<GetDocumentsResponse>;
  abstract getDocumentServiceRecientes(): Observable<GetDocumentsResponse>;
  abstract getDocumentServiceMasVistos(): Observable<GetDocumentsResponse>;
  abstract getDocumentServiceMasVendidos(): Observable<GetDocumentsResponse>;
  abstract getDocumentBorradoLogico(pagina: number, cantElementos: number): Observable<GetDocumentsResponse>;
  abstract deleteDocumentFisico(id: number): Observable<any>;
  abstract downloadFree(idDocument: number, idUsuario: number): Observable<GetDocumentDetailResponse>;
  abstract getDocumentFree(): Observable<GetDocumentsResponse>;
}
