import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiWrapped,
  GradeEquivalenceDto,
  GradeEquivalenceCreate,
  GradeOption,
  KitApprovalRequestDto,
  KitApprovalRequestCreate,
  BulkGenerateRequest,
  BulkGenerateResponse,
  UnitScheduleOption,
  MateriaOption,
  OpcionOption,
  MissingKitsResponseDto,
  KitStatusResponseDto,
  CombinationDetailDto
} from '../../interfaces/kit-approval';
import { KitApprovalApi } from '../api/kit-approval.api';

@Injectable({
  providedIn: 'root'
})
export class GradeEquivalenceService {
  private api: KitApprovalApi;

  constructor() {
    const api = inject(KitApprovalApi);

    this.api = api;
  }

  getAll(): Observable<ApiWrapped<GradeEquivalenceDto[]>> {
    return this.api.getAllEquivalences();
  }

  getById(id: number): Observable<ApiWrapped<GradeEquivalenceDto>> {
    return this.api.getEquivalenceById(id);
  }

  getByLevel(levelCode: string): Observable<ApiWrapped<GradeEquivalenceDto[]>> {
    return this.api.getEquivalencesByLevel(levelCode);
  }

  create(data: GradeEquivalenceCreate): Observable<ApiWrapped<GradeEquivalenceDto>> {
    return this.api.createEquivalence(data);
  }

  update(id: number, data: GradeEquivalenceCreate): Observable<ApiWrapped<GradeEquivalenceDto>> {
    return this.api.updateEquivalence(id, data);
  }

  delete(id: number): Observable<ApiWrapped<void>> {
    return this.api.deleteEquivalence(id);
  }

  getLevels(): Observable<ApiWrapped<string[]>> {
    return this.api.getLevels();
  }

  getGradesForLevel(levelCode: string): Observable<ApiWrapped<GradeOption[]>> {
    return this.api.getGradesForLevel(levelCode);
  }

  getMateriasForLevel(levelCode: string): Observable<ApiWrapped<MateriaOption[]>> {
    return this.api.getMateriasForLevel(levelCode);
  }

  getOpcionesForMateria(materiaId: number): Observable<ApiWrapped<OpcionOption[]>> {
    return this.api.getOpcionesForMateria(materiaId);
  }

  checkDuplicate(levelCode: string, materiaId: number, opcionId: number): Observable<ApiWrapped<{ exists: boolean, message: string }>> {
    return this.api.checkDuplicate(levelCode, materiaId, opcionId);
  }
}

@Injectable({
  providedIn: 'root'
})
export class KitApprovalService {
  private api: KitApprovalApi;

  constructor() {
    const api = inject(KitApprovalApi);

    this.api = api;
  }

  getAll(page: number = 0, size: number = 20, filters?: {
    status?: string;
    subscriptionTypeId?: number;
    anio?: number;
    unitScheduleId?: number;
    materiaId?: number;
    opcionId?: number;
  }): Observable<ApiWrapped<any>> {
    return this.api.getAllRequests(page, size, filters);
  }

  getFilterOptions(params?: {
    subscriptionTypeId?: number;
    anio?: number;
    materiaId?: number;
  }): Observable<ApiWrapped<any>> {
    return this.api.getFilterOptions(params);
  }

  getById(id: number): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.getRequestById(id);
  }

  create(data: KitApprovalRequestCreate): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.createRequest(data);
  }

  approve(id: number): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.approveRequest(id);
  }

  reject(id: number, reason: string): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.rejectRequest(id, reason);
  }

  updateKit(approvalId: number, data: { title?: string; description?: string; price?: number; imagenUrlPublic?: string; pdfPreviewUrl?: string; numeroDePaginas?: number }): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.updateKit(approvalId, data);
  }

  uploadKitPreview(approvalId: number, file: File): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.uploadKitPreview(approvalId, file);
  }

  uploadKitImage(approvalId: number, file: File): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.uploadKitImage(approvalId, file);
  }

  delete(id: number): Observable<ApiWrapped<void>> {
    return this.api.deleteRequest(id);
  }

  bulkGenerate(adminUserId: number, data: BulkGenerateRequest): Observable<ApiWrapped<BulkGenerateResponse>> {
    return this.api.bulkGenerate(adminUserId, data);
  }

  getUnitSchedules(): Observable<any[]> {
    return this.api.getUnitSchedules();
  }

  getMissingKits(): Observable<ApiWrapped<MissingKitsResponseDto>> {
    return this.api.getMissingKits();
  }

  getKitStatus(anio: number, nivel: string): Observable<ApiWrapped<KitStatusResponseDto>> {
    return this.api.getKitStatus(anio, nivel);
  }

  getCombinationDetail(unitScheduleId: number, materiaId: number, opcionId: number): Observable<ApiWrapped<CombinationDetailDto>> {
    return this.api.getCombinationDetail(unitScheduleId, materiaId, opcionId);
  }

  generateSingleKit(unitScheduleId: number, materiaId: number, opcionId: number): Observable<ApiWrapped<any>> {
    return this.api.generateSingleKit(unitScheduleId, materiaId, opcionId);
  }
}
