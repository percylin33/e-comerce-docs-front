import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { GetGraphicsResponse } from "../../interfaces/graphics";

@Injectable({
    providedIn: 'root'
})
export class GraphicsApi {
    constructor(private api: HttpService) {}

    getGraphics(): Observable<GetGraphicsResponse> {
        return this.api.get('api/v1/dashboard/graphics');
    }

    getGraphicsSoles(): Observable<GetGraphicsResponse> {
        return this.api.get('api/v1/dashboard/graphicsSales');
    }

    getGraphicsPromotor(promotorId: string): Observable<GetGraphicsResponse> {
        return this.api.get(`api/v1/cupons/graficos/${promotorId}`);
    }
}
