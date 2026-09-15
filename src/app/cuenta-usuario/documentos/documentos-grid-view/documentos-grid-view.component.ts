import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
} from 'rxjs/operators';

import { MatIcon } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { NbButtonModule, NbIconModule, NbTooltipModule } from '@nebular/theme';

import { GradeHierarchyService } from '../../../@core/backend/services/grade-hierarchy.service';
import { HierarchyItem } from '../../../@core/interfaces/grade-hierarchy';
import {
  DocumentoComprado,
  DownloadState,
  SidebarCategoryItem,
} from '../shared/documento-comprado.model';
import { buildSidebarCategories } from '../shared/category-icons';
import { isNewDocument } from '../shared/document-actions.helper';

/**
 * Vista grid: sidebar de categorías + barra superior con buscador y selects en
 * cascada (Nivel → Área → Grado) + grid de cards. Documentos comprados en los
 * últimos 7 días se resaltan con un badge "NUEVO" y borde animado.
 *
 * Recibe la lista plana desde el shell y emite `download` para que el shell
 * se encargue de la lógica de descarga (single-use session).
 */
@Component({
  selector: 'ngx-documentos-grid-view',
  templateUrl: './documentos-grid-view.component.html',
  styleUrls: ['./documentos-grid-view.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIcon,
    MatSelect,
    MatOption,
    MatButton,
    MatProgressSpinner,
    MatTooltip,
    NbButtonModule,
    NbIconModule,
    NbTooltipModule,
    DecimalPipe,
  ],
})
export class DocumentosGridViewComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly gradeHierarchy = inject(GradeHierarchyService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ===== Inputs / Outputs =====
  private readonly _documents = signal<DocumentoComprado[]>([]);
  @Input({ required: true })
  set documents(value: DocumentoComprado[]) {
    this._documents.set(value || []);
    this.recomputeCategoryCounts();
  }
  get documents(): DocumentoComprado[] {
    return this._documents();
  }

  private readonly _downloadStates = signal<ReadonlyMap<number, DownloadState>>(new Map());
  @Input({ required: true })
  set downloadStates(value: ReadonlyMap<number, DownloadState>) {
    this._downloadStates.set(value || new Map());
  }
  /** Signal expuesto al template para evitar colisión con el setter del @Input. */
  readonly downloadStatesSignal = this._downloadStates.asReadonly();

  @Output() readonly download = new EventEmitter<DocumentoComprado>();

  // ===== Forms / cascada =====
  filtersForm!: FormGroup;
  levels: HierarchyItem[] = [];
  subjects: HierarchyItem[] = [];
  grades: HierarchyItem[] = [];

  // ===== Sidebar =====
  sidebarCategories: SidebarCategoryItem[] = [];
  loadingSidebar = false;
  readonly activeCategoryCode = signal<string | null>(null);

  private readonly categoryCountsMap = signal<Map<string, number>>(new Map());
  private readonly categoryNewMap = signal<Set<string>>(new Set());

  // ===== Filtros / resultados =====
  private readonly titleQuery = signal<string>('');
  private readonly levelId = signal<number | null>(null);
  private readonly subjectId = signal<number | null>(null);
  private readonly gradeId = signal<number | null>(null);
  private readonly selectedNivelCode = signal<string | null>(null);
  private readonly selectedSubjectCode = signal<string | null>(null);

  readonly loading = signal<boolean>(false);

  readonly filteredDocuments = computed<DocumentoComprado[]>(() => {
    const docs = this._documents();
    const cat = this.activeCategoryCode();
    const t = this.titleQuery().trim().toLowerCase();
    const lvl = this.levelId();
    const sub = this.subjectId();
    const grad = this.gradeId();

    return docs.filter((d) => {
      // Filtro de categoría: "KITS" es sintético (planificacion + ZIP);
      // el resto se compara por categoryCode directo.
      if (cat && !this.matchesCategory(d, cat)) return false;
      if (t && !(d.title || '').toLowerCase().includes(t)) return false;
      if (lvl && !this.nivelMatches(d, lvl)) return false;
      if (sub && !this.materiaMatches(d, sub)) return false;
      if (grad && !this.gradoMatches(d, grad)) return false;
      return true;
    });
  });

  readonly totalDocuments = computed(() => this._documents().length);
  readonly totalFiltered = computed(() => this.filteredDocuments().length);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.filtersForm = this.fb.group({
      title: [''],
      levelId: [{ value: null, disabled: true }],
      subjectId: [{ value: null, disabled: true }],
      gradeId: [{ value: null, disabled: true }],
    });
    this.loadSidebarCategories();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== Sidebar =====
  private loadSidebarCategories(): void {
    this.loadingSidebar = true;
    this.gradeHierarchy.getCategories().pipe(
      takeUntil(this.destroy$),
      catchError(() => {
        this.loadingSidebar = false;
        this.cdr.markForCheck();
        return of([] as HierarchyItem[]);
      }),
    ).subscribe((items) => {
      this.loadingSidebar = false;
      this.sidebarCategories = buildSidebarCategories(
        (items || []).map((c) => ({ id: c.id, code: c.code, name: c.name, active: c.active })),
      );
      this.cdr.markForCheck();
    });
  }

  selectCategory(code: string | null): void {
    this.activeCategoryCode.set(code);
    // Reset cascada al cambiar categoría para mantener coherencia.
    this.filtersForm.patchValue(
      { levelId: null, subjectId: null, gradeId: null },
      { emitEvent: false },
    );
    this.disableAllCascadeControls();
    this.levels = [];
    this.subjects = [];
    this.grades = [];
    this.levelId.set(null);
    this.subjectId.set(null);
    this.gradeId.set(null);
    this.selectedNivelCode.set(null);
    this.selectedSubjectCode.set(null);

    if (code) {
      // Buscar la categoría seleccionada para obtener su categoryId.
      const found = this.sidebarCategories.find((c) => c.code === code);
      const catId = found?.categoryId ?? null;
      if (catId != null) this.loadLevels(catId);
    }
  }

  getCategoryCount(code: string): number {
    return this.categoryCountsMap().get(code) || 0;
  }

  /** Una categoría es "nueva" si al menos uno de sus documentos fue comprado en los últimos N días. */
  hasNewDocs(code: string): boolean {
    return this.categoryNewMap().has(code);
  }

  private recomputeCategoryCounts(): void {
    const counts = new Map<string, number>();
    const newCats = new Set<string>();
    for (const d of this._documents()) {
      const isNew = isNewDocument(d);
      // KITS sintético: docs de PLANIFICACION que NO son ZIP.
      if (this.isKit(d)) {
        counts.set('KITS', (counts.get('KITS') || 0) + 1);
        if (isNew) newCats.add('KITS');
      }
      // PLANIFICACION: docs de esa categoría en formato ZIP.
      if (d.categoryCode === 'PLANIFICACION' && !this.isKit(d)) {
        counts.set('PLANIFICACION', (counts.get('PLANIFICACION') || 0) + 1);
        if (isNew) newCats.add('PLANIFICACION');
      } else if (d.categoryCode && d.categoryCode !== 'PLANIFICACION') {
        counts.set(d.categoryCode, (counts.get(d.categoryCode) || 0) + 1);
        if (isNew) newCats.add(d.categoryCode);
      }
    }
    this.categoryCountsMap.set(counts);
    this.categoryNewMap.set(newCats);
  }

  /** Un kit de planificación es un doc de categoría PLANIFICACION que NO es ZIP. */
  private isKit(doc: DocumentoComprado): boolean {
    if (!doc.categoryCode || doc.categoryCode !== 'PLANIFICACION') return false;
    return (doc.format || '').toUpperCase() !== 'ZIP';
  }

  isActiveSidebarItem(item: SidebarCategoryItem): boolean {
    return item.code === this.activeCategoryCode();
  }

  // ===== Form subscriptions (cascada) =====
  private setupFormSubscriptions(): void {
    this.filtersForm.get('title')!.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe((v: string) => {
      this.titleQuery.set(v || '');
    });

    this.filtersForm.get('levelId')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((levelId: number | null) => {
        this.subjects = [];
        this.grades = [];
        this.filtersForm.patchValue(
          { subjectId: null, gradeId: null },
          { emitEvent: false },
        );
        this.filtersForm.get('subjectId')!.disable({ emitEvent: false });
        this.filtersForm.get('gradeId')!.disable({ emitEvent: false });
        this.selectedSubjectCode.set(null);
        this.subjectId.set(null);
        this.gradeId.set(null);

        if (levelId) {
          const lvl = this.levels.find((l) => l.id === levelId);
          this.selectedNivelCode.set(lvl?.code ?? null);
          this.loadSubjects(levelId);
        } else {
          this.selectedNivelCode.set(null);
        }
        this.levelId.set(levelId);
      });

    this.filtersForm.get('subjectId')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((subjectId: number | null) => {
        this.grades = [];
        this.filtersForm.patchValue({ gradeId: null }, { emitEvent: false });
        this.filtersForm.get('gradeId')!.disable({ emitEvent: false });
        this.gradeId.set(null);
        if (subjectId) {
          const sub = this.subjects.find((s) => s.id === subjectId);
          this.selectedSubjectCode.set(sub?.code ?? null);
          this.loadGrades(subjectId);
        } else {
          this.selectedSubjectCode.set(null);
        }
        this.subjectId.set(subjectId);
      });

    this.filtersForm.get('gradeId')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((gradeId: number | null) => {
        this.gradeId.set(gradeId);
      });
  }

  private loadLevels(categoryId: number): void {
    this.loading.set(true);
    this.gradeHierarchy.getLevels(categoryId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([] as HierarchyItem[])),
    ).subscribe((items) => {
      this.loading.set(false);
      this.levels = (items || []).filter((i) => i.active !== false);
      if (this.levels.length > 0) {
        this.filtersForm.get('levelId')!.enable({ emitEvent: false });
      }
    });
  }

  private loadSubjects(levelId: number): void {
    this.loading.set(true);
    this.gradeHierarchy.getSubjects(levelId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([] as HierarchyItem[])),
    ).subscribe((items) => {
      this.loading.set(false);
      this.subjects = (items || []).filter((i) => i.active !== false);
      if (this.subjects.length > 0) {
        this.filtersForm.get('subjectId')!.enable({ emitEvent: false });
      }
    });
  }

  private loadGrades(subjectId: number): void {
    this.loading.set(true);
    this.gradeHierarchy.getGrades(subjectId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([] as HierarchyItem[])),
    ).subscribe((items) => {
      this.loading.set(false);
      this.grades = (items || []).filter((i) => i.active !== false);
      if (this.grades.length > 0) {
        this.filtersForm.get('gradeId')!.enable({ emitEvent: false });
      }
    });
  }

  private disableAllCascadeControls(): void {
    ['levelId', 'subjectId', 'gradeId'].forEach((name) => {
      this.filtersForm.get(name)!.disable({ emitEvent: false });
    });
  }

  clearFilters(): void {
    this.filtersForm.patchValue(
      { title: '', levelId: null, subjectId: null, gradeId: null },
      { emitEvent: false },
    );
    this.titleQuery.set('');
    this.levelId.set(null);
    this.subjectId.set(null);
    this.gradeId.set(null);
    this.levels = [];
    this.subjects = [];
    this.grades = [];
    this.selectedNivelCode.set(null);
    this.selectedSubjectCode.set(null);
    this.disableAllCascadeControls();
    // Re-cargar niveles según la categoría activa.
    if (this.activeCategoryCode()) {
      const found = this.sidebarCategories.find((c) => c.code === this.activeCategoryCode());
      if (found?.categoryId != null) this.loadLevels(found.categoryId);
    }
  }

  // ===== Helpers de filtrado =====
  private matchesCategory(doc: DocumentoComprado, code: string): boolean {
    if (code === 'KITS') {
      // KITS es sintético: docs de PLANIFICACION que NO son ZIP.
      return this.isKit(doc);
    }
    if (code === 'PLANIFICACION') {
      // PLANIFICACION: docs de esa categoría en formato ZIP.
      return doc.categoryCode === 'PLANIFICACION' && !this.isKit(doc);
    }
    return doc.categoryCode === code;
  }

  private nivelMatches(doc: DocumentoComprado, levelId: number): boolean {
    const lvl = this.levels.find((l) => l.id === levelId);
    if (!lvl) return true;
    return (doc.nivel || '').trim() === lvl.name.trim();
  }

  private materiaMatches(doc: DocumentoComprado, subjectId: number): boolean {
    const subj = this.subjects.find((s) => s.id === subjectId);
    if (!subj) return true;
    return (doc.materia || '').trim() === subj.name.trim();
  }

  private gradoMatches(doc: DocumentoComprado, gradeId: number): boolean {
    const grad = this.grades.find((g) => g.id === gradeId);
    if (!grad) return true;
    return (doc.grado || '').trim() === grad.name.trim();
  }

  // ===== UI helpers =====
  isNew(doc: DocumentoComprado): boolean {
    return isNewDocument(doc);
  }

  onDownloadClick(doc: DocumentoComprado): void {
    if (this._downloadStates().get(doc.id)) return;
    this.download.emit(doc);
  }

  trackById = (_: number, item: { id: number }) => item.id;
}