// =====================================================
// KitApproval Service - PagesAdmin
// =====================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import {
  KitApprovalRequest,
  KitInfo,
  KitWithApproval,
  PendingApprovalResponse,
  ApprovalStats,
  ApprovalHistory,
  GenerateKitRequest,
  ApprovalActionRequest
} from '../models';

export interface ApprovalResponse {
  success: boolean;
  message: string;
  kit?: KitInfo;
}

export interface GenerateKitResponse {
  success: boolean;
  message: string;
  kit?: KitInfo;
  request?: KitApprovalRequest;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KitApprovalService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/admin/kit-approvals`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // APPROVAL REQUESTS
  // =====================================================

  /**
   * Get all pending approval requests
   */
  getPendingApprovals(): Observable<PendingApprovalResponse> {
    return this.http.get<PendingApprovalResponse>(`${this.baseUrl}/pending`);
  }

  /**
   * Get pending approvals with pagination
   */
  getPendingApprovalsPaginated(
    page: number = 0,
    size: number = 10
  ): Observable<PendingApprovalResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PendingApprovalResponse>(`${this.baseUrl}/pending`, { params });
  }

  /**
   * Get approval request by ID
   */
  getApprovalRequest(id: number): Observable<KitApprovalRequest> {
    return this.http.get<KitApprovalRequest>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get kit by ID
   */
  getKit(kitId: number): Observable<KitInfo> {
    return this.http.get<KitInfo>(`${this.baseUrl}/kit/${kitId}`);
  }

  /**
   * Get approval history for a kit
   */
  getApprovalHistory(kitId: number): Observable<ApprovalHistory> {
    return this.http.get<ApprovalHistory>(`${this.baseUrl}/history/${kitId}`);
  }

  // =====================================================
  // APPROVAL ACTIONS
  // =====================================================

  /**
   * Approve a kit
   */
  approveKit(id: number, adminNotes?: string): Observable<ApprovalResponse> {
    const body: ApprovalActionRequest = { adminNotes };
    return this.http.post<ApprovalResponse>(`${this.baseUrl}/${id}/approve`, body);
  }

  /**
   * Reject a kit
   */
  rejectKit(id: number, rejectionReason: string): Observable<ApprovalResponse> {
    const body: ApprovalActionRequest = { rejectionReason };
    return this.http.post<ApprovalResponse>(`${this.baseUrl}/${id}/reject`, body);
  }

  /**
   * Archive a kit (soft delete from visible kits)
   */
  archiveKit(kitId: number): Observable<ApprovalResponse> {
    return this.http.post<ApprovalResponse>(`${this.baseUrl}/kit/${kitId}/archive`, {});
  }

  // =====================================================
  // KIT GENERATION
  // =====================================================

  /**
   * Request generation of a new kit
   */
  generateKit(data: GenerateKitRequest): Observable<GenerateKitResponse> {
    return this.http.post<GenerateKitResponse>(`${this.baseUrl}/generate`, data);
  }

  /**
   * Request regeneration of existing kit
   */
  regenerateKit(kitId: number): Observable<ApprovalResponse> {
    return this.http.post<ApprovalResponse>(`${this.baseUrl}/${kitId}/regenerate`, {});
  }

  /**
   * Check if kit exists for given combination
   */
  checkKitExists(
    unitScheduleId: number,
    materiaId: number,
    opcionId: number
  ): Observable<KitInfo | null> {
    const params = new HttpParams()
      .set('unitScheduleId', unitScheduleId.toString())
      .set('materiaId', materiaId.toString())
      .set('opcionId', opcionId.toString());
    return this.http.get<KitInfo | null>(`${this.baseUrl}/check`, { params });
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  /**
   * Get approval statistics
   */
  getStats(): Observable<ApprovalStats> {
    return this.http.get<ApprovalStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Get all kits (not just pending)
   */
  getAllKits(status?: string): Observable<KitInfo[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<KitInfo[]>(`${this.baseUrl}/kits`, { params });
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Get available unit schedules for kit generation
   */
  getUnitSchedules(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/v1/unit-schedules`);
  }

  /**
   * Get materias by level
   */
  getMateriasByLevel(levelCode: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/v1/materias/level/${levelCode}`);
  }

  /**
   * Get opciones by materia
   */
  getOpcionesByMateria(materiaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/v1/opciones/materia/${materiaId}`);
  }

  /**
   * Get grades by level
   */
  getGradesByLevel(levelCode: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/v1/grades/level/${levelCode}`);
  }

  /**
   * Format time ago for display
   */
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES');
  }
}
