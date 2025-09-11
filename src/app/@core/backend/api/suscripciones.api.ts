import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { ResponseSuscripciones, ResponseSuscripcionesBoolean, ResponseSuscripcionesPayments, ResponseNextUnits, ResponseUnitDetails, EditSubscriptionRequest, ResponseSubscriptionDetails, ResponseSubscriptionDocuments } from "../../interfaces/suscripciones";

@Injectable({
  providedIn: 'root'
})

export class SuscripcionesApi {
    constructor(private api: HttpService) { }

    getAllSuscripciones(): Observable<ResponseSuscripciones> {
        return this.api.get(`api/v1/suscription/all`);
    }

    getPaymentsBySuscripcionId(suscripcionId: number): Observable<ResponseSuscripcionesPayments> {
        return this.api.get(`api/v1/suscription/payments/${suscripcionId}`);
    }

    putCancelarSuscripcion(suscripcionId: number): Observable<ResponseSuscripcionesBoolean> {
        return this.api.put(`api/v1/suscription/cancelar/${suscripcionId}`);
    }

    putActivarSuscripcion(suscripcionId: number, dias: number): Observable<ResponseSuscripcionesBoolean> {
        return this.api.put(`api/v1/suscription/activar/${suscripcionId}/${ dias }`);
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