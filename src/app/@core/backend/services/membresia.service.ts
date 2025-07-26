import { Injectable } from "@angular/core";
import { MembresiaData, MembresiaSuscripcionResponse, ResponseMembresia, ResponseMembresiaMateriasOpciones, ResponseMembresiaTiles, ResponseMembresiaValidateRevendedor } from "../../interfaces/membresia";
import { Observable } from "rxjs";
import { MembresiaApi } from "../api/membresia.api";

@Injectable({
  providedIn: 'root'
})



export class MembresiaService extends MembresiaData {
    constructor(private api: MembresiaApi) {
        super();
    }
    getMembresiaById(id: number):Observable<ResponseMembresia> {
        return this.api.getMembresiaById(id);
    }
    getMembresiasUser(userId: number): Observable<MembresiaSuscripcionResponse> {
        return this.api.getMembresiasUser( userId);
    }
    getMateriasOpciones(subscriptionTypeId: number): Observable<ResponseMembresiaMateriasOpciones> {
        return this.api.getMateriasOpciones(subscriptionTypeId);
    }
    getTitleById(id: number): Observable<ResponseMembresiaTiles> {
        return this.api.getTitleById(id);
    }
    getValidateRevendedor(userId: number, materiaNombre: string): Observable<ResponseMembresiaValidateRevendedor> {
        return this.api.getValidateRevendedor(userId, materiaNombre);
    }
}