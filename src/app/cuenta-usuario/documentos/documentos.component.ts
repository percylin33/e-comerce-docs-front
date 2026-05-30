import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { PaymentService } from '../../@core/backend/services/payment.service';
import { DownloadSessionService } from '../../@core/services/download-session.service';
import { computeDownloadWindowMs } from '../../@core/services/download-window.util';
import {
  NbCardModule,
  NbSpinnerModule,
  NbAlertModule,
  NbIconModule,
  NbButtonModule,
  NbTooltipModule,
  NbToastrService,
} from '@nebular/theme';
import { RouterLink } from '@angular/router';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';
import { throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

interface DocumentoComprado {
  id: number;
  title: string;
  description: string;
  price: number;
  fileUrlPublic: string;
  fechaCompra: string;
  format: string;
  nivel?: string;
  materia?: string;
  grado?: string;
  descargable: boolean;
  mensajeDescarga?: string;
}

interface CompraAgrupada {
  paymentId: number;
  fechaCompra: string;
  montoTotal: number;
  documentos: DocumentoComprado[];
  mostrarDocumentos: boolean;
}

export type DownloadState = 'preparing' | 'downloading';

@Component({
  selector: 'ngx-documentos',
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NbCardModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule,
    NbButtonModule,
    NbTooltipModule,
    RouterLink,
    MatCard,
    MatCardHeader,
    MatCardContent,
  ],
})
export class DocumentosComponent implements OnInit, OnDestroy {
  private readonly paymentService = inject(PaymentService);
  private readonly sessionsService = inject(DownloadSessionService);
  private readonly toastr = inject(NbToastrService);
  private readonly locale = inject(LOCALE_ID);

  readonly compras = signal<CompraAgrupada[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string>('');
  // Estado de descarga por documento: 'preparing' durante el POST /sessions,
  // 'downloading' tras disparar el a.click() y hasta que cierra la ventana
  // heuristica (ver computeDownloadWindowMs). Permite mantener el spinner
  // y el lock del boton durante toda la transferencia nativa del navegador.
  readonly downloadStates = signal<ReadonlyMap<number, DownloadState>>(new Map());

  // Timers de cierre de ventana por documento. Se cancelan en OnDestroy
  // para evitar callbacks tras desmontaje.
  private readonly pendingTimers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly totalDocumentos = computed(() =>
    this.compras().reduce((total, compra) => total + compra.documentos.length, 0),
  );

  ngOnInit(): void {
    this.loadUserDocuments();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach((timer) => clearTimeout(timer));
    this.pendingTimers.clear();
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

  loadUserDocuments(): void {
    this.loading.set(true);
    this.error.set('');

    // El backend lee el userId desde el token JWT (SecurityContext)
    this.paymentService.getMyPurchases().subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.compras.set(
            response.data.map((compra: any) => ({
              ...compra,
              mostrarDocumentos: false,
            })),
          );
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
        this.error.set('Error al cargar tus documentos. Por favor, intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  toggleDocumentos(compra: CompraAgrupada): void {
    this.compras.update((list) =>
      list.map((c) =>
        c.paymentId === compra.paymentId
          ? { ...c, mostrarDocumentos: !c.mostrarDocumentos }
          : c,
      ),
    );
  }

  descargarDocumento(documento: DocumentoComprado): void {
    // Evita doble-click mientras este documento esta en preparing/downloading.
    if (this.downloadStates().has(documento.id)) return;

    if (!documento.descargable) {
      this.toastr.warning(
        documento.mensajeDescarga || 'Este documento no está disponible para descarga',
        'Descarga no disponible',
      );
      return;
    }

    // Flujo unificado Fase 3b: crear sesión vía POST /api/v1/downloads/sessions,
    // disparar la descarga apuntando al endpoint single-use /file. El audit se
    // registra en el backend al consumir la sesión — no se llama confirmDownload.
    // Patrón replicado de cuenta-usuario/suscripciones/documents-list.component.ts.
    this.setDownloadState(documento.id, 'preparing');
    this.sessionsService
      .createSession({ documentId: documento.id, intent: 'DOWNLOAD' })
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
            this.clearDownloadState(documento.id);
            this.toastr.danger('No se pudo preparar la descarga.', 'Error');
            return;
          }
          // Transicion 'preparing' -> 'downloading' ANTES de disparar el anchor
          // para que el spinner no parpadee entre las dos fases.
          this.setDownloadState(documento.id, 'downloading');
          this.triggerAnchorDownload(session.downloadUrl);
          const nombre = session.fileName || documento.title;
          this.toastr.success(
            `Tu archivo "${nombre}" se está descargando. Revisa tu carpeta de descargas.`,
            'Descarga iniciada',
            { duration: 4000 },
          );
          // Ventana heuristica: el browser no avisa cuando la descarga nativa
          // termina, asi que mantenemos el lock por un tiempo proporcional al
          // tamano (capado entre 4s y 120s). La barra del navegador sigue
          // siendo la fuente real de progreso.
          const windowMs = computeDownloadWindowMs(session.fileSize);
          const timer = setTimeout(() => this.clearDownloadState(documento.id), windowMs);
          this.pendingTimers.set(documento.id, timer);
        },
        error: (err: any) => {
          this.clearDownloadState(documento.id);
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

  private triggerAnchorDownload(downloadUrl: string): void {
    // Sin target="_blank" + atributo download → el navegador trata la respuesta
    // como descarga (gracias al header Content-Disposition: attachment del backend)
    // y NO abre una pestaña adicional ni navega fuera de la SPA.
    // El filename real lo decide el header del backend; download="" solo activa el modo descarga.
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(this.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getFormatIcon(format: string): string {
    switch (format.toUpperCase()) {
      case 'PDF':
        return 'file-text-outline';
      case 'ZIP':
        return 'archive-outline';
      case 'DOCX':
      case 'DOC':
        return 'file-outline';
      default:
        return 'download-outline';
    }
  }
}
