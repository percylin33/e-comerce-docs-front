import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { KitApprovalService } from '../../../@core/backend/services/kit-approval.service';
import { UnitScheduleOption, KitStatusResponseDto, UnitKitStatusDto, CombinationDetailDto } from '../../../@core/interfaces/kit-approval';

@Component({
  selector: 'ngx-generate-kit',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './generate-kit.component.html',
  styleUrls: ['./generate-kit.component.scss']
})
export class GenerateKitComponent implements OnInit, OnDestroy {
  private kitApprovalService = inject(KitApprovalService);
  private snackBar = inject(MatSnackBar);

  private destroy$ = new Subject<void>();

  loading = false;
  unitSchedules: UnitScheduleOption[] = [];

  // Kit status
  kitStatusData: KitStatusResponseDto | null = null;
  loadingKitStatus = false;
  statusAvailableYears: number[] = [];
  statusAvailableNiveles: string[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  statusSelectedYear: number | null = null;
  statusSelectedNivel: string | null = null;
  expandedUnits: Set<number> = new Set();

  // Detail modal
  detailModalData: CombinationDetailDto | null = null;
  loadingDetail = false;

  // Generate single kit
  generatingCombo: { unitScheduleId: number; materiaId: number; opcionId: number } | null = null;

  private readonly nivelOrder: Record<string, number> = {
    INICIAL: 0, PRIMARIA: 1, SECUNDARIA: 2
  };

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.loading = true;
    this.kitApprovalService.getUnitSchedules().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.unitSchedules = (data || []).filter(
          (u: UnitScheduleOption) => (u.tipoPeriodo || '').toUpperCase() === 'M'
        );
        const years = [...new Set(this.unitSchedules.map(u => u.anio).filter((y): y is number => !!y))]
          .sort((a, b) => b - a);
        this.statusAvailableYears = years;
        if (years.length > 0) {
          this.statusSelectedYear = years[0];
        }
        if (!this.statusSelectedNivel) {
          this.statusSelectedNivel = 'INICIAL';
        }
        if (this.statusSelectedYear && this.statusSelectedNivel) {
          this.loadKitStatus();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading unit schedules:', err);
        this.snackBar.open('Error al cargar unidades de planificación', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  // =============================================
  // Kit status
  // =============================================

  onStatusYearChange(year: number): void {
    this.statusSelectedYear = year;
    this.kitStatusData = null;
    this.expandedUnits.clear();
    this.loadKitStatus();
  }

  onStatusNivelChange(nivel: string): void {
    this.statusSelectedNivel = nivel;
    this.kitStatusData = null;
    this.expandedUnits.clear();
    this.loadKitStatus();
  }

  loadKitStatus(): void {
    if (!this.statusSelectedYear || !this.statusSelectedNivel) return;
    this.loadingKitStatus = true;
    this.kitApprovalService.getKitStatus(this.statusSelectedYear, this.statusSelectedNivel).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingKitStatus = false)
    ).subscribe({
      next: (response) => {
        if (response?.result) {
          this.kitStatusData = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading kit status:', err);
        this.snackBar.open('Error al cargar estado de kits', 'Cerrar', { duration: 3000 });
      }
    });
  }

  refreshData(): void {
    this.loadKitStatus();
  }

  toggleUnitExpand(unitId: number): void {
    if (this.expandedUnits.has(unitId)) {
      this.expandedUnits.delete(unitId);
    } else {
      this.expandedUnits.add(unitId);
    }
  }

  countKitsInUnit(unit: UnitKitStatusDto): number {
    return unit.combinations.filter(c => c.hasKit).length;
  }

  // =============================================
  // Combination detail modal
  // =============================================

  openCombinationDetail(unitScheduleId: number, materiaId: number, opcionId: number): void {
    this.loadingDetail = true;
    this.detailModalData = null;
    this.kitApprovalService.getCombinationDetail(unitScheduleId, materiaId, opcionId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingDetail = false)
    ).subscribe({
      next: (response) => {
        if (response?.result) {
          this.detailModalData = response.data;
        } else {
          this.snackBar.open('No se pudo cargar el detalle', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Error loading combination detail:', err);
        this.snackBar.open('Error al cargar detalle de combinación', 'Cerrar', { duration: 3000 });
      }
    });
  }

  closeCombinationDetail(): void {
    this.detailModalData = null;
  }

  // =============================================
  // Generate single kit
  // =============================================

  generateKit(unitScheduleId: number, materiaId: number, opcionId: number): void {
    this.generatingCombo = { unitScheduleId, materiaId, opcionId };
    this.kitApprovalService.generateSingleKit(unitScheduleId, materiaId, opcionId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.generatingCombo = null)
    ).subscribe({
      next: (response) => {
        if (response?.result) {
          this.snackBar.open('Kit generado correctamente', 'Cerrar', { duration: 4000 });
          this.loadKitStatus();
        } else {
          this.snackBar.open('Error al generar el kit', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Error generating kit:', err);
        const msg = err?.error?.data || 'Error al generar el kit';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  isGenerating(unitScheduleId: number, materiaId: number, opcionId: number): boolean {
    if (!this.generatingCombo) return false;
    return this.generatingCombo.unitScheduleId === unitScheduleId
      && this.generatingCombo.materiaId === materiaId
      && this.generatingCombo.opcionId === opcionId;
  }

  // =============================================
  // Badge helpers
  // =============================================

  kitDocEstadoBadge(estado: string | null | undefined): string {
    const map: Record<string, string> = {
      'DISPONIBLE': 'badge-success',
      'GENERANDO': 'badge-warning',
      'ERROR': 'badge-danger',
      'VACIO': 'badge-danger'
    };
    return map[estado ?? ''] ?? 'badge-muted';
  }

  kitStateBadgeClass(estado: string | null): string {
    const map: Record<string, string> = {
      'VACIO': 'badge-danger',
      'ERROR': 'badge-danger',
      'GENERANDO': 'badge-warning',
      'DISPONIBLE': 'badge-info'
    };
    return map[estado ?? ''] ?? 'badge-muted';
  }
}
