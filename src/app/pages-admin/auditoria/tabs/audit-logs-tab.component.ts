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
  NbTagModule,
  NbToastrService,
  NbTooltipModule,
} from '@nebular/theme';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import {
  AuditApiService,
  AuditLogDto,
  AuditLogsFilter,
  PageResponse,
} from '../../../@core/backend/services/audit.service';
import { AuditLabelPipe } from '../audit-label.pipe';

@Component({
  selector: 'ngx-audit-logs-tab',
  standalone: true,
  templateUrl: './audit-logs-tab.component.html',
  styleUrls: ['./audit-logs-tab.component.scss'],
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
    NbTagModule,
    NbTooltipModule,
    DatePipe,
    AuditLabelPipe,
  ],
})
export class AuditLogsTabComponent implements OnInit, OnDestroy {
  private api = inject(AuditApiService);
  private router = inject(Router);
  private toastr = inject(NbToastrService);
  private destroy$ = new Subject<void>();
  private searchTrigger$ = new Subject<void>();

  loading = false;
  data: PageResponse<AuditLogDto> | null = null;

  categories: string[] = [];
  severities: string[] = [];

  filter: AuditLogsFilter = {
    page: 0,
    size: 25,
    sortBy: 'timestampTs',
    sortDir: 'DESC',
  };

  ngOnInit(): void {
    this.api.getCatalog().subscribe({
      next: c => {
        this.categories = c.categories;
        this.severities = c.severities;
      },
      error: () => {
        this.categories = ['USER', 'PAYMENT', 'SUBSCRIPTION', 'DOCUMENT', 'SECURITY', 'SYSTEM',
          'PROMOTOR', 'KIT', 'CAMPAIGN', 'COUPON'];
        this.severities = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];
      },
    });

    this.searchTrigger$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.reload());

    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void {
    this.loading = true;
    this.api.listLogs(this.filter).subscribe({
      next: page => {
        this.data = page;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.toastr.danger(err?.error?.message || 'No se pudieron cargar los logs', 'Error');
      },
    });
  }

  onFilterChange(): void {
    this.filter.page = 0;
    this.searchTrigger$.next();
  }

  applyFilters(): void {
    this.filter.page = 0;
    this.reload();
  }

  resetFilters(): void {
    this.filter = { page: 0, size: 25, sortBy: 'timestampTs', sortDir: 'DESC' };
    this.reload();
  }

  goToPage(page: number): void {
    if (!this.data) return;
    if (page < 0 || page >= this.data.totalPages) return;
    this.filter.page = page;
    this.reload();
  }

  openDetail(row: AuditLogDto): void {
    this.router.navigate(['/pages-admin/auditoria/log', row.id]);
  }

  exportCsv(): void {
    this.api.exportCsv(this.filter).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: err => this.toastr.danger(err?.error?.message || 'Error exportando', 'Error'),
    });
  }

  trackById(_: number, row: AuditLogDto): number {
    return row.id;
  }

  severityClass(s: string | null | undefined): string {
    switch ((s || '').toUpperCase()) {
      case 'CRITICAL': return 'sev-critical';
      case 'ERROR': return 'sev-error';
      case 'WARN': return 'sev-warn';
      default: return 'sev-info';
    }
  }

  /**
   * Registros emitidos antes de la migracion V16: no tienen severity ni
   * timestampTs. Los marcamos visualmente como "legacy" para que el usuario
   * sepa que la columna vacia no es un bug del backend.
   */
  isLegacy(row: AuditLogDto): boolean {
    return !row.severity && !row.timestampTs;
  }
}
