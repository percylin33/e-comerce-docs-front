import { Component, Input, OnChanges, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DocumentsService } from '../../@core/backend/services/documents.service';

@Component({
  selector: 'ngx-documents-list',
  template: `
    <div class="documents-list-v2" [class.modal-open]="modalVisible">
      <!-- Modal de confirmación/reintento/contacto -->
      <div #modalRoot class="modal-overlay" *ngIf="modalVisible" (click)="closeModal()">
        <div #modalCard class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-icon">📥</div>
            <div class="modal-headers-text">
              <div class="modal-title">{{ modalTitle }}</div>
              <div class="modal-subtitle" *ngIf="modalItem">{{ modalItem.title || '' }}</div>
            </div>
            <button class="modal-close" aria-label="Cerrar" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">{{ modalMessage }}</div>
          <div class="modal-actions">
            <button class="btn-primary" [disabled]="modalLoading" (click)="onModalConfirm()">{{ modalConfirmLabel }}</button>
            <button class="btn-secondary" [disabled]="modalLoading" (click)="onModalRetry()">Volver a descargar</button>
            <button class="btn-ghost" (click)="onModalContactSupport()">Contactar soporte</button>
            
          </div>
          <div *ngIf="modalLoading" class="modal-loading">Procesando...</div>
        </div>
      </div>
      <!-- Filtros en Cascada -->
      <div class="filters-container">
        
        <div class="filter-group">
          <label>Unidad</label>
          <select [(ngModel)]="selectedUnit" (change)="onUnitChange()">
            <option *ngFor="let u of units" [value]="u">{{ u }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Materia</label>
          <select [(ngModel)]="selectedSubject" (change)="onSubjectChange()" [disabled]="subjects.length === 0">
            <option *ngFor="let s of subjects" [value]="s">{{ s }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Grado</label>
          <select [(ngModel)]="selectedGrade" (change)="onGradeChange()" [disabled]="grades.length === 0">
            <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
          </select>
        </div>

      </div>

      <h5>Resultados ({{ filteredDocs.length }})</h5>

      <div *ngIf="filteredDocs.length === 0" class="no-docs">
        <span *ngIf="units.length === 0">No hay documentos disponibles para esta suscripción.</span>
        <span *ngIf="units.length > 0">Selecciona los filtros para ver los documentos.</span>
      </div>

      <div *ngIf="filteredDocs.length > 0">
        <div class="doc-row-v2" *ngFor="let item of paged">
          <div class="doc-meta-v2">
             <!-- Icono o Tipo -->
             <div class="doc-icon">📄</div>
          </div>
          <div class="doc-content-v2">
            <div class="doc-info">
              <div class="doc-title-v2">{{ item.title }}</div>
              <div class="doc-desc">{{ item.description }}</div>
            </div>
            <div class="doc-actions-v2">
                <button class="btn-view" (click)="downloadDocument(item.id)" [disabled]="item._downloaded || downloading.has(item.id)">
                  {{ item._downloaded ? 'Descargado' : (downloading.has(item.id) ? 'Descargando...' : 'Descargar Documento') }}
                </button>
              </div>
          </div>
        </div>

        <div class="paginator-v2" *ngIf="totalPages > 1">
          <button (click)="prevPage()" [disabled]="currentPage === 1">Anterior</button>
          <span class="page-info">Página {{currentPage}} / {{ totalPages }}</span>
          <button (click)="nextPage()" [disabled]="currentPage === totalPages">Siguiente</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .documents-list-v2 { padding: 0.5rem; color: #1a1a1a; }
      
      .filters-container {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        background: #f8fafc;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        flex-wrap: wrap;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        flex: 1;
        min-width: 200px;
      }

      label {
        font-size: 0.85rem;
        font-weight: 700;
        color: #4a5568;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      select {
        padding: 0.7rem;
        border-radius: 8px;
        border: 1px solid #cbd5e0;
        background: white;
        font-weight: 600;
        color: #2d3748;
        outline: none;
        transition: all 0.2s;
      }
      select:focus {
        border-color: #2b36e8;
        box-shadow: 0 0 0 3px rgba(43, 54, 232, 0.1);
      }
      select:disabled {
        background: #edf2f7;
        cursor: not-allowed;
        opacity: 0.7;
      }

      h5 { margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 800; color: #2d3748; }
      
      .no-docs { 
        text-align: center; 
        padding: 3rem; 
        color: #718096; 
        background: #f8fafc; 
        border-radius: 16px; 
        border: 2px dashed #cbd5e0; 
        font-weight: 500;
      }
      
      .doc-row-v2 { 
        display: flex; 
        align-items: center;
        padding: 1rem 1.5rem; 
        background: white;
        border: 1px solid #edf2f7;
        border-radius: 14px;
        margin-bottom: 0.8rem;
        transition: all 0.2s ease;
        box-shadow: 0 2px 5px rgba(0,0,0,0.02);
      }
      .doc-row-v2:hover {
        transform: translateY(-2px);
        border-color: #2b36e833;
        box-shadow: 0 4px 12px rgba(43, 54, 232, 0.08);
      }

      .doc-icon {
        font-size: 1.5rem;
        background: #f0f4ff;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        margin-right: 1rem;
      }

      .doc-meta-v2 { display: flex; align-items: center; }
      
      .doc-content-v2 { flex: 1; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
      
      .doc-info { display: flex; flex-direction: column; gap: 0.2rem; }
      .doc-title-v2 { font-weight: 700; font-size: 0.95rem; color: #1a1a1a; }
      .doc-desc { font-size: 0.8rem; color: #718096; font-weight: 500; }
      
      .btn-view {
        background: #ffd24a; /* Yellow Accent */
        color: #2b36e8; /* Blue Text */
        border: none;
        padding: 0.6rem 1.4rem;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        font-size: 0.9rem;
      }
      .btn-view:hover {
        background: #fceb78;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(251, 211, 50, 0.3);
      }
      
      .paginator-v2 { 
        display: flex; 
        gap: 1rem; 
        align-items: center; 
        justify-content: center;
        margin-top: 2rem; 
      }
      .paginator-v2 button {
        background: white;
        border: 1px solid #e2e8f0;
        color: #4a5568;
        padding: 0.5rem 1.2rem;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .paginator-v2 button:hover:not(:disabled) {
        border-color: #2b36e8;
        color: #2b36e8;
        background: #f0f4ff;
      }
      .paginator-v2 button:disabled { opacity: 0.4; cursor: not-allowed; }
      .page-info { font-weight: 600; color: #718096; font-size: 0.9rem; }
      /* Modal styles */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(2,6,23,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1400;
        backdrop-filter: blur(3px) saturate(110%);
      }
      .modal-card {
        background: linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%);
        padding: 1.1rem 1.2rem;
        border-radius: 14px;
        width: 520px;
        max-width: calc(100% - 48px);
        box-shadow: 0 18px 42px rgba(2,6,23,0.22), 0 2px 6px rgba(15,23,42,0.06);
        border: 1px solid rgba(15,23,42,0.06);
        animation: modalPop 180ms cubic-bezier(.2,.9,.2,1);
      }
      @keyframes modalPop { from { transform: translateY(8px) scale(.98); opacity:0 } to { transform: translateY(0) scale(1); opacity:1 } }
      .modal-header { display:flex; align-items:center; gap:12px; margin-bottom:6px }
      .modal-icon { width:44px; height:44px; border-radius:10px; background:linear-gradient(180deg,#fff3c4,#ffd24a); display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow: 0 6px 18px rgba(43,54,232,0.06) }
      .modal-headers-text { flex:1 }
      .modal-title { font-size: 1.05rem; font-weight: 800; margin:0; color:#0f172a }
      .modal-subtitle { color:#475569; font-size:0.85rem; margin-top:6px }
      .modal-body { color: #475569; margin: 8px 0 12px 0; line-height:1.45; font-size:0.95rem }
      .modal-actions { display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap }
      .modal-loading { margin-top: 0.8rem; color: #475569; font-weight:600; }
      .modal-close { background:transparent;border:none;font-size:16px;color:#475569;cursor:pointer }
      .btn-primary { background:#ffd24a; color:#0b1bff; border:none; padding:0.6rem 1rem; border-radius:10px; font-weight:800; box-shadow: inset 0 -3px 0 rgba(0,0,0,0.06) }
      .btn-primary:hover { filter:brightness(0.98); transform:translateY(-1px) }
      .btn-secondary { background:#ff7a2d; color:white; border:none; padding:0.58rem 0.95rem; border-radius:10px; font-weight:700 }
      .btn-ghost { background:transparent; border:1px solid rgba(15,23,42,0.08); color:#475569; padding:0.5rem 0.85rem; border-radius:8px }
      .btn-muted { background:#eef2f7; color:#0f172a; border:none; padding:0.45rem 0.8rem; border-radius:8px }
      .btn-primary:disabled, .btn-secondary:disabled { opacity:0.6; cursor:not-allowed }
      /* Cuando el modal está abierto, atenuar y bloquear interacción del fondo */
      .modal-open > :not(.modal-overlay) {
        filter: blur(2px) brightness(0.92);
        pointer-events: none;
        user-select: none;
        transition: filter 160ms ease;
      }
      /* Asegurar que botones del modal tengan buen contraste */
      .modal-card .btn-view { border-radius: 8px; padding: 0.6rem 1rem; font-weight:700 }
    `
  ]
})
export class DocumentsListComponent implements OnChanges, OnDestroy {
  @ViewChild('modalRoot') modalRootRef!: ElementRef;
  @ViewChild('modalCard') modalCardRef!: ElementRef;

  private globalModalContainer: HTMLElement | null = null;

  constructor(private documentsService: DocumentsService, private renderer: Renderer2, private router: Router) {}
  @Input() documents: any = {};

  // Pagination
  @Input() pageSize = 10;
  currentPage = 1;
  // Dropdown States
  units: string[] = [];
  selectedUnit: string = '';

  subjects: string[] = [];
  selectedSubject: string = '';

  grades: string[] = [];
  selectedGrade: string = '';

  // Filtered Docs
  filteredDocs: any[] = [];
  downloading = new Set<number>();

  ngOnChanges() {
    this.extractUnits();
  }

  // 1. Extract Unit Keys
  extractUnits() {
    if (!this.documents) {
      this.units = [];
      return;
    }
    this.units = Object.keys(this.documents).sort();

    // Auto-select first if available
    if (this.units.length > 0) {
      this.selectedUnit = this.units[0];
      this.onUnitChange();
    } else {
      this.resetFilters();
    }
  }

  // 2. Handle Unit Change -> Extract Subjects
  onUnitChange() {
    this.subjects = [];
    this.selectedSubject = '';
    this.grades = [];
    this.selectedGrade = '';
    this.filteredDocs = [];

    if (this.selectedUnit && this.documents[this.selectedUnit]) {
      this.subjects = Object.keys(this.documents[this.selectedUnit]).sort();

      // Auto-select first subject
      if (this.subjects.length > 0) {
        this.selectedSubject = this.subjects[0];
        this.onSubjectChange();
      }
    }
  }

  // 3. Handle Subject Change -> Extract Grades
  onSubjectChange() {
    this.grades = [];
    this.selectedGrade = '';
    this.filteredDocs = [];

    if (this.selectedUnit && this.selectedSubject && this.documents[this.selectedUnit][this.selectedSubject]) {
      this.grades = Object.keys(this.documents[this.selectedUnit][this.selectedSubject]).sort();

      // Auto-select first grade
      if (this.grades.length > 0) {
        this.selectedGrade = this.grades[0];
        this.onGradeChange();
      }
    }
  }

  // 4. Handle Grade Change -> Show Documents
  onGradeChange() {
    this.filteredDocs = [];
    if (this.selectedUnit && this.selectedSubject && this.selectedGrade) {
      const docs = this.documents[this.selectedUnit][this.selectedSubject][this.selectedGrade];
      this.filteredDocs = Array.isArray(docs) ? docs : [];
    }
    this.currentPage = 1;
  }

  resetFilters() {
    this.units = [];
    this.selectedUnit = '';
    this.subjects = [];
    this.selectedSubject = '';
    this.grades = [];
    this.selectedGrade = '';
    this.filteredDocs = [];
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredDocs.length / this.pageSize));
  }

  get paged() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDocs.slice(start, start + this.pageSize);
  }

  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  // Descarga segura usando el servicio DocumentsService
  downloadDocument(documentId: number) {
    // marcar en proceso
    this.downloading.add(documentId);
    
    // reset retry flag when starting a new download attempt
    const itemReset = this.filteredDocs.find(d => d.id === documentId);
    if (itemReset) { itemReset._retryAvailable = false; }
    this.documentsService.getDownloadUrl(documentId).subscribe({
      next: (resp: any) => {
        const downloadUrl: string = resp.downloadUrl;
        const fallback: boolean = !!resp.fallback;
        const redirectUrl: string = resp.redirectUrl;

        // Si el backend proporcionó una redirectUrl absoluta, abrirla directamente
        if (redirectUrl) {
          window.open(redirectUrl, '_blank');
          // marcar pendiente de confirmación para que el usuario pueda confirmar manualmente
          const itemPending = this.filteredDocs.find(d => d.id === documentId);
          if (itemPending) { itemPending._pendingConfirmation = true; }
          if (itemPending) {
            this.openDownloadModal(itemPending, 'Se abrió una nueva pestaña para descargar el documento. Cuando hayas completado la descarga, pulsa "Confirmar descarga".');
          }
        } else if (downloadUrl && downloadUrl.startsWith('http')) {
          // URL absoluta (Drive). Abrir directamente en nueva pestaña
          window.open(downloadUrl, '_blank');
          const itemPending = this.filteredDocs.find(d => d.id === documentId);
          if (itemPending) { itemPending._pendingConfirmation = true; }
          if (itemPending) {
            this.openDownloadModal(itemPending, 'Se abrió una nueva pestaña para descargar el documento. Cuando hayas completado la descarga, pulsa "Confirmar descarga".');
          }
        } else {
          // fallback local path -> construir URL absoluta y navegar en la misma pestaña
          const host = window.location.origin;
          window.location.href = host + downloadUrl;
        }

        // No marcar automáticamente como descargado para enlaces que van a Drive,
        // porque pueden requerir acción adicional (página intermedia de Drive).
        const item = this.filteredDocs.find(d => d.id === documentId);
        if (item) {
          // Si es fallback por streaming del servidor, marcar como descargado
          // (el servidor guarda audit al servir). Para enlaces a Drive no marcar automáticamente.
          if (fallback) {
            item._downloaded = true;
          } else {
            // Enlaces a Drive: dejar pendiente la confirmación
            item._pendingConfirmation = true;
          }
        }
        this.downloading.delete(documentId);
      },
      error: (err: any) => {
        this.downloading.delete(documentId);
        const itemErr = this.filteredDocs.find(d => d.id === documentId);
        // Si el servidor indica que el token/permiso expiró, permitir reintento
        if (itemErr) {
          itemErr._pendingConfirmation = false;
          // 410 Gone o 404 Not Found -> marcar para reintento
          if (err && err.status && (err.status === 410 || err.status === 404)) {
            itemErr._retryAvailable = true;
            this.openDownloadModal(itemErr, 'El permiso para descargar expiró. Puedes volver a intentar obtener un nuevo enlace o contactar con soporte.');
            return;
          }
        }
        alert('No se pudo preparar la descarga. Intenta nuevamente más tarde.');
      }
    });
  }

  confirmDownloadClicked(documentId: number) {
    this.modalLoading = true;
    this.documentsService.confirmDownload(documentId).subscribe({
      next: () => {
        this.modalLoading = false;
        this.closeModal();
        const item = this.filteredDocs.find(d => d.id === documentId);
        if (item) {
          item._downloaded = true;
          item._pendingConfirmation = false;
        }
      },
      error: (err: any) => {
        this.modalLoading = false;
        const item = this.filteredDocs.find(d => d.id === documentId);
        if (item) {
          item._pendingConfirmation = false;
          // Si token expiró en el backend, activar reintento
          if (err && err.status && (err.status === 410 || err.status === 404)) {
            item._retryAvailable = true;
            this.openDownloadModal(item, 'El permiso para confirmar la descarga expiró. Pulsa "Volver a descargar" para obtener un nuevo enlace o contacta con soporte.');
            return;
          }
        }
        this.openDownloadModal(item || { id: documentId }, 'No se pudo confirmar la descarga. Intenta nuevamente.');
      }
    });
  }

  retryDownload(documentId: number) {
    // simplemente llamar de nuevo a downloadDocument
    this.retryClear(documentId);
    this.downloadDocument(documentId);
  }

  retryClear(documentId: number) {
    const item = this.filteredDocs.find(d => d.id === documentId);
    if (item) {
      item._retryAvailable = false;
      item._pendingConfirmation = false;
    }
  }

  // Modal helpers
  modalVisible: boolean = false;
  modalItem: any = null;
  modalTitle: string = 'Confirmar descarga';
  modalMessage: string = '';
  modalLoading: boolean = false;
  modalConfirmLabel: string = 'Confirmar descarga';

  openDownloadModal(item: any, message: string) {
    this.modalItem = item;
    this.modalMessage = message;
    this.modalTitle = item && item._retryAvailable ? 'Reintentar descarga' : 'Confirmar descarga';
    this.modalConfirmLabel = item && item._retryAvailable ? 'Confirmar (si ya descargaste)' : 'Confirmar descarga';
    this.modalVisible = true;
    this.modalLoading = false;

    // Mover el modal al body para evitar stacking-contexts (transform en ancestros)
    setTimeout(() => {
      try {
        if (this.modalRootRef && this.modalRootRef.nativeElement && !this.globalModalContainer) {
          this.globalModalContainer = this.renderer.createElement('div');
          this.globalModalContainer.classList.add('global-modal-host');
          this.renderer.appendChild(document.body, this.globalModalContainer);
          this.renderer.appendChild(this.globalModalContainer, this.modalRootRef.nativeElement);
        }
      } catch (e) {
        // ignore
      }
    }, 0);
  }

  closeModal() {
    this.modalVisible = false;
    this.modalItem = null;
    this.modalLoading = false;
    // limpiar contenedor global si existe
    try {
      if (this.globalModalContainer) {
        if (this.globalModalContainer.parentElement) {
          this.globalModalContainer.parentElement.removeChild(this.globalModalContainer);
        }
        this.globalModalContainer = null;
      }
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {
    try {
      if (this.globalModalContainer && this.globalModalContainer.parentElement) {
        this.globalModalContainer.parentElement.removeChild(this.globalModalContainer);
      }
    } catch (e) {}
  }

  onModalConfirm() {
    if (!this.modalItem) return;
    this.modalLoading = true;
    this.confirmDownloadClicked(this.modalItem.id);
  }

  onModalRetry() {
    if (!this.modalItem) return;
    this.modalLoading = true;
    // Allow retry: call retryDownload which will close modal and attempt again
    this.retryDownload(this.modalItem.id);
  }

  onModalContactSupport() {
    // navegar a la página de contacto interna usando Angular Router
    try {
      this.closeModal();
      this.router.navigate(['/site/contacto']);
    } catch (e) {
      window.location.href = '/site/contacto';
    }
  }
}
