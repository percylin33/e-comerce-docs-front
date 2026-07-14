import { Component, OnDestroy, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DatePipe, UpperCasePipe } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { HttpClient } from "@angular/common/http";
import { CreatorApiService, CreatorDocumentDto } from "../services/creator-api.service";
import { environment } from "../../../environments/environment";
import { TokenService } from "../../@auth/components/token.service";

type ViewMode = 'cover' | 'pages' | 'file';

@Component({
    selector: "ngx-creador-detalle",
    templateUrl: "./detalle-creador.component.html",
    styleUrls: ["./detalle-creador.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CurrencyPipe, DatePipe, UpperCasePipe],
})
export class CreadorDetalleComponent implements OnInit, OnDestroy {
  private api = inject(CreatorApiService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  router = inject(Router);

  document: CreatorDocumentDto | null = null;
  loading = true;
  errorMessage: string | null = null;

  viewMode: ViewMode = 'cover';
  previewUrl: SafeResourceUrl | null = null;
  /** Marca si previewUrl apunta a un Blob URL local (vs URL publica). */
  previewIsBlob = false;
  /** true mientras fetchPreviewAsBlob esta en curso. */
  previewLoading = false;
  mainFileUrl: SafeResourceUrl | null = null;
  /** Marca si mainFileUrl apunta a un Blob URL local (vs URL publica). */
  mainFileIsBlob = false;
  /** true mientras fetchMainFileAsBlob esta en curso. */
  mainLoading = false;
  /** true si el formato del doc principal puede renderizarse en iframe (PDF). */
  mainFileEmbeddable = false;
  /**
   * Blob URL temporal para el archivo principal descargado autenticado.
   * Es local (blob:) asi que el iframe/anchor pueden usarlo sin headers.
   * Se libera en ngOnDestroy para no leakear memoria.
   */
  private mainFileBlobUrl: string | null = null;
  /** Bytes del archivo principal (para descarga directa no-PDF). */
  private mainFileBytes: Blob | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage = "ID de documento invalido.";
      this.loading = false;
      return;
    }
    this.load(id);
  }

  private load(id: number): void {
    this.loading = true;
    this.api.getDocumentById(id).subscribe({
      next: (doc) => {
        if (!doc) {
          this.errorMessage = "No se encontro el documento.";
        } else {
          this.document = doc;
          this.mainFileEmbeddable = this.isPdf(doc.format);
          // El archivo principal en Firebase es PRIVADO (solo el dueno
          // puede acceder). El backend lo sirve a traves del proxy
          // autenticado /documents/{id}/inline?kind=main. Bajamos los bytes
          // con Authorization y armamos un Blob URL local que el iframe/anchor
          // puede usar sin headers (los tags HTML no soportan headers custom).
          if (doc.id) {
            this.mainLoading = this.isPdf(doc.format);
            this.fetchMainFileAsBlob(doc.id, doc.format);
          }
          const initial: ViewMode = this.canShowPages() ? 'pages' : (this.hasCover() ? 'cover' : (this.hasMainFile() ? 'file' : 'cover'));
          this.setViewMode(initial);
        }
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = e?.error?.message || "No se pudo cargar el documento.";
        this.loading = false;
      },
    });
  }

  canShowPages(): boolean {
    return !!(this.document?.pdfPreviewUrl);
  }

  hasCover(): boolean {
    return !!(this.document?.coverImageUrl || this.document?.imagenThumbUrlPublic);
  }

  hasMainFile(): boolean {
    return !!(this.document?.fileUrlPublic);
  }

  /** Solo los PDFs se pueden embeber en iframe; el resto se descarga/abre en nueva pestana. */
  isPdf(format?: string | null): boolean {
    return (format || '').toLowerCase() === 'pdf';
  }

  /**
   * Devuelve la URL que se debe usar en el iframe / link de descarga.
   * El backend guarda en `fileUrlPublic` el ID crudo de Google Drive
   * (no una URL completa), por lo que hay que envolverlo en la URL
   * estandar /preview para que el navegador pueda renderizar el PDF.
   */
  buildDriveUrl(rawUrl: string | null | undefined): string | null {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    // Si ya es una URL completa, devolver tal cual.
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    // Si ya viene con formato /file/d/xxx o contiene /, devolver tal cual.
    if (trimmed.includes('/') || trimmed.includes('.')) return trimmed;
    // Si es un ID crudo, envolver en la URL de preview de Drive.
    return `https://drive.google.com/file/d/${trimmed}/preview`;
  }

  /** Devuelve la URL del iframe de preview sanitizada. */
  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    if (mode === 'pages' && this.document?.pdfPreviewUrl) {
      // La URL publica de Firebase puede venir con Content-Disposition:
      // attachment (legacy) lo que hace que el iframe descargue el PDF
      // en lugar de mostrarlo. Para garantizar renderizado inline,
      // bajamos los bytes autenticados y creamos un Blob URL local.
      if (this.document.id) {
        this.previewLoading = true;
        this.fetchPreviewAsBlob(this.document.id);
      } else {
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.document.pdfPreviewUrl);
        this.previewIsBlob = false;
        this.previewLoading = false;
      }
    } else {
      this.previewUrl = null;
      this.previewIsBlob = false;
      this.previewLoading = false;
    }
  }

  /**
   * Helper que el template usa para saber si debe aplicar sandbox al iframe.
   * Las Blob URLs locales son seguras (no son origen externo) asi que no
   * necesitan sandbox estricto; las URLs externas a Firebase si.
   *
   * <p>Devuelve true si el iframe actual del preview/main es una Blob URL
   * local (en lugar de la URL publica de Firebase).</p>
   */
  isBlobUrl(kind: 'preview' | 'main'): boolean {
    return kind === 'preview' ? this.previewIsBlob : this.mainFileIsBlob;
  }

  /** Blob URL para el preview. Es local (blob:) asi el iframe lo renderiza. */
  private previewBlobUrl: string | null = null;

  /** URL de la miniatura (thumb si esta, sino la detail). */
  get thumbUrl(): string | null {
    if (!this.document) return null;
    return this.document.imagenThumbUrlPublic || this.document.coverImageUrl || null;
  }

  /** URL del cover grande. */
  get coverUrl(): string | null {
    return this.document?.coverImageUrl || null;
  }

  /** Nombre legible del archivo principal. */
  get mainFileName(): string {
    if (!this.document) return 'documento';
    return this.document.fileNameId || this.document.title || 'documento';
  }

  statusLabel(status?: string): string {
    switch (status) {
      case 'BORRADOR': return 'Borrador';
      case 'PENDIENTE_APROBACION': return 'Pendiente de aprobacion';
      case 'APROBADO': return 'Aprobado';
      case 'RECHAZADO': return 'Rechazado';
      default: return status || '-';
    }
  }

  statusClass(status?: string): string {
    switch (status) {
      case 'BORRADOR': return 'badge badge--draft';
      case 'PENDIENTE_APROBACION': return 'badge badge--pending';
      case 'APROBADO': return 'badge badge--approved';
      case 'RECHAZADO': return 'badge badge--rejected';
      default: return 'badge';
    }
  }

  volver(): void {
    this.router.navigate(['/dashboard-creador/mis-documentos']);
  }

  editar(): void {
    if (this.document?.id) {
      this.router.navigate(['/dashboard-creador/mis-documentos', this.document.id, 'editar']);
    }
  }

  ngOnDestroy(): void {
    this.revokeMainFileBlob();
    this.revokePreviewBlob();
  }

  /**
   * Descarga el archivo principal desde el proxy autenticado y crea un
   * Blob URL local. Asi el iframe del PDF / anchor de descarga pueden
   * usarlo sin que el browser tenga que mandar headers al server.
   */
  private fetchMainFileAsBlob(docId: number, format: string | undefined): void {
    const token = this.tokenService.getTokenString();
    if (!token) {
      console.warn('[Detalle] No hay token JWT; no se puede bajar el archivo principal.');
      return;
    }
    const url = `${environment.apiUrl}/api/v1/creators/documents/${docId}/inline?kind=main`;
    // Usamos fetch directo (no HttpClient) para tener control total sobre
    // el manejo de la respuesta Blob y los errores. HttpClient con
    // responseType:'blob' no permite leer el body de error como JSON.
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((resp) => {
        const ct = resp.headers.get('Content-Type') || '';
        if (!resp.ok) {
          console.warn(`[Detalle] Proxy devolvio ${resp.status} ${resp.statusText} (CT=${ct})`);
          return null;
        }
        if (ct.includes('application/json')) {
          console.warn(`[Detalle] Proxy devolvio JSON de error (CT=${ct})`);
          return null;
        }
        return resp.blob().then((blob) => {
          // Si el MIME que devolvio el backend es genérico
          // (application/octet-stream), lo reemplazamos por el correcto
          // segun el formato declarado del documento. Word valida el MIME
          // contra la extension al abrir: si ambos lados coinciden, no
          // muestra el cartel "el formato no coincide con la extension".
          const forcedCt = this.contentTypeForFormat(format);
          if (forcedCt && (!blob.type || blob.type === 'application/octet-stream' || blob.type === '')) {
            return new Blob([blob], { type: forcedCt });
          }
          return blob;
        });
      })
      .then((blob) => {
        if (!blob) return;
        this.revokeMainFileBlob();
        this.mainFileBytes = blob;
        this.mainFileBlobUrl = URL.createObjectURL(blob);
        this.mainFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.mainFileBlobUrl);
        this.mainFileIsBlob = true;
      })
      .catch((err) => {
        console.error('[Detalle] Error bajando archivo principal:', err);
      })
      .finally(() => {
        this.mainLoading = false;
      });
  }

  private revokeMainFileBlob(): void {
    if (this.mainFileBlobUrl) {
      URL.revokeObjectURL(this.mainFileBlobUrl);
      this.mainFileBlobUrl = null;
    }
    this.mainFileBytes = null;
  }

  private revokePreviewBlob(): void {
    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
      this.previewBlobUrl = null;
    }
  }

  /**
   * Baja el PDF preview desde el proxy autenticado y crea un Blob URL
   * local. Asi el iframe renderiza el PDF inline independientemente del
   * Content-Disposition que tenga el blob en Firebase (attachment vs inline).
   */
  private fetchPreviewAsBlob(docId: number): void {
    const token = this.tokenService.getTokenString();
    if (!token) {
      console.warn('[Detalle] No hay token JWT; no se puede bajar el preview.');
      // Fallback: usar la URL publica directa (puede fallar con attachment,
      // pero al menos no rompe la pagina).
      if (this.document?.pdfPreviewUrl) {
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.document.pdfPreviewUrl);
        this.previewIsBlob = false;
      }
      return;
    }
    const url = `${environment.apiUrl}/api/v1/creators/documents/${docId}/inline?kind=preview`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((resp) => {
        const ct = resp.headers.get('Content-Type') || '';
        console.debug(`[Detalle] Preview proxy: status=${resp.status} CT=${ct} bytes=${resp.headers.get('Content-Length')}`);
        if (!resp.ok) {
          console.warn(`[Detalle] Preview proxy devolvio ${resp.status} ${resp.statusText}`);
          return null;
        }
        if (ct.includes('application/json')) return null;
        return resp.blob();
      })
      .then((blob) => {
        if (!blob) {
          // Fallback: URL publica
          if (this.document?.pdfPreviewUrl) {
            this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.document.pdfPreviewUrl);
            this.previewIsBlob = false;
          }
          return;
        }
        this.revokePreviewBlob();
        this.previewBlobUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewBlobUrl);
        this.previewIsBlob = true;
        console.debug(`[Detalle] Preview Blob URL creado (size=${blob.size} type=${blob.type})`);
      })
      .catch((err) => {
        console.error('[Detalle] Error bajando preview:', err);
        // Fallback: URL publica
        if (this.document?.pdfPreviewUrl) {
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.document.pdfPreviewUrl);
          this.previewIsBlob = false;
        }
      })
      .finally(() => {
        this.previewLoading = false;
      });
  }

  /**
   * Dispara la descarga del archivo principal cuando el formato no es
   * embebible en iframe (DOCX, XLSX, etc). Usa los bytes ya descargados.
   */
  downloadMainFile(): void {
    if (!this.mainFileBytes || !this.document) return;
    const ext = this.extFromFormat(this.document.format);
    const name = (this.document.title || 'documento') + '.' + ext;
    const url = this.mainFileBlobUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  private extFromFormat(format: string | undefined): string {
    switch ((format || '').toLowerCase()) {
      case 'pdf': return 'pdf';
      case 'docx':
      case 'doc': return 'docx';
      case 'xlsx':
      case 'xls': return 'xlsx';
      case 'pptx':
      case 'ppt': return 'pptx';
      case 'zip': return 'zip';
      default: return 'bin';
    }
  }

  /**
   * Devuelve el MIME "oficial" del formato del documento. Se usa para forzar
   * el tipo del Blob que arma el frontend cuando el backend devuelve
   * application/octet-stream (común cuando el browser sube un .docx con MIME
   * generico). Si Word abre un .docx con MIME octet-stream, muestra el error
   * "el formato no coincide con la extension".
   */
  private contentTypeForFormat(format: string | undefined): string | null {
    switch ((format || '').toLowerCase()) {
      case 'pdf': return 'application/pdf';
      case 'doc':  return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':  return 'application/vnd.ms-excel';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt':  return 'application/vnd.ms-powerpoint';
      case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'zip':  return 'application/zip';
      default: return null;
    }
  }
}
