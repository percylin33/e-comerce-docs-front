import { Component, HostListener, Input, OnChanges, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DocumentsService } from '../../@core/backend/services/documents.service';
import { DownloadSessionService } from '../../@core/services/download-session.service';
import { DownloadFeaturesService } from '../../@core/services/download-features.service';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'ngx-documents-list',
    template: `
    <div class="documents-list-v2">
      <!-- Filtros en Cascada -->
      <div class="filters-container">
    
        <div class="filter-group filter-select filter-select--unit"
          [class.is-open]="unitPanelOpen">
          <label id="unit-filter-label">Unidad</label>
          <div class="select-control">
            <button
              type="button"
              class="select-trigger"
              id="unit-select"
              aria-labelledby="unit-filter-label"
              [attr.aria-expanded]="unitPanelOpen"
              aria-haspopup="listbox"
              [disabled]="units.length === 0"
              (click)="toggleUnitPanel($event)">
              <span class="select-value" [title]="selectedUnit || 'Seleccionar unidad'">
                {{ selectedUnit || 'Seleccionar unidad' }}
              </span>
              <span class="select-chevron" [class.open]="unitPanelOpen" aria-hidden="true"></span>
            </button>
            @if (unitPanelOpen && units.length > 0) {
              <ul class="select-panel" role="listbox" aria-labelledby="unit-filter-label">
                @for (u of units; track u) {
                  <li
                    role="option"
                    [attr.aria-selected]="u === selectedUnit"
                    [class.selected]="u === selectedUnit"
                    [title]="u"
                    (click)="selectUnit(u, $event)">
                    <span class="select-option-text">{{ u }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
    
        <div class="filter-group">
          <label>Materia</label>
          <select [(ngModel)]="selectedSubject" (change)="onSubjectChange()" [disabled]="subjects.length === 0">
            @for (s of subjects; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>
    
        <div class="filter-group">
          <label>Grado</label>
          <select [(ngModel)]="selectedGrade" (change)="onGradeChange()" [disabled]="grades.length === 0">
            @for (g of grades; track g) {
              <option [value]="g">{{ g }}</option>
            }
          </select>
        </div>
    
      </div>
    
      <h5>Resultados ({{ filteredDocs.length }})</h5>
    
      @if (filteredDocs.length === 0) {
        <div class="no-docs">
          @if (subscriptionStatus === 'INACTIVA') {
            <div class="blocked-state">
              <div class="icon-blocked">🚫</div>
              <p><strong>Acceso Restringido</strong></p>
              <p>No tienes acceso a los documentos porque tu suscripción está inactiva.</p>
              <button class="btn-link" (click)="viewPaymentsRequested.emit()">Ver pagos pendientes</button>
            </div>
          } @else {
            @if (units.length === 0) {
              <span>No hay documentos disponibles para esta suscripción.</span>
            }
            @if (units.length > 0) {
              <span>Selecciona los filtros para ver los documentos.</span>
            }
          }
        </div>
      }
    
      @if (filteredDocs.length > 0) {
        <div>
          @for (item of paged; track item) {
            <div class="doc-row-v2">
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
                  <button class="btn-view" (click)="downloadDocument(item.id)" [disabled]="downloading.has(item.id)">
                    @if (!downloading.has(item.id)) {
                      <span>{{ item._downloaded ? '↓ Descargar de nuevo' : 'Descargar Documento' }}</span>
                    }
                    @if (downloading.has(item.id)) {
                      <span>Preparando...</span>
                    }
                  </button>
                  @if (item._retryAvailable) {
                    <button class="btn-retry" (click)="retryDownload(item.id)">Reintentar</button>
                  }
                  @if (item._downloadError) {
                    <div class="inline-error">⚠ {{ item._downloadError }}</div>
                  }
                </div>
              </div>
            </div>
          }
          @if (totalPages > 1) {
            <div class="paginator-v2">
              <button (click)="prevPage()" [disabled]="currentPage === 1">Anterior</button>
              <span class="page-info">Página {{currentPage}} / {{ totalPages }}</span>
              <button (click)="nextPage()" [disabled]="currentPage === totalPages">Siguiente</button>
            </div>
          }
        </div>
      }
    </div>
    `,
    styles: [
        `
      .documents-list-v2 {
        padding: 0.5rem;
        color: #1a1a1a;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
      }
      
      .filters-container {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        background: #f8fafc;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        flex-wrap: wrap;
        overflow: visible;
        position: relative;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        flex: 1;
        min-width: min(100%, 200px);
      }

      .filter-select {
        position: relative;
        z-index: 1;
      }

      .filter-select.is-open {
        z-index: 40;
      }

      .select-control {
        position: relative;
        width: 100%;
      }

      .select-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.7rem 2.75rem 0.7rem 0.85rem;
        min-height: 48px;
        border-radius: 8px;
        border: 1px solid #cbd5e0;
        background: white;
        font-weight: 600;
        color: #2d3748;
        font-size: 0.95rem;
        text-align: left;
        cursor: pointer;
        box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .select-trigger:hover:not(:disabled) {
        border-color: #a0aec0;
      }

      .select-trigger:focus-visible {
        outline: none;
        border-color: #2b36e8;
        box-shadow: 0 0 0 3px rgba(43, 54, 232, 0.12);
      }

      .select-trigger:disabled {
        background: #edf2f7;
        cursor: not-allowed;
        opacity: 0.7;
      }

      .select-value {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.35;
      }

      .select-chevron {
        position: absolute;
        right: 1rem;
        top: 50%;
        width: 0.55rem;
        height: 0.55rem;
        margin-top: -0.35rem;
        border-right: 2px solid #718096;
        border-bottom: 2px solid #718096;
        transform: rotate(45deg);
        transition: transform 0.2s ease, margin-top 0.2s ease;
        pointer-events: none;
      }

      .select-chevron.open {
        margin-top: -0.1rem;
        transform: rotate(-135deg);
      }

      .select-panel {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: 50;
        margin: 0;
        padding: 0.35rem 0;
        list-style: none;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        box-shadow: 0 12px 36px rgba(15, 23, 42, 0.14);
        width: max-content;
        min-width: 100%;
        max-width: min(92vw, 56rem);
        max-height: min(50vh, 320px);
        overflow-y: auto;
        overflow-x: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }

      .select-panel li {
        padding: 0.75rem 1rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        color: #2d3748;
        line-height: 1.45;
        white-space: nowrap;
        transition: background 0.15s ease;
      }

      .select-panel li:hover,
      .select-panel li:focus {
        background: #f0f4ff;
        outline: none;
      }

      .select-panel li.selected {
        background: #eef2ff;
        color: #2b36e8;
      }

      .select-option-text {
        display: block;
        white-space: nowrap;
      }

      @media (min-width: 769px) {
        .filter-select--unit .select-control {
          width: 100%;
        }

        .filter-select--unit .select-panel {
          width: max-content;
          min-width: 100%;
          max-width: min(92vw, 56rem);
        }
      }

      label {
        font-size: 0.85rem;
        font-weight: 700;
        color: #4a5568;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      select {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        padding: 0.7rem 2rem 0.7rem 0.85rem;
        min-height: 48px;
        border-radius: 8px;
        border: 1px solid #cbd5e0;
        background: white;
        font-weight: 600;
        color: #2d3748;
        outline: none;
        transition: all 0.2s;
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23718096' d='M1.41 0 6 4.58 10.59 0 12 1.41l-6 6-6-6z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.85rem center;
        background-size: 12px 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      select:focus {
        border-color: #2b36e8;
        box-shadow: 0 0 0 3px rgba(43, 54, 232, 0.1);
      }
      select:disabled {
        background-color: #edf2f7;
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
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .blocked-state .icon-blocked { font-size: 2rem; margin-bottom: 0.5rem; }
      .blocked-state p { margin: 0; }
      .btn-link {
        background: none;
        border: none;
        color: #2b36e8;
        text-decoration: underline;
        cursor: pointer;
        font-weight: 700;
        margin-top: 0.5rem;
        font-size: 0.95rem;
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
      .btn-retry {
        background: #ff7a2d;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        font-size: 0.85rem;
        white-space: nowrap;
      }
      .inline-error {
        font-size: 0.8rem;
        color: #c0392b;
        font-weight: 600;
        background: #ffeaea;
        border: 1px solid #f5c6cb;
        border-radius: 6px;
        padding: 0.3rem 0.6rem;
        margin-top: 0.3rem;
      }
      .doc-actions-v2 { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }

      @media (max-width: 768px) {
        .documents-list-v2 {
          padding: 0.25rem 0;
        }

        .filters-container {
          flex-direction: column;
          padding: 1rem;
          gap: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .filter-group {
          min-width: 0;
          width: 100%;
          flex: none;
        }

        select,
        .select-trigger {
          width: 100%;
          max-width: 100%;
          font-size: 16px;
          min-height: 52px;
        }

        .select-panel {
          max-height: min(45vh, 280px);
          border-radius: 12px;
          left: 0;
          right: 0;
          width: 100%;
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
        }

        .select-panel li {
          padding: 0.9rem 1rem;
          font-size: 15px;
          white-space: normal;
        }

        .select-option-text {
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .filter-select.is-open {
          z-index: 50;
        }

        .doc-row-v2 {
          flex-direction: column;
          align-items: stretch;
          padding: 1rem;
          gap: 0.75rem;
        }

        .doc-meta-v2 {
          margin-bottom: 0;
        }

        .doc-icon {
          margin-right: 0;
        }

        .doc-content-v2 {
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
        }

        .doc-actions-v2 {
          align-items: stretch;
          width: 100%;
        }

        .btn-view,
        .btn-retry {
          width: 100%;
          white-space: normal;
          text-align: center;
        }

        .paginator-v2 {
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .paginator-v2 button {
          flex: 1;
          min-width: 0;
        }

        .no-docs {
          padding: 2rem 1rem;
        }
      }
    `
    ],
    standalone: true,
    imports: [FormsModule]
})
export class DocumentsListComponent implements OnChanges {
  private documentsService = inject(DocumentsService);
  private sessionsService = inject(DownloadSessionService);
  private featureFlags = inject(DownloadFeaturesService);
  private router = inject(Router);

  @Input() documents: any = {};
  @Input() subscriptionStatus: string = 'ACTIVA';
  @Input() currentUserId?: number | string | null;
  @Output() viewPaymentsRequested = new EventEmitter<void>();

  // Pagination
  @Input() pageSize = 10;
  currentPage = 1;
  // Dropdown States
  units: string[] = [];
  selectedUnit: string = '';
  unitPanelOpen = false;

  subjects: string[] = [];
  selectedSubject: string = '';

  grades: string[] = [];
  selectedGrade: string = '';

  // Filtered Docs
  filteredDocs: any[] = [];
  downloading = new Set<number>();

  ngOnChanges() {
    this.unitPanelOpen = false;
    this.extractUnits();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.filter-select--unit')) {
      this.unitPanelOpen = false;
    }
  }

  toggleUnitPanel(event: Event): void {
    event.stopPropagation();
    if (this.units.length === 0) {
      return;
    }
    this.unitPanelOpen = !this.unitPanelOpen;
  }

  selectUnit(unit: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedUnit === unit) {
      this.unitPanelOpen = false;
      return;
    }
    this.selectedUnit = unit;
    this.unitPanelOpen = false;
    this.onUnitChange();
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

  // Descarga segura usando el servicio DocumentsService.
  // Fase 3b: si el feature flag esta activado para este usuario,
  // delega al flujo unificado de sesiones (POST /sessions -> redirect a /file).
  downloadDocument(documentId: number) {
    if (this.downloading.has(documentId)) return;
    this.downloading.add(documentId);

    const item = this.filteredDocs.find(d => d.id === documentId);
    if (item) { item._downloadError = null; item._retryAvailable = false; }

    if (this.featureFlags.shouldUseV2(this.currentUserId)) {
      this.downloadDocumentV2(documentId, item);
      return;
    }

    this.documentsService.getDownloadUrl(documentId).pipe(
      timeout(15000),
      catchError(err => throwError(() => err?.name === 'TimeoutError' ? { status: 0, _timeout: true } : err))
    ).subscribe({
      next: (resp: any) => {
        this.downloading.delete(documentId);

        const redirectUrl: string = resp.redirectUrl;
        const downloadUrl: string = resp.downloadUrl;
        const fallback: boolean = !!resp.fallback;

        const url = redirectUrl || downloadUrl;

        if (url) {
          // Use <a> element click — NOT window.open — to avoid popup blocker
          // (window.open inside async callbacks is blocked by all modern browsers)
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { try { document.body.removeChild(a); } catch (e) {} }, 200);
        }

        const doc = this.filteredDocs.find(d => d.id === documentId);
        if (doc) {
          if (fallback) {
            doc._downloaded = true;
          } else {
            // Auto-confirm in the background — audit is already saved by the redirect endpoint,
            // but we fire confirm anyway for the additional "confirmed" entry.
            setTimeout(() => {
              this.documentsService.confirmDownload(documentId).subscribe({
                next: () => {
                  const d = this.filteredDocs.find(x => x.id === documentId);
                  if (d) { d._downloaded = true; d._pendingConfirmation = false; }
                },
                error: () => {
                  // non-blocking — but still mark as downloaded so button text updates
                  const d = this.filteredDocs.find(x => x.id === documentId);
                  if (d) { d._downloaded = true; }
                }
              });
            }, 2500);
          }
        }
      },
      error: (err: any) => {
        this.downloading.delete(documentId);
        const doc = this.filteredDocs.find(d => d.id === documentId);
        if (!doc) return;

        if (err?.status === 410 || err?.status === 404) {
          doc._retryAvailable = true;
          doc._downloadError = 'El permiso expiró. Intenta de nuevo.';
        } else if (err?.status === 403) {
          doc._downloadError = 'No tienes acceso a este documento.';
        } else if (err?._timeout || err?.status === 0) {
          doc._retryAvailable = true;
          doc._downloadError = 'El servidor tardó demasiado. Intenta de nuevo.';
        } else {
          doc._downloadError = 'No se pudo preparar la descarga. Intenta de nuevo.';
        }
        setTimeout(() => { const d = this.filteredDocs.find(x => x.id === documentId); if (d) { d._downloadError = null; d._retryAvailable = false; } }, 8000);
      }
    });
  }

  retryDownload(documentId: number) {
    const item = this.filteredDocs.find(d => d.id === documentId);
    if (item) { item._retryAvailable = false; item._downloadError = null; item._pendingConfirmation = false; }
    this.downloadDocument(documentId);
  }

  /**
   * Fase 3b: flujo unificado de descarga. Crea una sesion via el back y
   * dispara la descarga apuntando al endpoint single-use {@code /file}.
   * No requiere {@code confirmDownload} aparte: el audit se guarda al
   * consumir la sesion.
   */
  private downloadDocumentV2(documentId: number, item: any) {
    this.sessionsService.createSession({ documentId, intent: 'DOWNLOAD' }).pipe(
      timeout(15000),
      catchError(err => throwError(() => err?.name === 'TimeoutError' ? { status: 0, _timeout: true } : err))
    ).subscribe({
      next: (session) => {
        this.downloading.delete(documentId);
        if (!session?.downloadUrl) return;
        const a = document.createElement('a');
        a.href = session.downloadUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { try { document.body.removeChild(a); } catch (e) {} }, 200);
        const d = this.filteredDocs.find(x => x.id === documentId);
        if (d) { d._downloaded = true; d._pendingConfirmation = false; }
      },
      error: (err: any) => {
        this.downloading.delete(documentId);
        const doc = this.filteredDocs.find(d => d.id === documentId);
        if (!doc) return;
        if (err?.status === 429) {
          doc._retryAvailable = true;
          doc._downloadError = 'Demasiadas descargas. Intenta de nuevo en unos minutos.';
        } else if (err?.status === 410 || err?.status === 404) {
          doc._retryAvailable = true;
          doc._downloadError = 'El permiso expiro. Intenta de nuevo.';
        } else if (err?.status === 403) {
          doc._downloadError = 'No tienes acceso a este documento.';
        } else if (err?._timeout || err?.status === 0) {
          doc._retryAvailable = true;
          doc._downloadError = 'El servidor tardo demasiado. Intenta de nuevo.';
        } else {
          doc._downloadError = 'No se pudo preparar la descarga. Intenta de nuevo.';
        }
        setTimeout(() => { const d = this.filteredDocs.find(x => x.id === documentId); if (d) { d._downloadError = null; d._retryAvailable = false; } }, 8000);
      }
    });
  }
}
