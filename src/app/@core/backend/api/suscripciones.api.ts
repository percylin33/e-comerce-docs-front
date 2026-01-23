import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';
import { ResponseSuscripciones, ResponseSuscripcionesBoolean, ResponseSuscripcionesPayments, ResponseNextUnits, ResponseUnitDetails, EditSubscriptionRequest, ResponseSubscriptionDetails, ResponseSubscriptionDocuments } from "../../interfaces/suscripciones";

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
}