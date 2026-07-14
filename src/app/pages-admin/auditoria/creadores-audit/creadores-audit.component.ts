import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  NbButtonModule,
  NbCardModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTabsetModule,
  NbTagModule,
  NbToastrService,
  NbTooltipModule,
} from '@nebular/theme';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import {
  AuditApiService,
  CreatorAuditEventDto,
  CreatorAuditFilter,
  PageResponse,
} from '../../../@core/backend/services/audit.service';

/**
 * Vista `/pages-admin/auditoria/creadores` — Mejora v1.1 del modulo Creadores.
 *
 * <p>Tres tabs especializados sobre {@code audit_logs} filtrados por
 * {@code category=CREATOR}:</p>
 * <ul>
 *   <li><b>Acciones</b>: todas las acciones del modulo (documentos,
 *       retiros, config, comisiones, etc).</li>
 *   <li><b>Comisiones</b>: solo {@code CREATOR_COMMISSION_EARNED},
 *       {@code CREATOR_COMMISSION_RECOMPUTED},
 *       {@code CREATOR_COMMISSION_BACKFILL_BATCH}.</li>
 *   <li><b>Por Creador</b>: timeline de un creatorId concreto.</li>
 * </ul>
 *
 * <p>Botones de export a CSV (donde aplique). Cada tab reutiliza la misma
 * tabla con colores de severidad.</p>
 *
 * <p>Route: {@code /pages-admin/auditoria/creadores}.</p>
 */
@Component({
  selector: 'ngx-creadores-audit',
  standalone: true,
  templateUrl: './creadores-audit.component.html',
  styleUrls: ['./creadores-audit.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    NbSelectModule,
    NbFormFieldModule,
    NbSpinnerModule,
    NbTabsetModule,
    NbTagModule,
    NbTooltipModule,
    DatePipe,
  ],
})
export class CreadoresAuditComponent implements OnInit, OnDestroy {
  private api = inject(AuditApiService);
  private router = inject(Router);
  private toastr = inject(NbToastrService);
  private destroy$ = new Subject<void>();
  private searchTrigger$ = new Subject<void>();

  // Tabs.
  activeTab: 'ACCIONES' | 'COMISIONES' | 'POR_CREADOR' = 'ACCIONES';
  readonly tabs: Array<{ id: typeof this.activeTab; label: string; icon: string }> = [
    { id: 'ACCIONES',    label: 'Acciones',    icon: 'flash-outline' },
    { id: 'COMISIONES',  label: 'Comisiones',  icon: 'cash-outline' },
    { id: 'POR_CREADOR', label: 'Por Creador', icon: 'person-outline' },
  ];

  // Estado comun.
  loading = false;
  data: PageResponse<CreatorAuditEventDto> | null = null;

  // Filtros.
  filter: CreatorAuditFilter = {
    page: 0,
    size: 25,
  };
  severitiesCsv = '';

  // Para la tab "Por Creador".
  timelineCreatorId: number | null = null;

  // Cat para mostrar (fallback si /categories no devuelve CREATOR).
  readonly severityOptions = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];

  ngOnInit(): void {
    this.searchTrigger$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.reload());

    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ======================== navegación de tabs ========================

  onTabChange(tabId: 'ACCIONES' | 'COMISIONES' | 'POR_CREADOR'): void {
    this.activeTab = tabId;
    this.filter = { page: 0, size: 25 };
    this.severitiesCsv = '';
    this.timelineCreatorId = null;
    this.data = null;
    if (this.activeTab === 'POR_CREADOR' && this.timelineCreatorId == null) {
      // Espera al usuario que ingrese un creatorId.
      return;
    }
    this.reload();
  }

  loadTimeline(): void {
    if (this.timelineCreatorId == null || this.timelineCreatorId <= 0) {
      this.toastr.warning('Ingresa un creatorId valido (numero positivo).', 'Falta dato');
      return;
    }
    this.activeTab = 'POR_CREADOR';
    this.filter = { page: 0, size: 25 };
    this.data = null;
    this.reload();
  }

  // ======================== queries ========================

  reload(): void {
    if (this.activeTab === 'POR_CREADOR' && !this.timelineCreatorId) {
      this.data = null;
      this.loading = false;
      return;
    }
    this.loading = true;

    if (this.activeTab === 'ACCIONES') {
      const f = this.buildFilter();
      this.api.listCreatorActions(f).subscribe({
        next: page => this.onPage(page),
        error: err => this.onError(err, 'No se pudieron cargar las acciones de creadores'),
      });
    } else if (this.activeTab === 'COMISIONES') {
      const f: CreatorAuditFilter = {
        ...this.filter,
        creatorId: this.filter.creatorId ?? undefined,
        page: this.filter.page,
        size: this.filter.size,
      };
      this.api.listCreatorCommissionEvents(f).subscribe({
        next: page => this.onPage(page),
        error: err => this.onError(err, 'No se pudieron cargar los eventos de comisiones'),
      });
    } else if (this.activeTab === 'POR_CREADOR') {
      this.api.getCreatorTimeline(this.timelineCreatorId!, {
        from: this.filter.from,
        to: this.filter.to,
        page: this.filter.page,
        size: this.filter.size,
      }).subscribe({
        next: page => this.onPage(page),
        error: err => this.onError(err, 'No se pudo cargar el timeline del creador'),
      });
    }
  }

  private buildFilter(): CreatorAuditFilter {
    const f: CreatorAuditFilter = {
      page: this.filter.page,
      size: this.filter.size,
    };
    if (this.filter.actionPrefix) f.actionPrefix = this.filter.actionPrefix;
    if (this.filter.from) f.from = this.filter.from;
    if (this.filter.to) f.to = this.filter.to;
    if (this.filter.creatorId != null) f.creatorId = this.filter.creatorId;
    if (this.severitiesCsv) {
      f.severities = this.severitiesCsv.split(',').map(s => s.trim()).filter(Boolean);
    }
    return f;
  }

  private onPage(page: PageResponse<CreatorAuditEventDto>): void {
    this.data = page;
    this.loading = false;
  }

  private onError(err: any, fallback: string): void {
    this.loading = false;
    const msg = err?.error?.message || err?.message || fallback;
    this.toastr.danger(msg, 'Error');
  }

  // ======================== filtros ========================

  onFilterChange(): void {
    this.filter.page = 0;
    this.searchTrigger$.next();
  }

  applyFilters(): void {
    this.filter.page = 0;
    this.reload();
  }

  resetFilters(): void {
    this.filter = { page: 0, size: 25 };
    this.severitiesCsv = '';
    this.reload();
  }

  // ======================== paginacion ========================

  goToPage(page: number): void {
    if (!this.data) return;
    if (page < 0 || page >= this.data.totalPages) return;
    this.filter.page = page;
    this.reload();
  }

  // ======================== export ========================

  exportCsv(): void {
    const filter: { from?: string; to?: string } = {
      from: this.filter.from,
      to: this.filter.to,
    };
    this.api.exportCreatorCommissionsCsv(filter).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `creator_commissions_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.toastr.success('Exportacion lista.', 'CSV');
      },
      error: err => this.onError(err, 'Error exportando CSV'),
    });
  }

  // ======================== visual helpers ========================

  trackById(_: number, row: CreatorAuditEventDto): number {
    return row.id;
  }

  /** Devuelve la clase CSS segun severity (reutilizada del modulo audit). */
  severityClass(s: string | null | undefined): string {
    switch ((s || '').toUpperCase()) {
      case 'CRITICAL': return 'sev-critical';
      case 'ERROR':    return 'sev-error';
      case 'WARN':     return 'sev-warn';
      default:         return 'sev-info';
    }
  }

  /** Devuelve la etiqueta humana de la action. */
  humanAction(action: string | null | undefined): string {
    if (!action) return '';
    return action.replace(/^CREATOR_/, '').replace(/_/g, ' ');
  }

  /** true si la fila es de tipo "comision". Usado para resaltado. */
  isCommission(row: CreatorAuditEventDto): boolean {
    return !!row?.action && row.action.startsWith('CREATOR_COMMISSION_');
  }

  /** Tooltip del payload completo. */
  payloadPreview(row: CreatorAuditEventDto): string {
    return row.payload || '(sin payload)';
  }

  // ======================== drill-down ========================

  /**
   * Navega al detalle de un log en la vista existente.
   * Opcion B: la fila de la tabla es interactiva (click -> /auditoria/log/:id).
   */
  openDetail(row: CreatorAuditEventDto): void {
    if (row?.id == null) return;
    this.router.navigate(['/pages-admin/auditoria/log', row.id]);
  }
}
