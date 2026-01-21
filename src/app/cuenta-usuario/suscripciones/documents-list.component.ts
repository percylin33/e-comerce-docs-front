import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'ngx-documents-list',
  template: `
    <div class="documents-list-v2">
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
              <button class="btn-view" (click)="open(item.fileUrlPublic)">Ver Documento</button>
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
        background: #fbdf32; /* Yellow Accent */
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
    `
  ]
})
export class DocumentsListComponent implements OnChanges {
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

  open(url: string) {
    if (!url) return;
    window.open(url, '_blank');
  }
}
