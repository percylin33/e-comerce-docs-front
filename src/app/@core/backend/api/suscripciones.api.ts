import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';
import { 
    ResponseSuscripciones, 
    ResponseSuscripcionesBoolean, 
    ResponseSuscripcionesPayments, 
    ResponseNextUnits, 
    ResponseUnitDetails, 
    EditSubscriptionRequest, 
    EditPaymentRequest,
    ResponseSubscriptionDetails, 
    ResponseSubscriptionDocuments,
    ResponseSuscripcionesEnhanced,
    ResponseSuscripcionesPaginated,
    ResponseDocumentsSummary,
    ResponseMaterias,
    ResponseOpciones,
    OpcionByMateria,
    ResponseActionLog
} from "../../interfaces/suscripciones";

@Injectable({
    providedIn: 'root'
})

export class SuscripcionesApi {
    constructor(private api: HttpService) { }

    getAllSuscripciones(): Observable<ResponseSuscripciones> {
        return this.api.get(`api/v1/suscription/all`);
    }

    /**
     * Nombres únicos de tipos de suscripción para dropdowns de filtro.
     * Endpoint: GET /api/v1/suscription/types
     */
    getSubscriptionTypes(): Observable<{ result: boolean; data: string[] }> {
        return this.api.get(`api/v1/suscription/types`);
    }

    getSuscripcionesByUser(userId: number): Observable<ResponseSuscripciones> {
        return this.api.get(`api/v1/suscription?idUser=${userId}`);
    }

    getPaymentsBySuscripcionId(suscripcionId: number): Observable<ResponseSuscripcionesPayments> {
        return this.api.get(`api/v1/suscription/payments/${suscripcionId}`);
    }

    putCancelarSuscripcion(suscripcionId: number, reason?: string): Observable<ResponseSuscripcionesBoolean> {
        const reasonParam = reason ? `?reason=${encodeURIComponent(reason)}` : '';
        return this.api.put(`api/v1/suscription/cancelar/${suscripcionId}${reasonParam}`);
    }

    putActivarSuscripcion(suscripcionId: number, dias: number, reason?: string): Observable<ResponseSuscripcionesBoolean> {
        const reasonParam = reason ? `?reason=${encodeURIComponent(reason)}` : '';
        return this.api.put(`api/v1/suscription/activar/${suscripcionId}/${dias}${reasonParam}`);
    }

    getActionLog(subscriptionId: number): Observable<ResponseActionLog> {
        return this.api.get(`api/v1/suscription/${subscriptionId}/action-log`);
    }

    getNextUnits(subscriptionId: number): Observable<ResponseNextUnits> {
        return this.api.get(`api/v1/suscription/${subscriptionId}/next-units`);
    }

    getUnitDetails(subscriptionTypeId: number, unidadNumero: number): Observable<ResponseUnitDetails> {
        return this.api.get(`api/v1/suscription/unit-details/${subscriptionTypeId}/${unidadNumero}`);
    }

    editSubscription(editData: EditSubscriptionRequest): Observable<ResponseSuscripcionesBoolean> {
        return this.api.post(`api/v1/suscription/edit`, editData);
    }

    getSubscriptionDetails(subscriptionId: number): Observable<ResponseSubscriptionDetails> {
        return this.api.get(`api/v1/suscription/details/${subscriptionId}`);
    }

    getDocumentsBySubscription(subscriptionId: number): Observable<ResponseSubscriptionDocuments> {
        return this.api.get(`api/v1/document/suscripciones/${subscriptionId}/documentos`);
    }

    editPayment(data: EditPaymentRequest): Observable<ResponseSuscripcionesBoolean> {
        return this.api.put(`api/v1/suscription/payment/edit`, data);
    }

    // ==================== NUEVOS ENDPOINTS OPTIMIZADOS ====================

    /**
     * Obtiene todas las suscripciones con contadores pre-calculados.
     * Elimina N+1 queries al incluir totalPayments, pendingPayments, etc.
     * Endpoint: GET /api/v1/suscription/all/summary
     */
    getAllSuscripcionesEnhanced(): Observable<ResponseSuscripcionesEnhanced> {
        return this.api.get(`api/v1/suscription/all/summary`);
    }

    /**
     * Obtiene suscripciones con paginación, filtros y búsqueda del servidor (Server-Side).
     * Optimizado para >300 suscripciones con carga inicial rápida.
     * 
     * @param params Parámetros de paginación y filtros:
     *   - status: 'ACTIVA' | 'INACTIVA' (opcional)
     *   - search: término de búsqueda (opcional)
     *   - type: tipo de suscripción (opcional)
     *   - page: número de página (0-indexed, default 0)
     *   - size: tamaño de página (default 25)
     *   - sort: 'campo,dirección' (ej: 'fechaInicio,desc')
     * 
     * Endpoint: GET /api/v1/suscription/all/summary/paginated?status=ACTIVA&page=0&size=25...
     */
    getAllSuscripcionesPaginated(params?: {
        status?: string;
        search?: string;
        type?: string;
        materia?: string;
        page?: number;
        size?: number;
        sort?: string;
    }): Observable<ResponseSuscripcionesPaginated> {
        let url = 'api/v1/suscription/all/summary/paginated';
        const queryParams: string[] = [];

        if (params) {
            if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
            if (params.search) queryParams.push(`search=${encodeURIComponent(params.search)}`);
            if (params.type) queryParams.push(`type=${encodeURIComponent(params.type)}`);
            if (params.materia) queryParams.push(`materia=${encodeURIComponent(params.materia)}`);
            if (typeof params.page === 'number') queryParams.push(`page=${params.page}`);
            if (typeof params.size === 'number') queryParams.push(`size=${params.size}`);
            if (params.sort) queryParams.push(`sort=${encodeURIComponent(params.sort)}`);
        }

        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }

        return this.api.get(url);
    }

    /**
     * Nombres de materias para un tipo de suscripción dado (filtro en cascada).
     * Endpoint: GET /api/v1/suscription/materias?type={typeName}
     */
    getMateriasByTypeName(typeName: string): Observable<{ result: boolean; data: string[] }> {
        return this.api.get(`api/v1/suscription/materias?type=${encodeURIComponent(typeName)}`);
    }

    /**
     * Obtiene una sola suscripción con sus contadores (para actualización selectiva).
     * Útil después de acciones como activar/cancelar para actualizar una sola fila.
     * Endpoint: GET /api/v1/suscription/{id}/summary
     */
    getSuscripcionEnhancedById(suscripcionId: number): Observable<ResponseSuscripcionesEnhanced> {
        return this.api.get(`api/v1/suscription/${suscripcionId}/summary`);
    }

    /**
     * Obtiene estructura ligera de documentos (solo conteos por nivel>materia>grado).
     * Reduce payload en ~90% al no incluir documentos completos.
     * Endpoint: GET /api/v1/suscription/{id}/documents/summary
     */
    getDocumentsSummary(suscripcionId: number): Observable<ResponseDocumentsSummary> {
        return this.api.get(`api/v1/suscription/${suscripcionId}/documents/summary`);
    }

    /**
     * Obtiene las materias disponibles para un tipo de suscripción.
     * Usado para seleccionar materias al editar una suscripción (solo SUPADMIN).
     * Endpoint: GET /api/v1/suscription/{subscriptionTypeId}/materias
     */
    getMateriasBySubscriptionType(subscriptionTypeId: number): Observable<ResponseMaterias> {
        return this.api.get(`api/v1/suscription/${subscriptionTypeId}/materias`);
    }

    /**
     * Obtiene las opciones disponibles para una materia específica.
     * Usado para seleccionar opciones dentro de cada materia (solo SUPADMIN).
     * Endpoint: GET /api/v1/suscription/{materiaId}/opciones
     */
    getOpcionesByMateria(materiaId: number): Observable<{ [key: string]: OpcionByMateria[] }> {
        return this.api.get(`api/v1/suscription/${materiaId}/opciones`);
    }
}