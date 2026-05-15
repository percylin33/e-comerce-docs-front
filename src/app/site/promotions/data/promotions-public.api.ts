import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../@core/backend/api/http.service';
import { ApiEnvelope, HomePromotionCampaign } from '../models/home-promotion.types';

@Injectable({ providedIn: 'root' })
export class PromotionsPublicApi {
  private http = inject(HttpService);

  getHomePopup(): Observable<ApiEnvelope<HomePromotionCampaign | null>> {
    return this.http.get('api/v1/promotions/home-popup');
  }
}
