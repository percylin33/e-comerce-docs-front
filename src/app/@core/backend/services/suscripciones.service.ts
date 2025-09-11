import { Injectable } from "@angular/core";
import { ResponseSuscripciones, ResponseSuscripcionesBoolean, ResponseSuscripcionesPayments, SuscripcionesData, ResponseNextUnits, ResponseUnitDetails, EditSubscriptionRequest, ResponseSubscriptionDetails, ResponseSubscriptionDocuments } from "../../interfaces/suscripciones";
import { SuscripcionesApi } from "../api/suscripciones.api";
import { Observable } from "rxjs";


@Injectable({
  providedIn: 'root'
})

export class SuscripcionesService extends SuscripcionesData {
    constructor(private api: SuscripcionesApi) {
            super();
        }

    getAllSuscripciones(): Observable<ResponseSuscripciones> {
        return this.api.getAllSuscripciones();
    }

    getPaymentsBySuscripcionId(suscripcionId: number): Observable<ResponseSuscripcionesPayments> {
        return this.api.getPaymentsBySuscripcionId(suscripcionId);
    }

    putCancelarSuscripcion(suscripcionId: number): Observable<ResponseSuscripcionesBoolean> {
        return this.api.putCancelarSuscripcion(suscripcionId);
    }

    putActivarSuscripcion(suscripcionId: number, dias: number): Observable<ResponseSuscripcionesBoolean> {
        return this.api.putActivarSuscripcion(suscripcionId, dias);
    }

    getNextUnits(subscriptionId: number): Observable<ResponseNextUnits> {
        return this.api.getNextUnits(subscriptionId);
    }

    getUnitDetails(subscriptionTypeId: number, unidadNumero: number): Observable<ResponseUnitDetails> {
        return this.api.getUnitDetails(subscriptionTypeId, unidadNumero);
    }

    editSubscription(editData: EditSubscriptionRequest): Observable<ResponseSuscripcionesBoolean> {
        return this.api.editSubscription(editData);
    }

    getSubscriptionDetails(subscriptionId: number): Observable<ResponseSubscriptionDetails> {
        return this.api.getSubscriptionDetails(subscriptionId);
    }

    getDocumentsBySubscription(subscriptionId: number): Observable<ResponseSubscriptionDocuments> {
        return this.api.getDocumentsBySubscription(subscriptionId);
    }
}