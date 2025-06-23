import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { MembresiaSuscripcionResponse, ResponseMembresia } from "../../interfaces/membresia";

@Injectable({
  providedIn: 'root'
})

export class MembresiaApi {
    constructor(private api: HttpService) { }
    
    getMembresiaById(id: number): Observable<ResponseMembresia> {
        return this.api.get(`api/v1/subscription-type/${id}`);
    }

    getMembresiasUser(userId: number): Observable<MembresiaSuscripcionResponse> {
    return this.api.get(`api/v1/document/suscripciones/documentos?userId=${userId}`);
}
}