// =====================================================
// KitApproval Models - PagesAdmin
// =====================================================

export interface KitApprovalRequest {
  id: number;
  kitId: number;
  status: KitStatus;
  requestType: KitRequestType;
  requestedByAdminId: number;
  requestedByAdminNombre?: string;
  reviewedByAdminId?: number;
  reviewedByAdminNombre?: string;
  requestedAt: string;
  reviewedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export interface KitInfo {
  id: number;
  title: string;
  titulo?: string;
  totalDocumentos: number;
  pageCount?: number;
  price: number;
  grade?: GradeInfo;
  unitSchedule?: UnitScheduleInfo;
  materia?: MateriaInfo;
  opcion?: OpcionInfo;
  pdfPreviewUrl?: string;
  googleDriveFolderUrl?: string;
  kitEstado?: string;
  createdAt?: string;
}

export interface GradeInfo {
  id: number;
  name: string;
  nombre?: string;
  levelCode?: string;
}

export interface UnitScheduleInfo {
  id: number;
  titulo: string;
  title?: string;
  descripcion?: string;
  nivel?: string;
  nivelSuscripcion?: string;
}

export interface MateriaInfo {
  id: number;
  nombre: string;
  name?: string;
}

export interface OpcionInfo {
  id: number;
  nombre: number;
  name?: string;
}

export interface KitWithApproval {
  request: KitApprovalRequest;
  kit: KitInfo;
}

export interface GenerateKitRequest {
  unitScheduleId: number;
  materiaId: number;
  opcionId: number;
}

export interface PendingApprovalResponse {
  pendingApprovals: KitWithApproval[];
  count: number;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
}

export type KitStatus = 'PENDIENTE_APROBACION' | 'APROBADO' | 'RECHAZADO' | 'ARCHIVADO' | 'PENDIENTE' | 'APPROVED' | 'REJECTED';

export type KitRequestType = 'GENERATE' | 'REGENERATE';

export interface ApprovalHistory {
  kitId: number;
  history: KitApprovalRequest[];
}

export interface ApprovalActionRequest {
  adminNotes?: string;
  rejectionReason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Utility functions
export function getStatusLabel(status: KitStatus): string {
  const labels: Record<KitStatus, string> = {
    'PENDIENTE_APROBACION': 'Pendiente de Aprobación',
    'PENDIENTE': 'Pendiente',
    'APROBADO': 'Aprobado',
    'APPROVED': 'Aprobado',
    'RECHAZADO': 'Rechazado',
    'REJECTED': 'Rechazado',
    'ARCHIVADO': 'Archivado'
  };
  return labels[status] || status;
}

export function getStatusColor(status: KitStatus): string {
  const colors: Record<KitStatus, string> = {
    'PENDIENTE_APROBACION': 'warning',
    'PENDIENTE': 'warning',
    'APROBADO': 'success',
    'APPROVED': 'success',
    'RECHAZADO': 'danger',
    'REJECTED': 'danger',
    'ARCHIVADO': 'secondary'
  };
  return colors[status] || 'secondary';
}

export function getRequestTypeLabel(type: KitRequestType): string {
  const labels: Record<KitRequestType, string> = {
    'GENERATE': 'Nueva Generación',
    'REGENERATE': 'Regeneración'
  };
  return labels[type] || type;
}
