import {
  Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit,
  Output, SimpleChanges, inject,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  FormBuilder, FormGroup, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { Subject, of } from 'rxjs';
import {
  catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil,
} from 'rxjs/operators';

import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DocumentsService } from '../../../@core/backend/services/documents.service';
import { GradeHierarchyService } from '../../../@core/backend/services/grade-hierarchy.service';
import { HierarchyItem } from '../../../@core/interfaces/grade-hierarchy';
import { Document as DocItem, Situaciones } from '../../../@core/interfaces/documents';

/** Item del carrito devuelto por el explorador al wizard padre. */
export interface CatalogExplorerItem {
  id: number;
  title: string;
  price: number;
  category?: string;
  /** Code interno de la categoria (p.ej. PLANIFICACION, EVALUACION, KITS). */
  categoryCode?: string;
  materia?: string;
  nivel?: string;
  thumbUrl?: string;
  isKit?: boolean;
}

/** Item del sidebar de categorias. KITS es una entrada sintetica que apunta
 * a la categoria PLANIFICACION del backend pero con esKitPlanificacion=true. */
interface SidebarCategoryItem {
  code: string;
  name: string;
  icon: string;
  categoryId: number | null;
  isSyntheticKits?: boolean;
}

/**
 * Vista inline del explorador de catalogo. Reemplaza al antiguo modal
 * CatalogExplorerDialogComponent. Vive siempre visible en el Paso 1 del
 * wizard de venta manual y publica su seleccion en tiempo real (live-sync)
 * mediante el Output `selectionChange`.
 *
 * - Sin header propio ni footer con botones (no es modal).
 * - Cada toggle de checkbox emite el array completo + abre snackbar con
 *   accion "Deshacer".
 * - Publica conteos de seleccionados por categoria para el badge del sidebar.
 */
@Component({
  selector: 'ngx-catalog-explorer',
  templateUrl: './catalog-explorer.component.html',
  styleUrls: ['./catalog-explorer.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatButton, MatIconButton, MatIcon,
    MatSelect, MatOption, MatCheckbox, MatPaginator,
    MatProgressSpinner, MatTooltip,
    DecimalPipe,
  ],
})
export class CatalogExplorerComponent implements OnInit, OnChanges, OnDestroy {
  private fb = inject(FormBuilder);
  private documentsService = inject(DocumentsService);
  private gradeHierarchy = inject(GradeHierarchyService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  /** Carrito actual del wizard padre (entrada). */
  @Input() preselected: CatalogExplorerItem[] = [];

  /** Se emite con la lista completa cada vez que cambia la seleccion. */
  @Output() selectionChange = new EventEmitter<CatalogExplorerItem[]>();
  /** Se emite con conteos por code de categoria para el badge del sidebar. */
  @Output() categoryCountsChange = new EventEmitter<Map<string, number>>();

  filtersForm!: FormGroup;

  // ===== Sidebar =====
  sidebarCategories: SidebarCategoryItem[] = [];
  loadingSidebar = false;
  activeCategoryCode: string | null = null;
  activeCategoryId: number | null = null;
  private categoryIdMap = new Map<string, number>();
  /** name (lowercase) -> code. Usado para derivar categoryCode desde doc.category. */
  private categoryNameToCode = new Map<string, string>();

  // ===== Cascada estandar (no KITS) =====
  levels: HierarchyItem[] = [];
  subjects: HierarchyItem[] = [];
  grades: HierarchyItem[] = [];
  loadingLevels = false;
  loadingSubjects = false;
  loadingGrades = false;

  // ===== KITS =====
  anios: number[] = [];
  situaciones: Situaciones[] = [];
  loadingAnios = false;
  loadingSituaciones = false;
  selectedNivelCode: string | null = null;
  selectedSubjectCode: string | null = null;

  // ===== Resultados =====
  results: DocItem[] = [];
  loading = false;
  totalItems = 0;
  pageSize = 24;
  pageIndex = 0;
  readonly pageSizeOptions = [12, 24, 48, 96];

  // ===== Seleccion (clave: id de documento) =====
  selectedMap = new Map<number, CatalogExplorerItem>();

  /** Categorias que NO se ofrecen en venta manual. */
  private readonly EXCLUDED_SIDEBAR_CODES = new Set([
    'MEMBRESIAS', 'SUSCRIPCION',
  ]);

  /** Iconos por code de categoria (mismo set que site/categorias). */
  private readonly CATEGORY_ICONS: Record<string, string> = {
    KITS:           'category',
    PLANIFICACION:  'event_note',
    EVALUACION:     'rule',
    EBOOKS:         'menu_book',
    ESTRATEGIAS:    'tips_and_updates',
    REFORZAMIENTO:  'trending_up',
    PLAN_LECTOR:    'bookmark',
    TALLERES:       'layers',
    MATERIAL_GRATIS: 'redeem',
    RECURSOS:       'folder_open',
    CONCURSOS:      'emoji_events',
  };

  private search$ = new Subject<void>();

  ngOnInit(): void {
    this.filtersForm = this.fb.group({
      title: [''],
      levelId: [{ value: null, disabled: true }],
      subjectId: [{ value: null, disabled: true }],
      gradeId: [{ value: null, disabled: true }],
      anio: [{ value: null, disabled: true }],
      situacionId: [{ value: null, disabled: true }],
    });

    this.loadSidebarCategories();
    this.setupFormSubscriptions();
    this.setupSearchPipeline();

    this.applyPreselected(this.preselected || []);
    this.triggerSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preselected'] && !changes['preselected'].firstChange) {
      this.applyPreselected(changes['preselected'].currentValue || []);
    }
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
      catchError(() => of([] as HierarchyItem[])),
    ).subscribe(items => {
      this.loadingSidebar = false;
      const active = (items || []).filter(c => c.active !== false);
      active.forEach(c => {
        this.categoryIdMap.set(c.code, c.id);
        if (c.name) this.categoryNameToCode.set(c.name.toLowerCase(), c.code);
      });

      const planId = this.categoryIdMap.get('PLANIFICACION') ?? null;
      const synthKits: SidebarCategoryItem = {
        code: 'KITS',
        name: 'Kits de Planificacion',
        icon: this.CATEGORY_ICONS['KITS'] || 'category',
        categoryId: planId,
        isSyntheticKits: true,
      };

      const rest = active
        .filter(c => !this.EXCLUDED_SIDEBAR_CODES.has(c.code))
        .map<SidebarCategoryItem>(c => ({
          code: c.code,
          name: c.name,
          icon: this.CATEGORY_ICONS[c.code] || 'folder',
          categoryId: c.id,
        }));

      this.sidebarCategories = [synthKits, ...rest];
      // Si ya habia preseleccionados, re-emitir conteos con codes resueltos
      this.emitCategoryCounts();
    });
  }

  selectCategory(item: SidebarCategoryItem | null): void {
    if (!item) {
      this.activeCategoryCode = null;
      this.activeCategoryId = null;
    } else {
      this.activeCategoryCode = item.code;
      this.activeCategoryId = item.isSyntheticKits
        ? (this.categoryIdMap.get('PLANIFICACION') ?? null)
        : item.categoryId;
    }

    this.levels = []; this.subjects = []; this.grades = [];
    this.anios = []; this.situaciones = [];
    this.selectedNivelCode = null;
    this.selectedSubjectCode = null;
    this.filtersForm.patchValue({
      levelId: null, subjectId: null, gradeId: null,
      anio: null, situacionId: null,
    }, { emitEvent: false });
    this.disableAllCascadeControls();

    if (!item) {
      this.pageIndex = 0;
      this.search$.next();
      return;
    }

    if (item.isSyntheticKits) {
      this.loadAniosForKits();
      if (this.activeCategoryId) this.loadLevels(this.activeCategoryId);
    } else if (this.activeCategoryId) {
      this.loadLevels(this.activeCategoryId);
    }

    this.pageIndex = 0;
    this.search$.next();
  }

  isActiveSidebarItem(item: SidebarCategoryItem): boolean {
    return item.code === this.activeCategoryCode;
  }

  get isKitsActive(): boolean {
    return this.activeCategoryCode === 'KITS';
  }

  // ===== Visibilidad de chips =====
  get shouldShowAnioChip(): boolean {
    return this.isKitsActive;
  }

  get shouldShowNivelChip(): boolean {
    if (!this.activeCategoryCode) return false;
    if (this.isKitsActive) return !!this.filtersForm?.get('anio')?.value;
    return true;
  }

  get shouldShowSituacionChip(): boolean {
    if (!this.isKitsActive) return false;
    return !!this.filtersForm?.get('anio')?.value
        && !!this.filtersForm?.get('levelId')?.value;
  }

  get shouldShowMateriaChip(): boolean {
    if (!this.activeCategoryCode) return false;
    if (!this.isKitsActive) return !!this.filtersForm?.get('levelId')?.value;
    const situ = this.filtersForm?.get('situacionId')?.value;
    const subj = this.filtersForm?.get('subjectId')?.value;
    return (this.selectedNivelCode === 'SECUNDARIA' && !!situ) || !!subj;
  }

  get shouldShowGradoChip(): boolean {
    if (!this.activeCategoryCode) return false;
    if (!this.isKitsActive) return !!this.filtersForm?.get('subjectId')?.value;
    const situ = this.filtersForm?.get('situacionId')?.value;
    const grad = this.filtersForm?.get('gradeId')?.value;
    if (!situ && !grad) return false;
    return (
      this.selectedNivelCode === 'INICIAL' ||
      this.selectedNivelCode === 'PRIMARIA' ||
      this.selectedNivelCode === 'SECUNDARIA'
    );
  }

  // Helpers para el indicador de pasos KITS
  get kitsStepAnioDone(): boolean { return !!this.filtersForm?.get('anio')?.value; }
  get kitsStepNivelDone(): boolean { return !!this.filtersForm?.get('levelId')?.value; }
  get kitsStepSituacionDone(): boolean { return !!this.filtersForm?.get('situacionId')?.value; }
  get kitsStepGradoDone(): boolean { return !!this.filtersForm?.get('gradeId')?.value; }

  // ===== Form subscriptions =====
  private setupFormSubscriptions(): void {
    this.filtersForm.get('title')!.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(350),
      distinctUntilChanged(),
    ).subscribe(() => this.triggerSearch());

    this.filtersForm.get('levelId')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((levelId: number | null) => {
        this.subjects = []; this.grades = [];
        this.filtersForm.patchValue(
          { subjectId: null, gradeId: null, situacionId: null },
          { emitEvent: false },
        );
        this.filtersForm.get('subjectId')!.disable({ emitEvent: false });
        this.filtersForm.get('gradeId')!.disable({ emitEvent: false });
        this.filtersForm.get('situacionId')!.disable({ emitEvent: false });
        this.situaciones = [];
        this.selectedSubjectCode = null;

        if (levelId) {
          const lvl = this.levels.find(l => l.id === levelId);
          this.selectedNivelCode = lvl?.code ?? null;
          if (this.isKitsActive) {
            const anio = this.filtersForm.get('anio')!.value;
            if (anio && this.selectedNivelCode) {
              this.loadSituaciones(this.selectedNivelCode, Number(anio));
            }
            this.loadSubjects(levelId);
          } else {
            this.loadSubjects(levelId);
          }
        } else {
          this.selectedNivelCode = null;
        }
        this.triggerSearch();
      });

    this.filtersForm.get('subjectId')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((subjectId: number | null) => {
        this.grades = [];
        this.filtersForm.patchValue({ gradeId: null }, { emitEvent: false });
        this.filtersForm.get('gradeId')!.disable({ emitEvent: false });
        if (subjectId) {
          const sub = this.subjects.find(s => s.id === subjectId);
          this.selectedSubjectCode = sub?.code ?? null;
          this.loadGrades(subjectId);
        } else {
          this.selectedSubjectCode = null;
        }
        this.triggerSearch();
      });

    this.filtersForm.get('gradeId')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.triggerSearch());

    this.filtersForm.get('anio')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((anio: number | null) => {
        this.filtersForm.patchValue(
          { levelId: null, situacionId: null, subjectId: null, gradeId: null },
          { emitEvent: false },
        );
        this.situaciones = []; this.subjects = []; this.grades = [];
        this.selectedNivelCode = null;
        this.selectedSubjectCode = null;
        this.filtersForm.get('situacionId')!.disable({ emitEvent: false });
        this.filtersForm.get('subjectId')!.disable({ emitEvent: false });
        this.filtersForm.get('gradeId')!.disable({ emitEvent: false });
        if (anio && this.levels.length > 0) {
          this.filtersForm.get('levelId')!.enable({ emitEvent: false });
        }
        this.triggerSearch();
      });

    this.filtersForm.get('situacionId')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((situacionId: number | null) => {
        this.filtersForm.patchValue({ subjectId: null, gradeId: null }, { emitEvent: false });
        this.grades = [];
        if (situacionId && this.isKitsActive && this.selectedNivelCode) {
          if (this.selectedNivelCode === 'INICIAL' || this.selectedNivelCode === 'PRIMARIA') {
            this.autoloadGradesFromComunicacion();
          }
        }
        this.triggerSearch();
      });
  }

  private autoloadGradesFromComunicacion(): void {
    const com = this.subjects.find(s =>
      s.code === 'COMUNICACION' || s.code === 'COMUNICACIÓN'
      || s.name?.toUpperCase().includes('COMUNICACI'),
    );
    if (!com) return;
    this.filtersForm.patchValue({ subjectId: com.id }, { emitEvent: false });
    this.selectedSubjectCode = com.code;
    this.loadGrades(com.id);
  }

  // ===== Loaders =====
  private loadLevels(categoryId: number): void {
    this.loadingLevels = true;
    this.gradeHierarchy.getLevels(categoryId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([] as HierarchyItem[])),
    ).subscribe(items => {
      this.loadingLevels = false;
      this.levels = (items || []).filter(i => i.active !== false);
      if (this.levels.length > 0) {
        if (!this.isKitsActive || !!this.filtersForm.get('anio')!.value) {
          this.filtersForm.get('levelId')!.enable({ emitEvent: false });
        }
      }
    });
  }

  private loadSubjects(levelId: number): void {
    this.loadingSubjects = true;
    this.gradeHierarchy.getSubjects(levelId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([] as HierarchyItem[])),
    ).subscribe(items => {
      this.loadingSubjects = false;
      this.subjects = (items || []).filter(i => i.active !== false);
      if (this.subjects.length > 0) {
        this.filtersForm.get('subjectId')!.enable({ emitEvent: false });
      }
    });
  }

  private loadGrades(subjectId: number): void {
    this.loadingGrades = true;
    this.gradeHierarchy.getGrades(subjectId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([] as HierarchyItem[])),
    ).subscribe(items => {
      this.loadingGrades = false;
      this.grades = (items || []).filter(i => i.active !== false);
      if (this.grades.length > 0) {
        this.filtersForm.get('gradeId')!.enable({ emitEvent: false });
      }
    });
  }

  private loadAniosForKits(): void {
    this.loadingAnios = true;
    this.documentsService.getAniosSituaciones().pipe(
      takeUntil(this.destroy$),
      catchError(() => of({ data: [] as number[] } as any)),
    ).subscribe(res => {
      this.loadingAnios = false;
      this.anios = (res?.data || []) as number[];
      if (this.anios.length > 0) {
        this.filtersForm.get('anio')!.enable({ emitEvent: false });
      }
    });
  }

  private loadSituaciones(nivelCode: string, anio: number): void {
    this.loadingSituaciones = true;
    this.documentsService.getSituacionesByNivelAndAnio(nivelCode, anio).pipe(
      takeUntil(this.destroy$),
      catchError(() => of({ data: [] as Situaciones[] } as any)),
    ).subscribe(res => {
      this.loadingSituaciones = false;
      this.situaciones = (res?.data || []) as Situaciones[];
      if (this.situaciones.length > 0) {
        this.filtersForm.get('situacionId')!.enable({ emitEvent: false });
      }
    });
  }

  private disableAllCascadeControls(): void {
    ['levelId', 'subjectId', 'gradeId', 'anio', 'situacionId'].forEach(name => {
      this.filtersForm.get(name)!.disable({ emitEvent: false });
    });
  }

  // ===== Search pipeline =====
  private setupSearchPipeline(): void {
    this.search$.pipe(
      takeUntil(this.destroy$),
      debounceTime(80),
      switchMap(() => {
        this.loading = true;
        const params = this.buildFilterParams();
        return this.documentsService.filterDocuments(
          params, this.pageIndex + 1, this.pageSize,
        ).pipe(catchError(() => of(null)));
      }),
    ).subscribe((res: any) => {
      this.loading = false;
      if (!res) {
        this.results = [];
        this.totalItems = 0;
        this.snackBar.open('Error consultando el catalogo.', 'Cerrar', { duration: 3000 });
        return;
      }
      this.results = (res?.data || []) as DocItem[];
      const pag = res?.pagination;
      this.totalItems = Number(pag?.cantidadDeDocumentos || pag?.totalElements || this.results.length);
    });
  }

  triggerSearch(): void {
    this.pageIndex = 0;
    this.search$.next();
  }

  onPageChange(ev: PageEvent): void {
    this.pageIndex = ev.pageIndex;
    this.pageSize = ev.pageSize;
    this.search$.next();
  }

  buildFilterParams(): Record<string, string> {
    const v = this.filtersForm.getRawValue();
    const params: Record<string, string> = {};

    const title = (v?.title || '').trim();
    if (title) params['title'] = title;

    if (this.isKitsActive) {
      if (this.activeCategoryId) params['categoryId'] = String(this.activeCategoryId);
      params['esKitPlanificacion'] = 'true';
      params['kitEstado'] = 'APROBADO';
      if (v?.anio) params['anio'] = String(v.anio);
      if (v?.levelId) params['levelId'] = String(v.levelId);
      if (v?.situacionId) params['situacionId'] = String(v.situacionId);
      if (v?.subjectId) params['subjectId'] = String(v.subjectId);
      if (v?.gradeId) params['gradeId'] = String(v.gradeId);
    } else {
      if (this.activeCategoryId) params['categoryId'] = String(this.activeCategoryId);
      if (v?.levelId) params['levelId'] = String(v.levelId);
      if (v?.subjectId) params['subjectId'] = String(v.subjectId);
      if (v?.gradeId) params['gradeId'] = String(v.gradeId);
    }

    params['suscripcion'] = 'false';
    return params;
  }

  clearFilters(): void {
    this.filtersForm.patchValue(
      {
        title: '',
        levelId: null, subjectId: null, gradeId: null,
        anio: null, situacionId: null,
      },
      { emitEvent: false },
    );
    this.levels = []; this.subjects = []; this.grades = [];
    this.situaciones = [];
    this.selectedNivelCode = null;
    this.selectedSubjectCode = null;
    this.disableAllCascadeControls();
    if (this.isKitsActive) {
      this.loadAniosForKits();
      if (this.activeCategoryId) this.loadLevels(this.activeCategoryId);
    } else if (this.activeCategoryId) {
      this.loadLevels(this.activeCategoryId);
    }
    this.triggerSearch();
  }

  // ===== Seleccion =====
  private applyPreselected(items: CatalogExplorerItem[]): void {
    this.selectedMap.clear();
    (items || []).forEach(it => this.selectedMap.set(it.id, { ...it }));
    this.emitCategoryCounts();
  }

  isSelected(id: number): boolean {
    return this.selectedMap.has(id);
  }

  /**
   * Toggle desde el checkbox del grid. Live-sync: actualiza el carrito y
   * abre snackbar con accion "Deshacer".
   */
  toggleSelection(doc: DocItem, checked: boolean): void {
    if (doc?.suscripcion) {
      this.snackBar.open(
        'Las suscripciones no se registran por venta manual.',
        'Cerrar', { duration: 3500 },
      );
      return;
    }
    this.applyToggle(doc, checked);

    const msg = checked
      ? `"${this.truncateTitle(doc.title)}" agregado al carrito`
      : `"${this.truncateTitle(doc.title)}" removido del carrito`;
    const ref = this.snackBar.open(msg, 'Deshacer', { duration: 4000 });
    ref.onAction().subscribe(() => {
      this.applyToggle(doc, !checked);
    });
  }

  /** Variante interna que no abre snackbar (evita loops en el undo). */
  private applyToggle(doc: DocItem, checked: boolean): void {
    if (checked) {
      this.selectedMap.set(doc.id, {
        id: doc.id,
        title: doc.title,
        price: Number(doc.price || 0),
        category: doc.category,
        categoryCode: this.resolveCategoryCode(doc),
        materia: doc.materia,
        nivel: doc.nivel,
        thumbUrl: doc.imagenThumbUrlPublic || doc.imagenUrlPublic,
        isKit: !!doc.esKitPlanificacion,
      });
    } else {
      this.selectedMap.delete(doc.id);
    }
    this.emitSelection();
  }

  removeSelected(id: number): void {
    if (this.selectedMap.delete(id)) {
      this.emitSelection();
    }
  }

  /** Devuelve el code de categoria mapeado desde el doc. Kits prevalece. */
  private resolveCategoryCode(doc: DocItem): string | undefined {
    if (doc?.esKitPlanificacion) return 'KITS';
    if (this.isKitsActive) return 'KITS';
    if (doc?.category) {
      const code = this.categoryNameToCode.get(doc.category.toLowerCase());
      if (code) return code;
    }
    return this.activeCategoryCode ?? undefined;
  }

  /** Recalcula y emite seleccion + conteos por categoria. */
  private emitSelection(): void {
    this.selectionChange.emit(this.selectedList);
    this.emitCategoryCounts();
  }

  private emitCategoryCounts(): void {
    const counts = new Map<string, number>();
    for (const it of this.selectedMap.values()) {
      const code = it.categoryCode;
      if (!code) continue;
      counts.set(code, (counts.get(code) || 0) + 1);
    }
    this.categoryCountsChange.emit(counts);
  }

  /** Conteo de una categoria del sidebar (consumido por el template). */
  getCountForCategory(code: string): number {
    let n = 0;
    for (const it of this.selectedMap.values()) {
      if (it.categoryCode === code) n++;
    }
    return n;
  }

  get selectedList(): CatalogExplorerItem[] {
    return Array.from(this.selectedMap.values());
  }

  get totalSelected(): number {
    return this.selectedMap.size;
  }

  private truncateTitle(t: string, max = 38): string {
    if (!t) return '';
    return t.length > max ? `${t.slice(0, max - 1)}...` : t;
  }

  trackById = (_: number, item: { id: number }) => item.id;
}
