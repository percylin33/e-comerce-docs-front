import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { MembresiaSuscripcionResponse, ResponseMembresia, ResponseMembresiaMateriasOpciones, ResponseMembresiaTiles, ResponseMembresiaValidateRevendedor } from "../../interfaces/membresia";

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
     getMateriasOpciones(subscriptionTypeId: number): Observable<ResponseMembresiaMateriasOpciones> {
        return this.api.get(`api/v1/suscription/${subscriptionTypeId}/materias`);
    }

    getTitleById(id: number): Observable<ResponseMembresiaTiles> {
        return this.api.get(`api/v1/subscription-type/title/${id}`);
    }

    getValidateRevendedor(userId: number, materiaToPurchase: string): Observable<ResponseMembresiaValidateRevendedor> {
        return this.api.get(`api/v1/suscription/${userId}/validate-materias?materiaToPurchase=${materiaToPurchase}`);
    }
}