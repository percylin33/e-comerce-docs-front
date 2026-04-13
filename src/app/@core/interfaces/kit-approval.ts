import { Observable } from "rxjs";

/** Generic wrapper matching ResponseHandler.generateResponse shape */
export interface ApiWrapped<T> {
  result: boolean;
  data: T;
  timestamp: string;
  status: number;
}

// =============================================
// GradeEquivalence Interfaces
// =============================================

export interface GradeEquivalenceDto {
  id: number;
  levelCode: string;
  materiaId: number;
  materiaNombre?: string;
  opcionId: number | null;
  opcionNombre?: string;
  gradeId: number;
  gradeNombre?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GradeEquivalenceCreate {
  levelCode: string;
  materiaId: number;
  opcionId: number | null;
  gradeId: number;
}

export interface LevelOption {
  id: number;
  nombre: string;
}

export interface LevelWithOptions {
  levelCode: string;
  nivel: string;
  materias: MateriaWithOptions[];
}

export interface MateriaWithOptions {
  id: number;
  nombre: string;
  opciones: LevelOption[];
}

export interface GradeOption {
  id: number;
  nombre: string;
  tipoSuscripcion: string;
}

export interface MateriaOption {
  id: number;
  nombre: string;
}

export interface OpcionOption {
  id: number;
  nombre: string;
}

// =============================================
// KitApprovalRequest Interfaces
// =============================================

export type ApprovalStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface KitSummaryDto {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  numeroDePaginas: number;
  totalDocumentos: number | null;
  estado: string | null;
  kitEstado: string | null;
  fechaGeneracion: string | null;
  format: string | null;
  imagenUrlPublic: string | null;
  fileUrlPublic: string | null;
  pdfPreviewUrl: string | null;
}

export interface UnitSummaryDto {
  id: number;
  titulo: string;
  anio: number;
  unidadNumero: number;
  nivel: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
}

export interface DocumentSummaryDto {
  id: number;
  title: string;
  format: string | null;
  numeroDePaginas: number;
  price: number | null;
  pdfPreviewUrl: string | null;
  imagenUrlPublic: string | null;
  fileUrlPublic: string | null;
  createdAt: string | null;
}

export interface KitApprovalRequestDto {
  id: number;
  kitId: number;
  status: ApprovalStatus;
  requestType: string | null;
  requestedAt: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  requestedByAdminId: number;
  requestedByName: string | null;
  reviewedByAdminId: number | null;
  reviewedByName: string | null;
  kit: KitSummaryDto | null;
  unit: UnitSummaryDto | null;
  materiaNombre: string | null;
  opcionNombre: string | null;
  gradeNombre: string | null;
  gradeCode: string | null;
  documents: DocumentSummaryDto[] | null;
}

export interface KitApprovalRequestCreate {
  unitScheduleId: number;
  selectedEquivalences: number[];
  observaciones?: string;
}

export interface BulkGenerateRequest {
  unitScheduleId: number;
  equivalenceIds: number[];
  observaciones?: string;
}

export interface BulkGenerateResult {
  equivalenceId: number;
  status: 'CREATED' | 'FAILED';
  kitId?: number;
  approvalRequestId?: number;
  reason?: string;
}

export interface BulkGenerateResponse {
  results: BulkGenerateResult[];
  created: number;
  failed: number;
  total: number;
  message: string;
}

export interface KitApprovalAction {
  rejectionReason?: string;
}

export interface UnitScheduleOption {
  id: number;
  nombre: string;
  tipoSuscripcion: string;
  tipoPeriodo: string;
  nivel: string;
  state: string;
  anio?: number;
  unidadNumero?: number;
}

// =============================================
// Missing-kits diagnostic Interfaces
// =============================================

export interface ExpiredCombinationDto {
  unitScheduleId: number;
  unitTitulo: string;
  anio: number;
  unidadNumero: number;
  fechaFin: string; // ISO date
  subscriptionTypeName: string;
  materiaId: number;
  materiaNombre: string;
  opcionId: number;
  opcionNombre: string;
  daysExpired: number;
}

export interface KitWithoutDocsDto {
  kitDocumentId: number;
  approvalRequestId: number | null;
  unitScheduleId: number | null;
  unitTitulo: string | null;
  anio: number | null;
  unidadNumero: number | null;
  materiaId: number | null;
  materiaNombre: string | null;
  opcionId: number | null;
  opcionNombre: string | null;
  totalDocumentos: number | null;
  estado: string | null;
  kitEstado: string | null;
  fechaGeneracion: string | null;
}

export interface MissingKitsResponseDto {
  expiredWithoutKits: ExpiredCombinationDto[];
  kitsWithoutDocuments: KitWithoutDocsDto[];
  totalExpired: number;
  totalKitsEmpty: number;
}

// =============================================
// Kit-status diagnostic Interfaces
// =============================================

export interface CombinationStatusDto {
  materiaId: number;
  materiaNombre: string;
  opcionId: number;
  opcionNombre: string;
  sourceDocCount: number;
  hasKit: boolean;
  kitId?: number;
  kitEstado?: string;
  kitDocEstado?: string;
  kitPages?: number;
  kitFechaGeneracion?: string;
  reason?: string;
}

export interface UnitKitStatusDto {
  unitScheduleId: number;
  unitTitulo: string;
  unidadNumero: number;
  fechaInicio: string;
  fechaFin: string;
  subscriptionTypeName: string;
  expired: boolean;
  combinations: CombinationStatusDto[];
}

export interface KitStatusResponseDto {
  anio: number;
  nivel: string;
  units: UnitKitStatusDto[];
  totalCombinations: number;
  withKit: number;
  withoutKit: number;
}

// =============================================
// Combination Detail Interfaces
// =============================================

export interface SourceDocInfo {
  id: number;
  title: string;
  format: string | null;
  pages: number | null;
  createdAt: string | null;
}

export interface KitDetailInfo {
  kitId: number;
  title: string;
  kitEstado: string | null;
  kitDocEstado: string | null;
  pages: number | null;
  fechaGeneracion: string | null;
  approvalRequestId: number | null;
  approvalStatus: string | null;
}

export interface CombinationDetailDto {
  unitScheduleId: number;
  unitTitulo: string;
  unidadNumero: number;
  subscriptionTypeName: string;
  nivel: string;
  materiaId: number;
  materiaNombre: string | null;
  opcionId: number;
  opcionNombre: string | null;
  sourceDocCount: number;
  sourceDocs: SourceDocInfo[];
  kit: KitDetailInfo | null;
  equivalenceId: number | null;
}

// =============================================
// Abstract Classes for Services
// =============================================

export abstract class GradeEquivalenceData {
  abstract getAll(): Observable<ApiWrapped<GradeEquivalenceDto[]>>;
  abstract getById(id: number): Observable<ApiWrapped<GradeEquivalenceDto>>;
  abstract getByLevel(levelCode: string): Observable<ApiWrapped<GradeEquivalenceDto[]>>;
  abstract create(data: GradeEquivalenceCreate): Observable<ApiWrapped<GradeEquivalenceDto>>;
  abstract update(id: number, data: GradeEquivalenceCreate): Observable<ApiWrapped<GradeEquivalenceDto>>;
  abstract delete(id: number): Observable<ApiWrapped<void>>;
  abstract getLevels(): Observable<ApiWrapped<string[]>>;
  abstract getGradesForLevel(levelCode: string): Observable<ApiWrapped<GradeOption[]>>;
  abstract getMateriasForLevel(levelCode: string): Observable<ApiWrapped<MateriaOption[]>>;
  abstract getOpcionesForMateria(materiaId: number): Observable<ApiWrapped<OpcionOption[]>>;
  abstract checkDuplicate(levelCode: string, materiaId: number, opcionId: number): Observable<ApiWrapped<{ exists: boolean, message: string }>>;
}

export abstract class KitApprovalData {
  abstract getAll(): Observable<ApiWrapped<KitApprovalRequestDto[]>>;
  abstract getById(id: number): Observable<ApiWrapped<KitApprovalRequestDto>>;
  abstract create(data: KitApprovalRequestCreate): Observable<ApiWrapped<KitApprovalRequestDto>>;
  abstract approve(id: number): Observable<ApiWrapped<KitApprovalRequestDto>>;
  abstract reject(id: number, reason: string): Observable<ApiWrapped<KitApprovalRequestDto>>;
  abstract delete(id: number): Observable<ApiWrapped<void>>;
  abstract getUnitSchedules(): Observable<any[]>;
}
