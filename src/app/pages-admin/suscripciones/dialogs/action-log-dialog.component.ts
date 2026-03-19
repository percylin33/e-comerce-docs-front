import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubscriptionAdminService } from '../../../@core/backend/services/subscription-admin.service';
import { SubscriptionActionLogEntry } from '../../../@core/interfaces/suscripciones';

export interface ActionLogDialogData {
  subscriptionId: number;
  userName?: string;
}

@Component({
  selector: 'ngx-action-log-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">history</mat-icon>
        <h2 mat-dialog-title>Historial de Acciones</h2>
        <span class="sub-title" *ngIf="data.userName">— {{ data.userName }}</span>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="log-content">

        <!-- Loading state -->
        <div class="loading-state" *ngIf="loading">
          <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
          <p>Cargando historial…</p>
        </div>

        <!-- Error state -->
        <div class="error-state" *ngIf="!loading && error">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error }}</p>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading && !error && entries.length === 0">
          <mat-icon>info_outline</mat-icon>
          <p>No hay acciones registradas para esta suscripción.</p>
        </div>

        <!-- Log entries -->
        <div class="log-list" *ngIf="!loading && !error && entries.length > 0">
          <div class="log-entry" *ngFor="let entry of entries" [ngClass]="'entry-' + entry.action.toLowerCase()">
            <div class="entry-header">
              <span class="action-badge" [ngClass]="'badge-' + entry.action.toLowerCase()">
                <mat-icon>{{ getActionIcon(entry.action) }}</mat-icon>
                {{ entry.action }}
              </span>
              <span class="entry-date">{{ formatDate(entry.performedAt) }}</span>
            </div>
            <div class="entry-body">
              <div class="entry-reason">
                <mat-icon>comment</mat-icon>
                <em>{{ entry.reason }}</em>
              </div>
              <div class="entry-admin">
                <mat-icon>person</mat-icon>
                <span>{{ entry.adminUsername }}</span>
                <span class="extra-data" *ngIf="entry.extraData">· {{ formatExtra(entry.extraData) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button (click)="close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 0; width: 100%; max-width: 640px; overflow: hidden; box-sizing: border-box; }

    .dialog-header {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 20px; background: #f5f5f5; border-radius: 4px 4px 0 0;
    }
    .header-icon { color: #5c6bc0; font-size: 26px; width: 26px; height: 26px; }
    .dialog-header h2 { margin: 0; font-size: 17px; }
    .sub-title { font-size: 13px; color: #666; }
    .close-btn { margin-left: auto; }

    .log-content { padding: 16px 20px; max-height: 55vh; overflow-y: auto; }

    .loading-state, .error-state, .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 24px 0; color: #757575;
    }
    .error-state { color: #c62828; }
    .error-state mat-icon, .empty-state mat-icon { font-size: 36px; width: 36px; height: 36px; }

    .log-list { display: flex; flex-direction: column; gap: 10px; }

    .log-entry {
      border: 1px solid #e0e0e0; border-radius: 6px;
      padding: 10px 14px; background: #fafafa;
    }
    .entry-cancelar { border-left: 4px solid #ef9a9a; }
    .entry-activar  { border-left: 4px solid #a5d6a7; }
    .entry-editar   { border-left: 4px solid #90caf9; }

    .entry-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }

    .action-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 12px;
    }
    .action-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .badge-cancelar { background: #ffebee; color: #c62828; }
    .badge-activar  { background: #e8f5e9; color: #2e7d32; }
    .badge-editar   { background: #e3f2fd; color: #1565c0; }

    .entry-date { font-size: 12px; color: #9e9e9e; }

    .entry-body { display: flex; flex-direction: column; gap: 4px; font-size: 13px; overflow: hidden; }
    .entry-reason, .entry-admin {
      display: flex; align-items: flex-start; gap: 6px; color: #424242;
      overflow: hidden;
    }
    .entry-reason mat-icon, .entry-admin mat-icon { font-size: 15px; width: 15px; height: 15px; color: #9e9e9e; flex-shrink: 0; }
    .entry-reason em { font-style: normal; word-break: break-word; overflow-wrap: anywhere; }
    .entry-admin span { word-break: break-all; overflow-wrap: anywhere; min-width: 0; }
    .extra-data { color: #9e9e9e; font-size: 12px; white-space: nowrap; flex-shrink: 0; }

    .dialog-actions { padding: 10px 20px 14px; display: flex; justify-content: flex-end; }
  `]
})
export class ActionLogDialogComponent {

  entries: SubscriptionActionLogEntry[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private service: SubscriptionAdminService,
    public dialogRef: MatDialogRef<ActionLogDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ActionLogDialogData
  ) {
    this.loadLog();
  }

  loadLog(): void {
    this.loading = true;
    this.error = null;
    this.service.getActionLog(this.data.subscriptionId).subscribe({
      next: (response) => {
        this.entries = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading action log:', err);
        this.error = 'No se pudo cargar el historial de acciones.';
        this.loading = false;
      }
    });
  }

  getActionIcon(action: string): string {
    const map: Record<string, string> = { CANCELAR: 'cancel', ACTIVAR: 'play_circle', EDITAR: 'edit' };
    return map[action] ?? 'info';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  formatExtra(json: string): string {
    try {
      const obj = JSON.parse(json);
      if (obj.dias !== undefined) return `${obj.dias} días añadidos`;
      return JSON.stringify(obj);
    } catch {
      return json;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
