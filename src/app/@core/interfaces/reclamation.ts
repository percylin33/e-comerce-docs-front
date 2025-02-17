import { Observable } from "rxjs";
export interface Reclamation {
  // Identificación del cliente
  nombre: string;
  apellido: string;
  tipo_documento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  numero_documento: string;
  es_menor: boolean;

  // Ubicación y contacto
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  telefono?: string; // opcional
  email: string;

  // Datos de la reclamación
  fecha_incidente?: Date; // opcional
  tipo: 'queja' | 'reclamo';
  codigoTransaccion: string;
  detalle: string;

  // Conformidad
  aceptaTerminos: boolean;
}

export interface ReclamationResponse {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  estado: string;
  fecha: string;
  reclamo: string;
  respuesta: string;
  fechaRespuesta: string;
}

export interface PostReclamacionResponse {
  result: boolean;
  status: number;
  data: boolean;
  timestamp:string;
}

export interface GetReclamacionesResponse {
    result: boolean;
    status: number;
    data: ReclamationResponse[];
    timestamp:string;
    pagination: {
        paginaActual: number;
        cantidadDePaginas: number;
        cantidadDeDocumentos: number;
        cantidadElementosPorPagina: number;
      };
  }

export abstract class ReclamationData {

  abstract sendReclamation(reclamation: Reclamation): Observable<PostReclamacionResponse>;
  abstract getReclamaciones(pagina: number, cantElementos: number): Observable<GetReclamacionesResponse>;
  abstract updateReclamation(id: number, mensajeJson: String): Observable<PostReclamacionResponse>;
}
