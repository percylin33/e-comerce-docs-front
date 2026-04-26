import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from '../../../shared/shared.module';
import { KitApprovalService } from '../../../@core/backend/services/kit-approval.service';
import { KitApprovalRequestDto, DocumentSummaryDto } from '../../../@core/interfaces/kit-approval';

@Component({
  selector: 'ngx-kit-approval-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    SharedModule
  ],
  templateUrl: './kit-approval-detail.component.html',
  styleUrls: ['./kit-approval-detail.component.scss']
})
export class KitApprovalDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(KitApprovalService);
  private snackBar = inject(MatSnackBar);

  private destroy$ = new Subject<void>();

  request: KitApprovalRequestDto | null = null;
  loading = true;
  error: string | null = null;

  // PDF / Image viewer
  kitViewerUrl: string | null = null;
  selectedDocViewerUrl: string | null = null;
  selectedDoc: DocumentSummaryDto | null = null;

  // Edit mode
  editMode = false;
  editTitle = '';
  editDescription = '';
  editPrice: number | null = null;
  editImagenUrl = '';
  editPdfPreviewUrl = '';
  editNumeroDePaginas: number | null = null;
  saving = false;
  uploadingPreview = false;
  uploadingImage = false;

  // Approve / Reject modals
  showApproveConfirm = false;
  showRejectConfirm = false;
  rejectionReason = '';
  actionLoading = false;

  // Preserved list filters for back navigation
  private listQueryParams: any = {};

  ngOnInit(): void {
    // Preserve query params from the list for back navigation
    this.listQueryParams = { ...this.route.snapshot.queryParams };

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de solicitud inválido';
      this.loading = false;
      return;
    }
    this.loadDetail(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDetail(id: number): void {
    this.loading = true;
    this.error = null;

    this.service.getById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.result && response.data) {
          this.request = response.data as any;
          this.buildKitViewerUrl();
        } else {
          this.error = 'No se pudo cargar la solicitud';
        }
      },
      error: (err) => {
        console.error('Error loading detail:', err);
        this.loading = false;
        this.error = 'Error al conectar con el servidor';
      }
    });
  }

  // =============================================
  // PDF / Image Viewer
  // =============================================

  private buildKitViewerUrl(): void {
    if (!this.request?.kit) return;
    const kit = this.request.kit;
    if (kit.pdfPreviewUrl) {
      this.kitViewerUrl = this.processGoogleDriveUrl(kit.pdfPreviewUrl);
    } else if (kit.fileUrlPublic) {
      this.kitViewerUrl = this.processGoogleDriveUrl(kit.fileUrlPublic);
    } else {
      this.kitViewerUrl = null;
    }
  }

  selectDocument(doc: DocumentSummaryDto): void {
    this.selectedDoc = doc;
    if (doc.pdfPreviewUrl) {
      this.selectedDocViewerUrl = this.processGoogleDriveUrl(doc.pdfPreviewUrl);
    } else if (doc.fileUrlPublic) {
      this.selectedDocViewerUrl = this.processGoogleDriveUrl(doc.fileUrlPublic);
    } else {
      this.selectedDocViewerUrl = null;
    }
  }

  clearDocSelection(): void {
    this.selectedDoc = null;
    this.selectedDocViewerUrl = null;
  }

  private processGoogleDriveUrl(url: string): string {
    if (!url) return url;

    // Extract file ID from any Google Drive URL format
    const fileIdMatch = url.match(/\/file\/d\/([^\/\?]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }

    // If it's just a raw Drive file ID (no URL structure)
    if (!url.includes('/') && !url.includes('.')) {
      return `https://drive.google.com/file/d/${url}/preview`;
    }

    return url;
  }

  // =============================================
  // Edit Mode
  // =============================================

  enterEditMode(): void {
    if (!this.request?.kit) return;
    this.editTitle = this.request.kit.title || '';
    this.editDescription = this.request.kit.description || '';
    this.editPrice = this.request.kit.price;
    this.editImagenUrl = this.request.kit.imagenUrlPublic || '';
    this.editPdfPreviewUrl = this.request.kit.pdfPreviewUrl || '';
    this.editNumeroDePaginas = this.request.kit.numeroDePaginas;
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
  }

  saveKit(): void {
    if (!this.request) return;
    this.saving = true;

    const data: { title?: string; description?: string; price?: number; imagenUrlPublic?: string; pdfPreviewUrl?: string; numeroDePaginas?: number } = {};
    if (this.editTitle.trim()) data.title = this.editTitle.trim();
    if (this.editDescription !== null) data.description = this.editDescription;
    if (this.editPrice !== null) data.price = this.editPrice;
    if (this.editImagenUrl.trim()) data.imagenUrlPublic = this.editImagenUrl.trim();
    if (this.editPdfPreviewUrl.trim()) data.pdfPreviewUrl = this.editPdfPreviewUrl.trim();
    if (this.editNumeroDePaginas !== null) data.numeroDePaginas = this.editNumeroDePaginas;

    this.service.updateKit(this.request.id, data).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.result && response.data) {
          this.request = response.data as any;
          this.editMode = false;
          this.buildKitViewerUrl();
          this.snackBar.open('Kit actualizado correctamente', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('Error al actualizar el kit', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Error saving kit:', err);
        this.saving = false;
        this.snackBar.open('Error al actualizar el kit', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // =============================================
  // File Uploads
  // =============================================

  onPreviewFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.request) return;
    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      this.snackBar.open('Solo se permiten archivos PDF', 'Cerrar', { duration: 3000 });
      return;
    }
    this.uploadingPreview = true;
    this.service.uploadKitPreview(this.request.id, file).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.uploadingPreview = false;
        if (response.result && response.data) {
          this.request = response.data as any;
          this.buildKitViewerUrl();
          this.snackBar.open('PDF de previsualización subido correctamente', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('Error al subir el PDF', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.uploadingPreview = false;
        this.snackBar.open('Error al subir el PDF de previsualización', 'Cerrar', { duration: 3000 });
      }
    });
    input.value = '';
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.request) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Solo se permiten archivos de imagen', 'Cerrar', { duration: 3000 });
      return;
    }
    this.uploadingImage = true;
    this.service.uploadKitImage(this.request.id, file).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.uploadingImage = false;
        if (response.result && response.data) {
          this.request = response.data as any;
          this.snackBar.open('Imagen subida correctamente', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('Error al subir la imagen', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.uploadingImage = false;
        this.snackBar.open('Error al subir la imagen', 'Cerrar', { duration: 3000 });
      }
    });
    input.value = '';
  }

  // =============================================
  // Actions (Approve / Reject)
  // =============================================

  confirmApprove(): void {
    if (!this.request) return;
    this.actionLoading = true;

    this.service.approve(this.request.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.actionLoading = false;
        this.showApproveConfirm = false;
        if (response.result) {
          this.snackBar.open('Solicitud aprobada correctamente', 'Cerrar', { duration: 3000 });
          this.loadDetail(this.request!.id);
        } else {
          this.snackBar.open('Error al aprobar', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.actionLoading = false;
        this.snackBar.open('Error al aprobar la solicitud', 'Cerrar', { duration: 3000 });
      }
    });
  }

  confirmReject(): void {
    if (!this.request || !this.rejectionReason.trim()) return;
    this.actionLoading = true;

    this.service.reject(this.request.id, this.rejectionReason).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.actionLoading = false;
        this.showRejectConfirm = false;
        this.rejectionReason = '';
        if (response.result) {
          this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
          this.loadDetail(this.request!.id);
        } else {
          this.snackBar.open('Error al rechazar', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.actionLoading = false;
        this.snackBar.open('Error al rechazar la solicitud', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // =============================================
  // Helpers
  // =============================================

  goBack(): void {
    this.router.navigate(['/pages-admin/kit-approvals'], {
      queryParams: this.listQueryParams
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDIENTE': 'Pendiente',
      'APROBADO': 'Aprobado',
      'RECHAZADO': 'Rechazado'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDIENTE': 'badge-pending',
      'APROBADO': 'badge-approved',
      'RECHAZADO': 'badge-rejected'
    };
    return classes[status] || 'badge-default';
  }

  getRequestTypeLabel(requestType: string): string {
    const labels: Record<string, string> = {
      'GENERATE': 'Generación',
      'REGENERATE': 'Regeneración',
      'UPDATE': 'Actualización'
    };
    return labels[requestType] || requestType || 'Solicitud';
  }

  formatDate(dateString: string | null): string {
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
}
