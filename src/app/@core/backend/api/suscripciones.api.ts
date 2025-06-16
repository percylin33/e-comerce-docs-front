import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { ResponseSuscripciones } from "../../interfaces/suscripciones";

@Injectable({
  providedIn: 'root'
})

export class SuscripcionesApi {
    constructor(private api: HttpService) { }

    getAllSuscripciones(): Observable<ResponseSuscripciones> {
        return this.api.get(`api/v1/document/suscripciones/all`);
    }

}