import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetGraphicsResponse } from '../../interfaces/graphics';
import { GraphicsApi } from '../api/graphics.api';

@Injectable({
    providedIn: 'root'
})
export class GraphicsService {
    constructor(private graphicsApi: GraphicsApi) {}

    getGraphics(): Observable<GetGraphicsResponse> {
        return this.graphicsApi.getGraphics();
    }
    getGraphicsSoles(): Observable<GetGraphicsResponse> {
        return this.graphicsApi.getGraphicsSoles();
    }
}
