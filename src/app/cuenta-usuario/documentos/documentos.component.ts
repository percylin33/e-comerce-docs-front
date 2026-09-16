import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { NbCardModule, NbSpinnerModule, NbAlertModule, NbIconModule, NbButtonModule, NbTooltipModule, NbToastrService } from '@nebular/theme';

import { PaymentService } from '../../@core/backend/services/payment.service';
import { DownloadSessionService } from '../../@core/services/download-session.service';
import { computeDownloadWindowMs } from '../../@core/services/download-window.util';
import { DocumentosListLegacyComponent } from './documentos-list-legacy/documentos-list-legacy.component';
import { DocumentosGridViewComponent } from './documentos-grid-view/documentos-grid-view.component';
import {
  DocumentoComprado,
  DownloadState,
  ViewMode,
  VIEW_MODE_STORAGE_KEY,
} from './shared/documento-comprado.model';
import { normalizeImageUrls } from './shared/document-actions.helper';

/**
 * Shell: carga la lista plana de documentos una sola vez y la entrega a una de
 * las dos vistas hijas (grid o legacy) según `viewMode`. La elección se persiste
 * en localStorage. Toda la lógica de descarga vive aquí.
 */
@Component({
  selector: 'ngx-documentos',
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    NbCardModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule,
    NbButtonModule,
    NbTooltipModule,
    DocumentosGridViewComponent,
    DocumentosListLegacyComponent,
  ],
})
export class DocumentosComponent implements OnInit, OnDestroy {
  private readonly paymentService = inject(PaymentService);
  private readonly sessionsService = inject(DownloadSessionService);
  private readonly toastr = inject(NbToastrService);

  readonly documents = signal<DocumentoComprado[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string>('');
  readonly viewMode = signal<ViewMode>(this.readPersistedViewMode());
  readonly downloadStates = signal<ReadonlyMap<number, DownloadState>>(new Map());

  private readonly pendingTimers = new Map<number, ReturnType<typeof setTimeout>>();

  ngOnInit(): void {
    this.loadUserDocuments();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach((timer) => clearTimeout(timer));
    this.pendingTimers.clear();
  }

  // ===== View mode =====
  setViewMode(mode: ViewMode): void {
    if (this.viewMode() === mode) return;
    this.viewMode.set(mode);
    this.persistViewMode(mode);
  }

  private readPersistedViewMode(): ViewMode {
    if (typeof window === 'undefined' || !window.localStorage) return 'grid';
    try {
      const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return stored === 'legacy' ? 'legacy' : 'grid';
    } catch {
      return 'grid';
    }
  }

  private persistViewMode(mode: ViewMode): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Modo incógnito / storage bloqueado: silencioso.
    }
  }

  // ===== Carga inicial =====
  loadUserDocuments(): void {
    this.loading.set(true);
    this.error.set('');

    this.paymentService.getMyPurchases().subscribe({
      next: (response) => {
        if (response?.result && Array.isArray(response.data)) {
          const flat: DocumentoComprado[] = [];
          for (const compra of response.data) {
            const docs = compra?.documentos || [];
            for (const doc of docs) {
              flat.push(
                normalizeImageUrls({
                  ...doc,
                  paymentId: compra.paymentId ?? doc.paymentId,
                }),
              );
            }
          }
          this.documents.set(flat);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar documentos:', err);
        this.error.set('Error al cargar tus documentos. Por favor, intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  // ===== Descarga (single-use session) =====
  descargarDocumento(doc: DocumentoComprado): void {
    if (this.downloadStates().has(doc.id)) return;

    if (!doc.descargable) {
      this.toastr.warning(
        doc.mensajeDescarga || 'Este documento no está disponible para descarga',
        'Descarga no disponible',
      );
      return;
    }

    this.setDownloadState(doc.id, 'preparing');
    this.sessionsService
      .createSession({ documentId: doc.id, intent: 'DOWNLOAD' })
      .pipe(
        timeout(15000),
        catchError((err) =>
          throwError(() =>
            err?.name === 'TimeoutError' ? { status: 0, _timeout: true } : err,
          ),
        ),
      )
      .subscribe({
        next: (session) => {
          if (!session?.downloadUrl) {
            this.clearDownloadState(doc.id);
            this.toastr.danger('No se pudo preparar la descarga.', 'Error');
            return;
          }
          this.setDownloadState(doc.id, 'downloading');
          this.triggerAnchorDownload(session.downloadUrl);
          const nombre = session.fileName || doc.title;
          this.toastr.success(
            `Tu archivo "${nombre}" se está descargando. Revisa tu carpeta de descargas.`,
            'Descarga iniciada',
            { duration: 4000 },
          );
          const windowMs = computeDownloadWindowMs(session.fileSize);
          const timer = setTimeout(() => this.clearDownloadState(doc.id), windowMs);
          this.pendingTimers.set(doc.id, timer);
        },
        error: (err: any) => {
          this.clearDownloadState(doc.id);
          let message = 'No se pudo preparar la descarga. Intenta de nuevo.';
          if (err?.status === 429) {
            message = 'Demasiadas descargas. Intenta de nuevo en unos minutos.';
          } else if (err?.status === 410 || err?.status === 404) {
            message = 'El permiso expiró. Intenta de nuevo.';
          } else if (err?.status === 403) {
            message = 'No tienes acceso a este documento.';
          } else if (err?._timeout || err?.status === 0) {
            message = 'El servidor tardó demasiado. Intenta de nuevo.';
          }
          this.toastr.danger(message, 'Error de descarga', { duration: 7000 });
        },
      });
  }

  private setDownloadState(documentId: number, state: DownloadState): void {
    this.downloadStates.update((current) => {
      const next = new Map(current);
      next.set(documentId, state);
      return next;
    });
  }

  private clearDownloadState(documentId: number): void {
    const timer = this.pendingTimers.get(documentId);
    if (timer) {
      clearTimeout(timer);
      this.pendingTimers.delete(documentId);
    }
    this.downloadStates.update((current) => {
      if (!current.has(documentId)) return current;
      const next = new Map(current);
      next.delete(documentId);
      return next;
    });
  }

  private triggerAnchorDownload(downloadUrl: string): void {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {
        /* ignore */
      }
    }, 200);
  }
}