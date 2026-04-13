import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class KitApprovalApi {

  constructor(private api: HttpService) { }

  // =============================================
  // GradeEquivalence Endpoints
  // =============================================

  getAllEquivalences(): Observable<ApiWrapped<GradeEquivalenceDto[]>> {
    return this.api.get(`api/v1/admin/grade-equivalences`);
  }

  getEquivalenceById(id: number): Observable<ApiWrapped<GradeEquivalenceDto>> {
    return this.api.get(`api/v1/admin/grade-equivalences/${id}`);
  }

  getEquivalencesByLevel(levelCode: string): Observable<ApiWrapped<GradeEquivalenceDto[]>> {
    return this.api.get(`api/v1/admin/grade-equivalences?level=${levelCode}`);
  }

  createEquivalence(data: GradeEquivalenceCreate): Observable<ApiWrapped<GradeEquivalenceDto>> {
    return this.api.post(`api/v1/admin/grade-equivalences`, data);
  }

  updateEquivalence(id: number, data: GradeEquivalenceCreate): Observable<ApiWrapped<GradeEquivalenceDto>> {
    return this.api.put(`api/v1/admin/grade-equivalences/${id}`, data);
  }

  deleteEquivalence(id: number): Observable<ApiWrapped<void>> {
    return this.api.delete(`api/v1/admin/grade-equivalences/${id}`);
  }

  getLevels(): Observable<ApiWrapped<string[]>> {
    return this.api.get(`api/v1/admin/grade-equivalences/levels`);
  }

  /**
   * Obtiene los grades disponibles para un nivel específico.
   */
  getGradesForLevel(levelCode: string): Observable<ApiWrapped<GradeOption[]>> {
    return this.api.get(`api/v1/admin/grade-equivalences/grades?level=${levelCode}`);
  }

  /**
   * Obtiene las materias disponibles para un nivel específico.
   */
  getMateriasForLevel(levelCode: string): Observable<ApiWrapped<MateriaOption[]>> {
    return this.api.get(`api/v1/admin/grade-equivalences/materias?level=${levelCode}`);
  }

  /**
   * Obtiene las opciones disponibles para una materia específica.
   */
  getOpcionesForMateria(materiaId: number): Observable<ApiWrapped<OpcionOption[]>> {
    return this.api.get(`api/v1/admin/grade-equivalences/opciones?materiaId=${materiaId}`);
  }

  /**
   * Verifica si ya existe una equivalencia para la combinación.
   */
  checkDuplicate(levelCode: string, materiaId: number, opcionId: number): Observable<ApiWrapped<{ exists: boolean, message: string }>> {
    return this.api.get(`api/v1/admin/grade-equivalences/check-duplicate?levelCode=${levelCode}&materiaId=${materiaId}&opcionId=${opcionId}`);
  }

  // =============================================
  // KitApprovalRequest Endpoints
  // =============================================

  getAllRequests(page: number = 0, size: number = 20, filters?: {
    status?: string;
    subscriptionTypeId?: number;
    anio?: number;
    unitScheduleId?: number;
    materiaId?: number;
    opcionId?: number;
  }): Observable<ApiWrapped<any>> {
    let url = `api/v1/admin/kit-approvals?page=${page}&size=${size}`;
    if (filters) {
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.subscriptionTypeId) url += `&subscriptionTypeId=${filters.subscriptionTypeId}`;
      if (filters.anio) url += `&anio=${filters.anio}`;
      if (filters.unitScheduleId) url += `&unitScheduleId=${filters.unitScheduleId}`;
      if (filters.materiaId) url += `&materiaId=${filters.materiaId}`;
      if (filters.opcionId) url += `&opcionId=${filters.opcionId}`;
    }
    return this.api.get(url);
  }

  getFilterOptions(params?: {
    subscriptionTypeId?: number;
    anio?: number;
    materiaId?: number;
  }): Observable<ApiWrapped<any>> {
    let url = `api/v1/admin/kit-approvals/filter-options`;
    const queryParts: string[] = [];
    if (params) {
      if (params.subscriptionTypeId) queryParts.push(`subscriptionTypeId=${params.subscriptionTypeId}`);
      if (params.anio) queryParts.push(`anio=${params.anio}`);
      if (params.materiaId) queryParts.push(`materiaId=${params.materiaId}`);
    }
    if (queryParts.length > 0) url += '?' + queryParts.join('&');
    return this.api.get(url);
  }

  getRequestById(id: number): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.get(`api/v1/admin/kit-approvals/${id}`);
  }

  createRequest(data: KitApprovalRequestCreate): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.post(`api/v1/admin/kit-approvals/request`, data);
  }

  approveRequest(id: number): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.post(`api/v1/admin/kit-approvals/${id}/approve`, {});
  }

  rejectRequest(id: number, reason: string): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.post(`api/v1/admin/kit-approvals/${id}/reject`, { reason: reason });
  }

  updateKit(approvalId: number, data: { title?: string; description?: string; price?: number; imagenUrlPublic?: string; pdfPreviewUrl?: string; numeroDePaginas?: number }): Observable<ApiWrapped<KitApprovalRequestDto>> {
    return this.api.put(`api/v1/admin/kit-approvals/${approvalId}/kit`, data);
  }

  uploadKitPreview(approvalId: number, file: File): Observable<ApiWrapped<KitApprovalRequestDto>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post(`api/v1/admin/kit-approvals/${approvalId}/kit/upload-preview`, formData);
  }

  uploadKitImage(approvalId: number, file: File): Observable<ApiWrapped<KitApprovalRequestDto>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post(`api/v1/admin/kit-approvals/${approvalId}/kit/upload-image`, formData);
  }

  deleteRequest(id: number): Observable<ApiWrapped<void>> {
    return this.api.delete(`api/v1/admin/kit-approvals/${id}`);
  }

  bulkGenerate(adminUserId: number, data: BulkGenerateRequest): Observable<ApiWrapped<BulkGenerateResponse>> {
    return this.api.post(`api/v1/admin/kit-approvals/bulk-generate`, data);
  }

  getMissingKits(): Observable<ApiWrapped<MissingKitsResponseDto>> {
    return this.api.get(`api/v1/admin/kit-approvals/missing-kits`);
  }

  getKitStatus(anio: number, nivel: string): Observable<ApiWrapped<KitStatusResponseDto>> {
    return this.api.get(`api/v1/admin/kit-approvals/kit-status?anio=${anio}&nivel=${nivel}`);
  }

  getCombinationDetail(unitScheduleId: number, materiaId: number, opcionId: number): Observable<ApiWrapped<CombinationDetailDto>> {
    return this.api.get(`api/v1/admin/kit-approvals/combination-detail?unitScheduleId=${unitScheduleId}&materiaId=${materiaId}&opcionId=${opcionId}`);
  }

  generateSingleKit(unitScheduleId: number, materiaId: number, opcionId: number): Observable<ApiWrapped<any>> {
    return this.api.post(`api/v1/admin/kit-approvals/generate`, { unitScheduleId, materiaId, opcionId });
  }

  getUnitSchedules(): Observable<any[]> {
    return this.api.get(`api/v1/unit-schedule`).pipe(
      map((data: any) => {
        return (data || []).map((item: any) => {
          const tipoPeriodo = item.tipoPeriodo || 'ANUAL';
          const nivel = item.nivel || 'DESCONOCIDO';
          const tipoSuscripcion = `${tipoPeriodo.toUpperCase()}_${nivel.toUpperCase()}`;

          return {
            id: item.id,
            nombre: item.titulo || `Unidad ${item.unidadNumero} - ${item.anio}`,
            tipoSuscripcion: tipoSuscripcion,
            tipoPeriodo: tipoPeriodo,
            nivel: nivel,
            state: 'active',
            subscriptionTypeId: item.subscriptionTypeId,
            anio: item.anio,
            unidadNumero: item.unidadNumero,
            titulo: item.titulo,
            fechaInicio: item.fechaInicio,
            fechaFin: item.fechaFin
          };
        });
      })
    );
  }
}
