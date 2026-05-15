import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../@core/backend/api/http.service';
import {
  ApiEnvelope,
  PromotionalCampaignAdmin,
  PromotionalCampaignSummaryAdmin,
  PromotionalSlideImageUploadResponse,
} from '../models/home-promotion.types';

@Injectable({ providedIn: 'root' })
export class PromotionsAdminApi {
  private http = inject(HttpService);

  list(): Observable<ApiEnvelope<PromotionalCampaignSummaryAdmin[]>> {
    return this.http.get('api/v1/admin/promotions');
  }

  get(id: number): Observable<ApiEnvelope<PromotionalCampaignAdmin>> {
    return this.http.get(`api/v1/admin/promotions/${id}`);
  }

  create(body: unknown): Observable<ApiEnvelope<PromotionalCampaignAdmin>> {
    return this.http.post('api/v1/admin/promotions', body);
  }

  update(id: number, body: unknown): Observable<ApiEnvelope<PromotionalCampaignAdmin>> {
    return this.http.put(`api/v1/admin/promotions/${id}`, body);
  }

  delete(id: number): Observable<ApiEnvelope<string>> {
    return this.http.delete(`api/v1/admin/promotions/${id}`);
  }

  /** Sube la imagen al backend; este guarda en Firebase (mismo servicio que kits/documentos). */
  uploadSlideImage(file: File): Observable<ApiEnvelope<PromotionalSlideImageUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post('api/v1/admin/promotions/upload-slide-image', formData);
  }
}
