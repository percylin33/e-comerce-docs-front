import { Injectable } from "@angular/core";
import { ResponseSuscripciones, SuscripcionesData } from "../../interfaces/suscripciones";
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
}