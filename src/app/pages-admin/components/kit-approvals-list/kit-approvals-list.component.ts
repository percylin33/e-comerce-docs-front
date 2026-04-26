import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { KitApprovalService } from '../../../@core/backend/services/kit-approval.service';
import { KitApprovalRequestDto, ApprovalStatus } from '../../../@core/interfaces/kit-approval';

interface StatusOption {
  value: string;
  label: string;
}

@Component({
  selector: 'ngx-kit-approvals-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './kit-approvals-list.component.html',
  styleUrls: ['./kit-approvals-list.component.scss']
})
export class KitApprovalsListComponent implements OnInit, OnDestroy {
  private service = inject(KitApprovalService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private destroy$ = new Subject<void>();
  displayedColumns: string[] = ['id', 'unitSchedule', 'requestedBy', 'status', 'createdAt', 'actions'];
  dataSource: KitApprovalRequestDto[] = [];
  filteredData: KitApprovalRequestDto[] = [];
  loading = true;
  error: string | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  
  // Filters
  statusFilter: string = '';
  subscriptionTypeFilter: number | null = null;
  anioFilter: number | null = null;
  unitScheduleFilter: number | null = null;
  materiaFilter: number | null = null;
  opcionFilter: number | null = null;

  // Filter dropdown options
  subscriptionTypes: { id: number; nombre: string; nivel: string }[] = [];
  years: number[] = [];
  units: { id: number; unidadNumero: number; titulo: string }[] = [];
  materias: { id: number; nombre: string }[] = [];
  opciones: { id: number; nombre: string }[] = [];
  loadingFilters = false;
  
  // Status options
  statusOptions: StatusOption[] = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'APROBADO', label: 'Aprobado' },
    { value: 'RECHAZADO', label: 'Rechazado' }
  ];
  
  // Actions
  approvingId: number | null = null;
  rejectingId: number | null = null;
  rejectionReason: string = '';
  showRejectModal = false;
  selectedRequestId: number | null = null;
  
  // Stats
  stats = {
    pending: 0,
    approved: 0,
    rejected: 0
  };
  
  // Modals
  showDetailModal = false;
  showApproveModal = false;
  selectedRequest: KitApprovalRequestDto | null = null;
  loadingDetail = false;
  
  // Success message
  success: string | null = null;

  ngOnInit(): void {
    this.restoreFiltersFromQuery();
    this.loadFilterOptions();
    this.loadData();
  }

  private restoreFiltersFromQuery(): void {
    const params = this.route.snapshot.queryParams;
    if (params['status']) this.statusFilter = params['status'];
    if (params['subscriptionTypeId']) this.subscriptionTypeFilter = +params['subscriptionTypeId'];
    if (params['anio']) this.anioFilter = +params['anio'];
    if (params['unitScheduleId']) this.unitScheduleFilter = +params['unitScheduleId'];
    if (params['materiaId']) this.materiaFilter = +params['materiaId'];
    if (params['opcionId']) this.opcionFilter = +params['opcionId'];
    if (params['page']) this.currentPage = +params['page'];

    // Load dependent filter options if needed
    if (this.subscriptionTypeFilter && this.anioFilter && this.materiaFilter) {
      this.loadFilterOptions({ subscriptionTypeId: this.subscriptionTypeFilter, anio: this.anioFilter, materiaId: this.materiaFilter });
    } else if (this.subscriptionTypeFilter && this.anioFilter) {
      this.loadFilterOptions({ subscriptionTypeId: this.subscriptionTypeFilter, anio: this.anioFilter });
    } else if (this.subscriptionTypeFilter) {
      this.loadFilterOptions({ subscriptionTypeId: this.subscriptionTypeFilter });
    }
  }

  private syncFiltersToQuery(): void {
    const queryParams: any = {};
    if (this.statusFilter) queryParams.status = this.statusFilter;
    if (this.subscriptionTypeFilter) queryParams.subscriptionTypeId = this.subscriptionTypeFilter;
    if (this.anioFilter) queryParams.anio = this.anioFilter;
    if (this.unitScheduleFilter) queryParams.unitScheduleId = this.unitScheduleFilter;
    if (this.materiaFilter) queryParams.materiaId = this.materiaFilter;
    if (this.opcionFilter) queryParams.opcionId = this.opcionFilter;
    if (this.currentPage > 0) queryParams.page = this.currentPage;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  private getFilterQueryParams(): any {
    const queryParams: any = {};
    if (this.statusFilter) queryParams.status = this.statusFilter;
    if (this.subscriptionTypeFilter) queryParams.subscriptionTypeId = this.subscriptionTypeFilter;
    if (this.anioFilter) queryParams.anio = this.anioFilter;
    if (this.unitScheduleFilter) queryParams.unitScheduleId = this.unitScheduleFilter;
    if (this.materiaFilter) queryParams.materiaId = this.materiaFilter;
    if (this.opcionFilter) queryParams.opcionId = this.opcionFilter;
    if (this.currentPage > 0) queryParams.page = this.currentPage;
    return queryParams;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.subscriptionTypeFilter) filters.subscriptionTypeId = this.subscriptionTypeFilter;
    if (this.anioFilter) filters.anio = this.anioFilter;
    if (this.unitScheduleFilter) filters.unitScheduleId = this.unitScheduleFilter;
    if (this.materiaFilter) filters.materiaId = this.materiaFilter;
    if (this.opcionFilter) filters.opcionId = this.opcionFilter;

    this.service.getAll(this.currentPage, this.pageSize, filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.result) {
          const rawData: any = response.data;
          this.dataSource = rawData?.approvals ?? rawData ?? [];
          this.filteredData = [...this.dataSource];
          this.totalElements = rawData?.totalElements ?? this.dataSource.length;
          this.totalPages = rawData?.totalPages ?? 1;
          this.currentPage = rawData?.currentPage ?? 0;
          // Use server-side stats if available
          if (rawData?.stats) {
            this.stats = {
              pending: rawData.stats.pending ?? 0,
              approved: rawData.stats.approved ?? 0,
              rejected: rawData.stats.rejected ?? 0
            };
          } else {
            this.calculateStats();
          }
        } else {
          this.error = 'Error al cargar las solicitudes';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.error = 'Error al conectar con el servidor';
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats = { pending: 0, approved: 0, rejected: 0 };
    if (!this.dataSource) return;
    this.dataSource.forEach(req => {
      if (req.status === 'PENDIENTE') this.stats.pending++;
      else if (req.status === 'APROBADO') this.stats.approved++;
      else if (req.status === 'RECHAZADO') this.stats.rejected++;
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.syncFiltersToQuery();
    this.loadData();
  }

  loadFilterOptions(params?: { subscriptionTypeId?: number; anio?: number; materiaId?: number }): void {
    this.loadingFilters = true;
    this.service.getFilterOptions(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.result) {
          const data: any = response.data;
          if (data.subscriptionTypes) this.subscriptionTypes = data.subscriptionTypes;
          if (data.years) this.years = data.years;
          if (data.units) this.units = data.units;
          if (data.materias) this.materias = data.materias;
          if (data.opciones) this.opciones = data.opciones;
        }
        this.loadingFilters = false;
      },
      error: () => { this.loadingFilters = false; }
    });
  }

  onSubscriptionTypeChange(): void {
    // Reset dependent filters
    this.unitScheduleFilter = null;
    this.materiaFilter = null;
    this.opcionFilter = null;
    this.units = [];
    this.materias = [];
    this.opciones = [];

    if (this.subscriptionTypeFilter && this.anioFilter) {
      this.loadFilterOptions({ subscriptionTypeId: this.subscriptionTypeFilter, anio: this.anioFilter });
    } else if (this.subscriptionTypeFilter) {
      this.loadFilterOptions({ subscriptionTypeId: this.subscriptionTypeFilter });
    }
    this.applyFilters();
  }

  onAnioChange(): void {
    // Reset unit (depends on year + subscriptionType)
    this.unitScheduleFilter = null;
    this.units = [];

    if (this.subscriptionTypeFilter && this.anioFilter) {
      this.loadFilterOptions({ subscriptionTypeId: this.subscriptionTypeFilter, anio: this.anioFilter });
    }
    this.applyFilters();
  }

  onUnitChange(): void {
    // Reset materia and opción
    this.materiaFilter = null;
    this.opcionFilter = null;
    this.opciones = [];
    this.applyFilters();
  }

  onMateriaChange(): void {
    // Reset opción, load opciones for selected materia
    this.opcionFilter = null;
    this.opciones = [];

    if (this.materiaFilter) {
      this.loadFilterOptions({
        subscriptionTypeId: this.subscriptionTypeFilter!,
        anio: this.anioFilter!,
        materiaId: this.materiaFilter
      });
    }
    this.applyFilters();
  }

  onOpcionChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.subscriptionTypeFilter = null;
    this.anioFilter = null;
    this.unitScheduleFilter = null;
    this.materiaFilter = null;
    this.opcionFilter = null;
    this.units = [];
    this.materias = [];
    this.opciones = [];
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.syncFiltersToQuery();
    this.loadData();
  }

  get pages(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 5);
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get pendingApprovals(): KitApprovalRequestDto[] {
    return this.filteredData.filter(r => r.status === 'PENDIENTE');
  }

  getStatusBadgeClass(status: ApprovalStatus): string {
    const classes: Record<string, string> = {
      'PENDIENTE': 'badge-pending',
      'APROBADO': 'badge-approved',
      'RECHAZADO': 'badge-rejected'
    };
    return classes[status] || 'badge-default';
  }

  getStatusLabel(status: ApprovalStatus): string {
    const labels: Record<string, string> = {
      'PENDIENTE': 'Pendiente',
      'APROBADO': 'Aprobado',
      'RECHAZADO': 'Rechazado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: ApprovalStatus): string {
    const colors: Record<string, string> = {
      'PENDIENTE': 'warning',
      'APROBADO': 'success',
      'RECHAZADO': 'danger'
    };
    return colors[status] || 'default';
  }

  approveRequest(id: number): void {
    if (!confirm('¿Está seguro de aprobar esta solicitud?')) return;
    
    this.approvingId = id;
    this.service.approve(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.approvingId = null;
        if (response.result) {
          this.snackBar.open('Solicitud aprobada correctamente', 'Cerrar', { duration: 3000 });
          this.loadData();
        } else {
          this.snackBar.open('Error al aprobar la solicitud', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Error approving request:', err);
        this.approvingId = null;
        this.snackBar.open('Error al aprobar la solicitud', 'Cerrar', { duration: 3000 });
      }
    });
  }

  showRejectDialog(id: number): void {
    this.selectedRequestId = id;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectDialog(): void {
    this.showRejectModal = false;
    this.selectedRequestId = null;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.selectedRequestId) return;
    if (!this.rejectionReason.trim()) {
      this.snackBar.open('Ingrese una razón para el rechazo', 'Cerrar', { duration: 3000 });
      return;
    }

    this.rejectingId = this.selectedRequestId;
    this.service.reject(this.selectedRequestId, this.rejectionReason).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.rejectingId = null;
        this.closeRejectDialog();
        if (response.result) {
          this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
          this.loadData();
        } else {
          this.snackBar.open('Error al rechazar la solicitud', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Error rejecting request:', err);
        this.rejectingId = null;
        this.snackBar.open('Error al rechazar la solicitud', 'Cerrar', { duration: 3000 });
      }
    });
  }

  viewDetails(request: KitApprovalRequestDto): void {
    console.log('View details:', request);
    const unitName = request.unit?.titulo || 'Sin unidad';
    const materia = request.materiaNombre || 'Sin materia';
    const docs = request.kit?.totalDocumentos || 0;
    alert(`Detalles de solicitud #${request.id}\n\nUnidad: ${unitName}\nMateria: ${materia}\nSolicitante: ${request.requestedByName || 'Desconocido'}\nEstado: ${this.getStatusLabel(request.status)}\nDocumentos: ${docs}`);
  }

  getEquivalencesCount(request: KitApprovalRequestDto): number {
    return request.kit?.totalDocumentos || 0;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTimeAgo(dateString: string): string {
    if (!dateString) return '-';
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
    return this.formatDate(dateString);
  }

  generateKit(): void {
    this.snackBar.open('Use el menú Kits > Generar Kit para crear una nueva solicitud', 'Cerrar', { duration: 5000 });
  }

  closeModals(): void {
    this.showDetailModal = false;
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedRequest = null;
  }

  openDetailModal(request: KitApprovalRequestDto): void {
    this.selectedRequest = request;
    this.showDetailModal = true;
  }

  openApproveModal(request: KitApprovalRequestDto): void {
    this.selectedRequest = request;
    this.showApproveModal = true;
  }

  openRejectModal(request: KitApprovalRequestDto): void {
    this.selectedRequest = request;
    this.selectedRequestId = request.id;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  viewDetail(request: KitApprovalRequestDto): void {
    this.router.navigate(['/pages-admin/kit-approvals', request.id], {
      queryParams: this.getFilterQueryParams()
    });
  }

  approveKit(): void {
    if (!this.selectedRequest) return;
    this.approveRequest(this.selectedRequest.id);
    this.closeModals();
  }

  rejectKit(): void {
    if (!this.selectedRequestId || !this.rejectionReason.trim()) return;
    this.confirmReject();
    this.closeModals();
  }

  // Helper methods
  trackById(index: number, item: KitApprovalRequestDto): number {
    return item.id;
  }

  getRequestTypeLabel(requestType: string): string {
    const labels: Record<string, string> = {
      'GENERATE': 'Generación',
      'REGENERATE': 'Regeneración',
      'UPDATE': 'Actualización',
      'AUTO_GENERATE': 'Auto-generación'
    };
    return labels[requestType] || requestType || 'Solicitud';
  }
}
