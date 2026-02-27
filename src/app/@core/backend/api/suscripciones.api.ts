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
    ResponseSubscriptionDetails, 
    ResponseSubscriptionDocuments,
    ResponseSuscripcionesEnhanced,
    ResponseSuscripcionesPaginated,
    ResponseDocumentsSummary,
    ResponseMaterias,
    ResponseOpciones,
    OpcionByMateria
} from "../../interfaces/suscripciones";

@Injectable({
    providedIn: 'root'
})

export class SuscripcionesApi {
    constructor(private api: HttpService) { }

    getAllSuscripciones(): Observable<ResponseSuscripciones> {
        return this.api.get(`api/v1/suscription/all`);
    }

    getSuscripcionesByUser(userId: number): Observable<ResponseSuscripciones> {
        return this.api.get(`api/v1/suscription?idUser=${userId}`);
    }

    // New canonical endpoints to match frontend contract (/api/v1/memberships...)
    getMembershipsByUser(userId: number): Observable<ResponseSuscripciones> {
        return this.api.get(`api/v1/memberships?userId=${userId}`);
    }

    getMembershipPayments(membershipId: number): Observable<ResponseSuscripcionesPayments> {
        return this.api.get(`api/v1/memberships/${membershipId}/payments`);
    }

    getMembershipDetails(membershipId: number): Observable<ResponseSubscriptionDetails> {
        return this.api.get(`api/v1/memberships/${membershipId}/details`);
    }

    getMembershipDocuments(membershipId: number, params?: { level?: string; page?: number; size?: number }): Observable<ResponseSubscriptionDocuments> {
        // backend optimized endpoint for paginated documents
        let url = `api/v1/memberships/${membershipId}/documents`;
        if (params) {
            const qp: string[] = [];
            if (params.level) qp.push(`level=${encodeURIComponent(params.level)}`);
            if (typeof params.page === 'number') qp.push(`page=${params.page}`);
            if (typeof params.size === 'number') qp.push(`size=${params.size}`);
            if (qp.length) url += `?${qp.join('&')}`;
        }
        return this.api.get(url);
    }

    getMembershipById(membershipId: number, expand?: string): Observable<any> {
        // Basic details endpoint
        if (expand && expand.includes('documents')) {
            // combine details + documents server-side is not available, but client can request details then documents
            return this.getSubscriptionDetails(membershipId).pipe(
                // consumer can call getMembershipDocuments separately
                map((resp: any) => (resp.result ? resp.data : null))
            );
        }
        return this.getSubscriptionDetails(membershipId);
    }

    getPaymentsBySuscripcionId(suscripcionId: number): Observable<ResponseSuscripcionesPayments> {
        return this.api.get(`api/v1/suscription/payments/${suscripcionId}`);
    }

    putCancelarSuscripcion(suscripcionId: number): Observable<ResponseSuscripcionesBoolean> {
        return this.api.put(`api/v1/suscription/cancelar/${suscripcionId}`);
    }

    putActivarSuscripcion(suscripcionId: number, dias: number): Observable<ResponseSuscripcionesBoolean> {
        return this.api.put(`api/v1/suscription/activar/${suscripcionId}/${dias}`);
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