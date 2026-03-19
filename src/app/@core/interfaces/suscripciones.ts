import { Observable } from "rxjs";

export interface ResponseSuscripciones {
  result: boolean;
  data: Suscripcion[];
  timestamp: string;
  status: number;
}

export interface ResponseSuscripcionesBoolean {
  result: boolean;
  data: boolean;
  timestamp: string;
  status: number;
}

export interface ResponseSuscripcionesPayments {
  result: boolean;
  data: Payment[];
  timestamp: string;
  status: number;
}

export interface ResponseNextUnits {
  result: boolean;
  data: UnitOption[];
  timestamp: string;
  status: number;
}

export interface ResponseUnitDetails {
  result: boolean;
  data: UnitDetails;
  timestamp: string;
  status: number;
}

export interface ResponseSubscriptionDetails {
  result: boolean;
  data: SubscriptionDetails;
  timestamp: string;
  status: number;
}

export interface Payment {
  paymentId: number;
  amount: number;
  paymentDate: string;
  paymentStatus: string;
}

export interface SubscriptionDetails {
  id: number;
  userName: string;
  subscriptionType: string;
  subscriptionTypeId: number;
  materiasOpcionesJson: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  fechaFinUnidad: string;
  unidadActual: number;
  unidadActualTitulo: string;
  unidadActualAnio?: number;
  unidadesAccesibles?: string;
}

export interface UnitOption {
  id: number;
  unidadNumero: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  subscriptionTypeId: number;
  anio?: number;
}

export interface UnitDetails {
  id: number;
  unidadNumero: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  subscriptionTypeId: number;
}

export interface EditSubscriptionRequest {
  subscriptionId: number;
  unitId?: number; // ID único de la unidad (recomendado)
  unidadNumero?: number; // Número de unidad (deprecated, usar unitId)
  fechaInicio?: string;
  fechaFinUnidad?: string;
  action: 'EDIT' | 'CANCEL';
  materiasOpcionesJson?: string; // JSON con materias y opciones seleccionadas
  reason?: string; // Motivo obligatorio de la acción — requerido desde el frontend
}

export interface MateriaOption {
  id: number;
  nombre: string;
  subscriptionTypeId: number;
}

export interface OpcionByMateria {
  id: number;
  nombre: string;
  materiaId: number;
}

export interface ResponseMaterias {
  result: boolean;
  data: MateriaOption[];
  timestamp: string;
  status: number;
}

export interface ResponseOpciones {
  result: boolean;
  data: OpcionByMateria[];
  timestamp: string;
  status: number;
}

export interface SubscriptionDocument {
  id: number;
  title: string;
  description: string;
  price: number;
  fileUrlPublic: string;
  nivel: string;
  materia: string;
  opcion: string;
}

export interface SubscriptionDocumentDetail {
  id: number;
  membresiaNombre: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  pagos: Payment[];
  documentos: SubscriptionDocument[];
  materiasOpcionesJson: string;
  // Estructura organizada de documentos por nivel > materia > grado
  documents?: {
    [nivel: string]: {
      [materia: string]: {
        [grado: string]: SubscriptionDocument[];
      };
    };
  };
}

export interface ResponseSubscriptionDocuments {
  result: boolean;
  data: { [key: string]: SubscriptionDocumentDetail[] };
  timestamp: string;
  status: number;
}

export interface Suscripcion {
  id: number;
  userName: string;
  userPhone?: string;
  subscriptionType: string;
  materiasOpcionesJson: string;
  startDate: string;
  endDate: string;
  status: string; // Activa o Inactiva
  /** Motivo de la última cancelación (solo INACTIVA). Viene del audit log del backend. */
  cancelReason?: string | null;
  /** Usuario/sistema que canceló (ej: 'sistema-job' o email del admin). */
  canceledBy?: string | null;
  /** Fecha/hora ISO de la cancelación. */
  canceledAt?: string | null;
}

// ==================== INTERFACES PARA ENDPOINTS OPTIMIZADOS ====================

/**
 * Contadores pre-calculados para pagos y documentos.
 * Reduce las queries N+1 al incluir estos datos en una sola llamada.
 */
export interface SubscriptionCounts {
  totalPayments: number;
  pendingPayments: number;
  overduePayments: number;
  totalDocuments: number;    // normalized field used by templates
  documentsCount?: number;   // field name sent by backend /all/summary/paginated
}

/**
 * Links HATEOAS para navegación eficiente.
 */
export interface SubscriptionLinks {
  self: string;
  payments: string;
  documents: string;
  details: string;
}

/**
 * Suscripción con contadores optimizados (evita N+1 queries).
 * Usada por el endpoint /all/summary
 */
export interface SuscripcionEnhanced extends Suscripcion {
  counts: SubscriptionCounts;
  links: SubscriptionLinks;
}

/**
 * Respuesta del endpoint optimizado /all/summary
 */
export interface ResponseSuscripcionesEnhanced {
  result: boolean;
  data: SuscripcionEnhanced[];
  timestamp: string;
  status: number;
}

/**
 * Respuesta paginada del endpoint server-side /all/summary/paginated
 * Incluye metadata de paginación (totalElements, totalPages, etc.)
 */
export interface ResponseSuscripcionesPaginated {
  result: boolean;
  data: PagedSuscripciones;
  timestamp: string;
  status: number;
}

/**
 * Estructura de datos paginados de Spring Data (Page)
 */
export interface PagedSuscripciones {
  content: SuscripcionEnhanced[];          // Items de la página actual
  pageable: {
    pageNumber: number;                    // Página actual (0-indexed)
    pageSize: number;                      // Tamaño de página
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;                   // Total de items (después de filtros)
  totalPages: number;                      // Total de páginas
  last: boolean;                           // ¿Es la última página?
  first: boolean;                          // ¿Es la primera página?
  size: number;                            // Tamaño de página
  number: number;                          // Número de página actual
  numberOfElements: number;                // Número de elementos en página actual
  empty: boolean;                          // ¿Página vacía?
}

/**
 * Estructura ligera de documentos: solo nivel > materia > grado > cantidad.
 * Reduce payload en ~90% comparado con documentos completos.
 */
export interface DocumentsSummaryStructure {
  [nivel: string]: {
    [materia: string]: {
      [grado: string]: number; // Solo cantidad de documentos
    };
  };
}

/**
 * Respuesta del endpoint ligero /documents/summary
 */
export interface ResponseDocumentsSummary {
  result: boolean;
  data: DocumentsSummaryStructure;
  timestamp: string;
  status: number;
}

// ==================== ABSTRACT CLASS ORIGINAL ====================

/** Single audit-log entry returned by GET /api/v1/suscription/{id}/action-log */
export interface SubscriptionActionLogEntry {
  id: number;
  subscriptionId: number;
  action: 'CANCELAR' | 'ACTIVAR' | 'EDITAR';
  reason: string;
  adminUsername: string;
  performedAt: string;
  extraData?: string;
}

export interface ResponseActionLog {
  result: boolean;
  data: SubscriptionActionLogEntry[];
  timestamp: string;
  status: number;
}

// ==================== ABSTRACT CLASS ORIGINAL ====================

export abstract class SuscripcionesData{
  abstract getAllSuscripciones(): Observable<ResponseSuscripciones>;
  abstract getPaymentsBySuscripcionId(suscripcionId: number): Observable<ResponseSuscripcionesPayments>;
  abstract putCancelarSuscripcion(suscripcionId: number, reason?: string): Observable<ResponseSuscripcionesBoolean>;
  abstract putActivarSuscripcion(suscripcionId: number, dias: number, reason?: string): Observable<ResponseSuscripcionesBoolean>;
  abstract getNextUnits(subscriptionId: number): Observable<ResponseNextUnits>;
  abstract getUnitDetails(subscriptionTypeId: number, unidadNumero: number): Observable<ResponseUnitDetails>;
  abstract editSubscription(editData: EditSubscriptionRequest): Observable<ResponseSuscripcionesBoolean>;
  abstract getSubscriptionDetails(subscriptionId: number): Observable<ResponseSubscriptionDetails>;
  abstract getDocumentsBySubscription(subscriptionId: number): Observable<ResponseSubscriptionDocuments>;
  abstract getActionLog(subscriptionId: number): Observable<ResponseActionLog>;
}