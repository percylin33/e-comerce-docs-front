import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { ResponseSuscripciones, ResponseSuscripcionesBoolean, ResponseSuscripcionesPayments } from "../../interfaces/suscripciones";

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

}