import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface PromotorProfile {
  id: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  dni: string;
  ruc: string;
  image: string;
  country: string;
  banco: string;
  cuenta: string;
  cuentaCci: string;
  descuento: string;
  abono: string;
  cuponCode: string;
  totalRecaudado: number;
}

export interface ProfileResponse {
  result: boolean;
  data: PromotorProfile;
  message?: string;
  timestamp: string;
  status: number;
}

@Injectable({
  providedIn: 'root'
})
export class PromotorProfileApi {

  constructor(private api: HttpService) { }

  getProfile(userId: number): Observable<ProfileResponse> {
    return this.api.get(`api/v1/promotores/profile/${userId}`);
  }

  updatePersonalInfo(userId: number, data: Partial<PromotorProfile>, imageFile?: File): Observable<ProfileResponse> {
    if (imageFile) {
      const formData = new FormData();
      formData.append('profile', JSON.stringify(data));
      formData.append('image', imageFile);
      return this.api.put(`api/v1/promotores/profile/${userId}/personal`, formData);
    } else {
      const formData = new FormData();
      formData.append('profile', JSON.stringify(data));
      return this.api.put(`api/v1/promotores/profile/${userId}/personal`, formData);
    }
  }

  updateBankingInfo(userId: number, data: Partial<PromotorProfile>): Observable<ProfileResponse> {
    return this.api.put(`api/v1/promotores/profile/${userId}/banking`, data);
  }

  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<ProfileResponse> {
    return this.api.put(`api/v1/promotores/profile/${userId}/password`, {
      currentPassword,
      newPassword
    });
  }

  deletePromotorRole(userId: number): Observable<ProfileResponse> {
    return this.api.delete(`api/v1/promotores/profile/${userId}/promotor-role`);
  }
}
