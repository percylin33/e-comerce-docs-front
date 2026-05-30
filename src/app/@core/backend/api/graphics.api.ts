import { Injectable, inject } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { GetGraphicsResponse } from "../../interfaces/graphics";

@Injectable({
    providedIn: 'root'
})
export class GraphicsApi {
    private api = inject(HttpService);


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
