import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PromotorProfileApi, PromotorProfile, ProfileResponse } from '../api/promotor-profile.api';

@Injectable({
  providedIn: 'root'
})
export class PromotorProfileService {
  private api = inject(PromotorProfileApi);


  getProfile(userId: number): Observable<ProfileResponse> {
    return this.api.getProfile(userId);
  }

  updatePersonalInfo(userId: number, data: Partial<PromotorProfile>, imageFile?: File): Observable<ProfileResponse> {
    return this.api.updatePersonalInfo(userId, data, imageFile);
  }

  updateBankingInfo(userId: number, data: Partial<PromotorProfile>): Observable<ProfileResponse> {
    return this.api.updateBankingInfo(userId, data);
  }

  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<ProfileResponse> {
    return this.api.changePassword(userId, currentPassword, newPassword);
  }

  deletePromotorRole(userId: number): Observable<ProfileResponse> {
    return this.api.deletePromotorRole(userId);
  }
}
