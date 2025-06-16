import { Injectable } from "@angular/core";
import { MembresiaData, MembresiaSuscripcionResponse, ResponseMembresia } from "../../interfaces/membresia";
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
}