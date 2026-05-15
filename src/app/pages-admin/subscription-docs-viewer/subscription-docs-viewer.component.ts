import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { Subject, of } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';

import { DocumentsService } from '../../@core/backend/services/documents.service';
import { SubscriptionTypesData, SubscriptionType } from '../../@core/data/subscription-types';
import { MateriaData, Materia, Opcion } from '../../@core/data/materia';
import { Document } from '../../@core/interfaces/documents';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';

interface UnitItem {
  id: number;           // UnitSchedule ID — sent to backend as filter
  unidadNumero: number;
  titulo: string;
}

@Component({
    selector: 'ngx-subscription-docs-viewer',
    templateUrl: './subscription-docs-viewer.component.html',
    styleUrls: ['./subscription-docs-viewer.component.scss'],
    standalone: true,
    imports: [
        MatIcon,
        MatCard,
        MatCardHeader,
        MatCardTitle,
        MatCardContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatSelect,
        MatOption,
        MatSuffix,
        MatCardActions,
        MatButton,
        MatProgressSpinner,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        MatPaginator,
    ],
})
export class SubscriptionDocsViewerComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private documentsService = inject(DocumentsService);
  private subscriptionTypesData = inject(SubscriptionTypesData);
  private materiaData = inject(MateriaData);


  form!: FormGroup;

  // Dropdown options
  subscriptionTypes: SubscriptionType[] = [];
  anios: number[] = [];
  unidades: UnitItem[] = [];
  materias: Materia[] = [];
  opciones: Opcion[] = [];

  // All loaded UnitSchedules for the selected subscription type (raw)
  private allUnitSchedules: any[] = [];

  // Table
  displayedColumns = ['title', 'anio', 'unidad', 'materia', 'opcion', 'format'];
  documents: any[] = [];
  totalDocuments = 0;
  pageSize = 20;
  currentPage = 1;
  isLoading = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.form = this.fb.group({
      tipoSuscripcion: [{ value: null, disabled: false }],
      anio:            [{ value: null, disabled: true }],
      unidad:          [{ value: null, disabled: true }],
      materia:         [{ value: null, disabled: true }],
      opcion:          [{ value: null, disabled: true }],
    });

    this.loadSubscriptionTypes();
    this.setupCascades();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────────────────────────
  // Load initial data
  // ─────────────────────────────────────────────────────────────────

  private loadSubscriptionTypes(): void {
    this.subscriptionTypesData.getAllActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => this.subscriptionTypes = types ?? []);
  }

  // ─────────────────────────────────────────────────────────────────
  // Cascades
  // ─────────────────────────────────────────────────────────────────

  private setupCascades(): void {

    // Tier 1: tipo suscripción changes → load UnitSchedules (→ años) + load materias
    this.form.get('tipoSuscripcion')!.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        switchMap((id: number | null) => {
          this.resetFields(['anio', 'unidad', 'materia', 'opcion']);
          this.anios = [];
          this.unidades = [];
          this.materias = [];
          this.opciones = [];
          this.allUnitSchedules = [];

          if (!id) {
            this.clearResults();
            this.disableFields(['anio', 'unidad', 'materia', 'opcion']);
            return of(null);
          }

          // Load UnitSchedules and materias in parallel
          this.materiaData.getActivasBySubscriptionType(id)
            .pipe(takeUntil(this.destroy$), catchError(() => of([])))
            .subscribe((mats: Materia[]) => {
              this.materias = mats ?? [];
              if (this.materias.length > 0) {
                this.form.get('materia')!.enable({ emitEvent: false });
              }
            });

          return this.documentsService.getUnitSchedulesBySubscriptionType(id)
            .pipe(catchError(() => of([])));
        })
      )
      .subscribe((data: any[] | null) => {
        if (data) {
          this.allUnitSchedules = data;
          // Extract unique years
          this.anios = [...new Set<number>(data.map((u: any) => u.anio))]
            .sort((a, b) => a - b);
          if (this.anios.length > 0) {
            this.form.get('anio')!.enable({ emitEvent: false });
          }
        }
        if (this.form.get('tipoSuscripcion')!.value) {
          this.search();
        }
      });

    // Tier 2: año changes → unidades (filtered from allUnitSchedules)
    this.form.get('anio')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((anio: number | null) => {
        this.resetFields(['unidad']);
        this.unidades = [];
        this.form.get('unidad')!.disable({ emitEvent: false });

        if (anio != null) {
          const seen = new Set<number>();
          this.unidades = this.allUnitSchedules
            .filter((u: any) => u.anio === anio)
            .reduce((acc: UnitItem[], u: any) => {
              if (!seen.has(u.unidadNumero)) {
                seen.add(u.unidadNumero);
                acc.push({ id: u.id, unidadNumero: u.unidadNumero, titulo: u.titulo });
              }
              return acc;
            }, [])
            .sort((a, b) => a.unidadNumero - b.unidadNumero);

          if (this.unidades.length > 0) {
            this.form.get('unidad')!.enable({ emitEvent: false });
          }
        }
        this.search();
      });

    // Tier 3: unidad changes → search (unitScheduleId derived here)
    this.form.get('unidad')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.search());

    // Tier 4: materia changes → opciones (from loaded materias.opciones)
    this.form.get('materia')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((materiaId: number | null) => {
        this.resetFields(['opcion']);
        this.opciones = [];
        this.form.get('opcion')!.disable({ emitEvent: false });

        if (materiaId != null) {
          const found = this.materias.find(m => m.id === materiaId);
          this.opciones = found?.opciones ?? [];
          if (this.opciones.length > 0) {
            this.form.get('opcion')!.enable({ emitEvent: false });
          }
        }
        this.search();
      });

    // Tier 5: opcion changes → search
    this.form.get('opcion')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.search());
  }

  private resetFields(fields: string[]): void {
    fields.forEach(f => this.form.get(f)!.setValue(null, { emitEvent: false }));
  }

  private disableFields(fields: string[]): void {
    fields.forEach(f => this.form.get(f)!.disable({ emitEvent: false }));
  }

  // ─────────────────────────────────────────────────────────────────
  // Search / Filter
  // ─────────────────────────────────────────────────────────────────

  search(resetPage = true): void {
    if (resetPage) {
      this.currentPage = 1;
    }

    const v = this.form.getRawValue();

    if (!v.tipoSuscripcion) {
      this.clearResults();
      return;
    }

    const params: Record<string, string> = {
      tipoSuscripcion: String(v.tipoSuscripcion),
      suscripcion: 'true',
    };

    if (v.materia != null)   { params['materiaSuscripcion'] = String(v.materia); }
    if (v.opcion != null)    { params['opcionSuscripcion']  = String(v.opcion); }

    // Derive unitScheduleId from selected año + unidad
    if (v.anio != null && v.unidad != null) {
      const match = this.allUnitSchedules.find(
        (u: any) => u.anio === v.anio && u.unidadNumero === v.unidad
      );
      if (match) {
        params['unitScheduleId'] = String(match.id);
      }
    }

    this.isLoading = true;
    this.documentsService.filterDocuments(params, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.documents = (res as any).data ?? [];
          this.totalDocuments = (res as any).pagination?.cantidadDeDocumentos ?? 0;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.search(false);
  }

  clearFilters(): void {
    this.resetFields(['tipoSuscripcion', 'anio', 'unidad', 'materia', 'opcion']);
    this.disableFields(['anio', 'unidad', 'materia', 'opcion']);
    this.anios = [];
    this.unidades = [];
    this.materias = [];
    this.opciones = [];
    this.allUnitSchedules = [];
    this.clearResults();
  }

  private clearResults(): void {
    this.documents = [];
    this.totalDocuments = 0;
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────

  get hasFilters(): boolean {
    const v = this.form.getRawValue();
    return !!(v.tipoSuscripcion || v.materia || v.opcion);
  }
}
