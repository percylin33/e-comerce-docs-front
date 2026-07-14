import { Component, OnDestroy, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DatePipe, DecimalPipe, UpperCasePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import {
  ApprovalSummaryDto,
  CreatorApiService,
  CreatorDocumentDto,
  DocumentApprovalStatus,
} from "../../dashboard-creadores/services/creator-api.service";

@Component({
    selector: "ngx-admin-creadores-aprobaciones",
    templateUrl: "./aprobaciones.component.html",
    styleUrls: ["./aprobaciones.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CurrencyPipe, DatePipe, DecimalPipe, UpperCasePipe, FormsModule],
})
export class AdminCreadoresAprobacionesComponent implements OnInit, OnDestroy {
  private api = inject(CreatorApiService);
  private sanitizer = inject(DomSanitizer);

  documents: ApprovalSummaryDto[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  processingId: number | null = null;

  // Modal rechazar
  showRejectModal = false;
  rejectDocId: number | null = null;
  rejectReason = "";
  rejectError: string | null = null;

  // Modal editar precio
  showPriceModal = false;
  priceDocId: number | null = null;
  priceDocTitle = "";
  newPrice: number = 0;
  priceError: string | null = null;

  // Modal ver detalle
  showDetailModal = false;
  detail: ApprovalSummaryDto | null = null;
  /** Detalle completo (con archivos, descripcion, etc.) cargado al abrir el modal. */
  detailFull: CreatorDocumentDto | null = null;
  detailLoading = false;
  detailError: string | null = null;
  /** Modo de visualizacion dentro del modal: cover grande / preview paginas / archivo principal. */
  detailViewMode: 'cover' | 'pages' | 'file' = 'cover';
  /** URL del preview PDF sanitizada para el iframe. */
  detailPreviewUrl: SafeResourceUrl | null = null;
  /** URL del archivo principal sanitizada (solo si es embeddable, p.ej. PDF). */
  detailMainFileUrl: SafeResourceUrl | null = null;
  /** true si el formato del archivo principal puede renderizarse en iframe. */
  detailMainFileEmbeddable = false;

  // Blob URLs locales (creadas con URL.createObjectURL) que hay que revocar
  // cuando el modal se cierra o el componente se destruye, para no dejar
  // memoria filtrada.
  private detailPreviewBlobUrl: string | null = null;
  private detailMainFileBlobUrl: string | null = null;

  // Paginacion
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  /**
   * Cache de blob URLs locales para las portadas de las cartas, indexado
   * por docId. Se llena al cargar la lista (loadCardCovers) leyendo el
   * preview/cover/thumb desde el proxy autenticado del backend. Asi evitamos
   * que el iframe/img pegue directo a una URL mediaLink de Firebase que
   * puede venir mal formada (problema conocido con `%2F` -> `/` que rompe
   * la URL REST con 400 "Invalid HTTP method/URL pair").
   *
   * Estructura: { [docId]: { url, kind } } donde `url` es blob URL local y
   * `kind` es "cover" (si el doc tiene coverImageUrl) o "thumb" (fallback
   * a la miniatura autogenerada).
   */
  private cardCoverBlobs = new Map<number, { url: string; kind: 'cover' | 'thumb' }>();
  /** Conjunto de docIds actualmente en vuelo (para no lanzar doble fetch). */
  private cardCoverInFlight = new Set<number>();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.listPendingDocuments(this.page, this.size).subscribe({
      next: (p) => {
        this.documents = p.content;
        this.totalElements = p.totalElements;
        this.totalPages = p.totalPages;
        this.loading = false;
        this.loadCardCovers();
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudieron cargar los documentos pendientes.");
        this.loading = false;
      },
    });
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    // Al cambiar de pagina las portadas cacheadas ya no aplican: las revocamos
    // para no dejar memoria filtrada.
    this.revokeAllCardCovers();
    this.page = p;
    this.load();
  }

  /**
   * Precarga las portadas (cover o thumb) de cada documento de la pagina
   * actual usando el proxy autenticado del backend. Cachea los blob URLs
   * resultantes por docId. Las cartas del template usan
   * {@link cardCoverUrl} para resolver el SafeResourceUrl.
   */
  private loadCardCovers(): void {
    for (const doc of this.documents) {
      if (!doc.id) continue;
      const kind: 'cover' | 'thumb' | null = doc.coverImageUrl
        ? 'cover'
        : doc.imagenThumbUrlPublic
          ? 'thumb'
          : null;
      if (!kind) continue;
      if (this.cardCoverBlobs.has(doc.id)) continue;
      if (this.cardCoverInFlight.has(doc.id)) continue;
      this.cardCoverInFlight.add(doc.id);
      this.api.getCreatorDocumentPreview(doc.id, kind).subscribe({
        next: (blob) => {
          this.cardCoverInFlight.delete(doc.id);
          const url = URL.createObjectURL(blob);
          this.cardCoverBlobs.set(doc.id!, { url, kind: kind! });
        },
        error: () => {
          this.cardCoverInFlight.delete(doc.id);
          // Si falla el cover, intenta con el thumb como fallback (si veniamos
          // del cover y existe thumb).
          if (kind === 'cover' && doc.imagenThumbUrlPublic && doc.id) {
            this.api.getCreatorDocumentPreview(doc.id, 'thumb').subscribe({
              next: (blob) => {
                const url = URL.createObjectURL(blob);
                this.cardCoverBlobs.set(doc.id!, { url, kind: 'thumb' });
              },
              error: () => { /* sin mas fallback */ },
            });
          }
        },
      });
    }
  }

  /**
   * Devuelve el SafeResourceUrl de la portada de una carta, o null si
   * todavia no se ha cargado o el documento no tiene imagen. La idea es
   * que el template use este helper en lugar de `doc.coverImageUrl`
   * directo, para evitar pegarle a Firebase con una URL potencialmente
   * mal formada.
   */
  cardCoverUrl(doc: ApprovalSummaryDto): SafeResourceUrl | null {
    if (!doc.id) return null;
    const entry = this.cardCoverBlobs.get(doc.id);
    if (!entry) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(entry.url);
  }

  /** true si ya tenemos un blob cargado para la portada de esta carta. */
  hasCardCover(doc: ApprovalSummaryDto): boolean {
    return !!doc.id && this.cardCoverBlobs.has(doc.id);
  }

  private revokeAllCardCovers(): void {
    for (const entry of this.cardCoverBlobs.values()) {
      URL.revokeObjectURL(entry.url);
    }
    this.cardCoverBlobs.clear();
    this.cardCoverInFlight.clear();
  }

  approve(doc: ApprovalSummaryDto): void {
    if (!doc.id) return;
    if (!confirm(`Aprobar el documento "${doc.title}"? El precio quedara bloqueado para el creador.`)) return;
    this.processingId = doc.id;
    this.api.approveDocument(doc.id).subscribe({
      next: () => {
        this.processingId = null;
        this.successMessage = `Documento "${doc.title}" aprobado.`;
        this.load();
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => {
        this.processingId = null;
        this.errorMessage = this.parseError(e, "No se pudo aprobar.");
      },
    });
  }

  openReject(doc: ApprovalSummaryDto): void {
    if (!doc.id) return;
    this.rejectDocId = doc.id;
    this.rejectReason = "";
    this.rejectError = null;
    this.showRejectModal = true;
  }

  closeReject(): void {
    this.showRejectModal = false;
    this.rejectError = null;
  }

  submitReject(): void {
    if (!this.rejectDocId) return;
    if (!this.rejectReason || this.rejectReason.trim().length < 5) {
      this.rejectError = "Ingresa un motivo de al menos 5 caracteres.";
      return;
    }
    this.processingId = this.rejectDocId;
    this.api.rejectDocument(this.rejectDocId, this.rejectReason.trim()).subscribe({
      next: () => {
        this.processingId = null;
        this.showRejectModal = false;
        this.successMessage = "Documento rechazado.";
        this.load();
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => {
        this.processingId = null;
        this.rejectError = this.parseError(e, "No se pudo rechazar.");
      },
    });
  }

  openPrice(doc: ApprovalSummaryDto): void {
    if (!doc.id) return;
    this.priceDocId = doc.id;
    this.priceDocTitle = doc.title;
    this.newPrice = doc.price;
    this.priceError = null;
    this.showPriceModal = true;
  }

  closePrice(): void {
    this.showPriceModal = false;
    this.priceError = null;
  }

  submitPrice(): void {
    if (!this.priceDocId) return;
    if (this.newPrice < 0) {
      this.priceError = "El precio no puede ser negativo.";
      return;
    }
    this.processingId = this.priceDocId;
    this.api.updateDocumentPrice(this.priceDocId, this.newPrice).subscribe({
      next: () => {
        this.processingId = null;
        this.showPriceModal = false;
        this.successMessage = "Precio actualizado.";
        this.load();
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => {
        this.processingId = null;
        this.priceError = this.parseError(e, "No se pudo actualizar el precio.");
      },
    });
  }

  /**
   * Abre el modal de detalle cargando la version completa del documento
   * (incluye archivos: cover, thumb, PDF preview, archivo principal + descripcion).
   */
  openDetail(doc: ApprovalSummaryDto): void {
    this.detail = doc;
    this.detailFull = null;
    this.detailError = null;
    this.detailLoading = true;
    this.revokeDetailBlobs();
    this.showDetailModal = true;
    if (!doc.id) {
      this.detailError = "Documento sin ID.";
      this.detailLoading = false;
      return;
    }
    this.api.getCreatorDocumentById(doc.id).subscribe({
      next: (full) => {
        this.detailFull = full;
        this.detailMainFileEmbeddable = this.isPdf(full.format);
        const initial: 'cover' | 'pages' | 'file' = this.detailCanShowPages()
          ? 'pages'
          : this.detailHasCover()
            ? 'cover'
            : this.detailHasMainFile()
              ? 'file'
              : 'cover';
        this.detailViewMode = initial;
        // Cargamos los blobs (preview / main) via el proxy autenticado del
        // backend. NO usamos las URLs mediaLink de Firebase directamente
        // porque la reescritura client-side producia una URL REST invalida
        // ("Invalid HTTP method/URL pair" 400) para objetos con path %2F.
        if (initial === 'pages' && full.id != null && full.pdfPreviewUrl) {
          this.loadPreviewAsBlob(full.id);
        }
        if (initial === 'file' && full.id != null && full.fileUrlPublic
            && this.detailMainFileEmbeddable) {
          this.loadMainFileAsBlob(full.id);
        }
        this.detailLoading = false;
      },
      error: (e) => {
        this.detailError = this.parseError(e, "No se pudo cargar el detalle del documento.");
        this.detailLoading = false;
      },
    });
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.detail = null;
    this.detailFull = null;
    this.detailError = null;
    this.detailLoading = false;
    this.detailViewMode = 'cover';
    this.detailPreviewUrl = null;
    this.detailMainFileUrl = null;
    this.detailMainFileEmbeddable = false;
    this.revokeDetailBlobs();
  }

  /**
   * Descarga el preview PDF del documento desde el proxy autenticado del
   * backend y crea un Blob URL local para meter en el iframe. Reemplaza
   * el intento previo de reescribir la URL mediaLink de Firebase, que
   * producia 400 ("Invalid HTTP method/URL pair").
   */
  private loadPreviewAsBlob(docId: number): void {
    this.detailPreviewUrl = null;
    this.api.getCreatorDocumentPreview(docId, 'preview').subscribe({
      next: (blob) => {
        this.revokeDetailPreviewBlob();
        this.detailPreviewBlobUrl = URL.createObjectURL(blob);
        this.detailPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.detailPreviewBlobUrl);
      },
      error: (e) => {
        this.detailPreviewUrl = null;
        this.detailError = this.parseError(e, 'No se pudo cargar el preview.');
      },
    });
  }

  /**
   * Descarga el archivo principal (solo cuando es embeddable, p.ej. PDF)
   * desde el proxy autenticado del backend y crea un Blob URL local.
   */
  private loadMainFileAsBlob(docId: number): void {
    this.detailMainFileUrl = null;
    this.api.getCreatorDocumentPreview(docId, 'main').subscribe({
      next: (blob) => {
        this.revokeDetailMainFileBlob();
        this.detailMainFileBlobUrl = URL.createObjectURL(blob);
        this.detailMainFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.detailMainFileBlobUrl);
      },
      error: (e) => {
        this.detailMainFileUrl = null;
        this.detailError = this.parseError(e, 'No se pudo cargar el archivo principal.');
      },
    });
  }

  private revokeDetailPreviewBlob(): void {
    if (this.detailPreviewBlobUrl) {
      URL.revokeObjectURL(this.detailPreviewBlobUrl);
      this.detailPreviewBlobUrl = null;
    }
  }

  private revokeDetailMainFileBlob(): void {
    if (this.detailMainFileBlobUrl) {
      URL.revokeObjectURL(this.detailMainFileBlobUrl);
      this.detailMainFileBlobUrl = null;
    }
  }

  private revokeDetailBlobs(): void {
    this.revokeDetailPreviewBlob();
    this.revokeDetailMainFileBlob();
  }

  ngOnDestroy(): void {
    this.revokeDetailBlobs();
    this.revokeAllCardCovers();
  }

  /**
   * Dispara la descarga autenticada del archivo principal a traves del
   * endpoint admin del backend. El archivo en Drive no es publico, asi que
   * NO se debe usar f.url (que es el ID crudo) directamente.
   */
  downloadMainFile(): void {
    const docId = this.detailFull?.id ?? this.detail?.id;
    if (!docId) return;
    this.processingId = docId;
    // Forzar repintado del estado "Descargando..." antes del request HTTP;
    // en archivos pequenos el roundtrip termina antes de que Angular pinte.
    setTimeout(() => {
      this.api.downloadCreatorDocumentFile(docId).subscribe({
        next: (blob) => {
          this.processingId = null;
          triggerBrowserDownload(blob, deriveDownloadFilename(this.detailFull));
        },
        error: (e) => {
          this.processingId = null;
          this.detailError = this.parseError(e, 'No se pudo descargar el archivo.');
        },
      });
    }, 0);
  }

  /**
   * Click handler para los items de la lista de Archivos. Si es el archivo
   * principal, dispara la descarga autenticada. Si no, deja que el
   * <a target="_blank"> del template se abra en nueva pestana.
   */
  onFileClick(item: { kind: 'image' | 'pdf' | 'file'; url: string } | undefined, ev: MouseEvent): void {
    if (item?.kind === 'file') {
      ev.preventDefault();
      this.downloadMainFile();
    }
  }

  /** Resuelve la URL a mostrar como cover: detailFull.coverImageUrl > detail.coverImageUrl. */
  coverUrl(): string | null {
    return this.detailFull?.coverImageUrl || this.detail?.coverImageUrl || null;
  }

  /** Sanitiza una URL para usar como src en <iframe> (PDF preview). */
  safeUrl(url: string | null | undefined): SafeResourceUrl | null {
    if (!url) return null;
    const renderable = toRenderablePreviewUrl(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(renderable);
  }

  /** Devuelve una URL "renderizable" (no mediaLink de Firebase) para abrir en nueva pestana. */
  renderableUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return toRenderablePreviewUrl(url);
  }

  /** Lista los archivos del documento (cover, thumb, PDF preview, archivo principal). */
  filesList(): Array<{ label: string; url: string; kind: "image" | "pdf" | "file"; name: string }> {
    const out: Array<{ label: string; url: string; kind: "image" | "pdf" | "file"; name: string }> = [];
    const f = this.detailFull;
    if (!f) return out;
    const mainName = f.fileNameId || `documento-${f.id}.${(f.format || "pdf").toLowerCase()}`;
    if (f.fileUrlPublic) {
      out.push({ label: "Archivo principal", url: f.fileUrlPublic, kind: "file", name: mainName });
    }
    if (f.pdfPreviewUrl) {
      out.push({ label: "Vista previa (PDF)", url: f.pdfPreviewUrl, kind: "pdf", name: `preview-${f.id}.pdf` });
    }
    if (f.coverImageUrl) {
      out.push({ label: "Portada", url: f.coverImageUrl, kind: "image", name: `cover-${f.id}` });
    }
    if (f.imagenThumbUrlPublic && f.imagenThumbUrlPublic !== f.coverImageUrl) {
      out.push({ label: "Miniatura", url: f.imagenThumbUrlPublic, kind: "image", name: `thumb-${f.id}` });
    }
    return out;
  }

  /** Etiqueta legible del creador: Nombre Apellido (email). */
  creatorDisplay(): { name: string; email: string | null } {
    const name = this.detailFull?.creatorName || this.detail?.creatorName;
    const email = this.detailFull?.creatorEmail || this.detail?.creatorEmail;
    return {
      name: name?.trim() || "Creador sin nombre",
      email: email || null,
    };
  }

  get detailCoverUrl(): string | null {
    if (!this.detailFull) return null;
    return this.detailFull.coverImageUrl || this.detailFull.imagenThumbUrlPublic || null;
  }

  get detailThumbUrl(): string | null {
    if (!this.detailFull) return null;
    return this.detailFull.imagenThumbUrlPublic || this.detailFull.coverImageUrl || null;
  }

  get detailMainFileName(): string {
    if (!this.detailFull) return 'documento';
    return this.detailFull.fileNameId || this.detailFull.title || 'documento';
  }

  // ----- visualizacion del modal de detalle -----
  setDetailViewMode(mode: 'cover' | 'pages' | 'file'): void {
    this.detailViewMode = mode;
    if (mode === 'pages') {
      if (this.detailFull?.id != null && this.detailFull?.pdfPreviewUrl) {
        this.loadPreviewAsBlob(this.detailFull.id);
      } else {
        this.detailPreviewUrl = null;
      }
    } else if (mode === 'file' && this.detailMainFileEmbeddable
               && this.detailFull?.id != null && this.detailFull?.fileUrlPublic) {
      this.loadMainFileAsBlob(this.detailFull.id);
    }
  }

  detailCanShowPages(): boolean {
    return !!(this.detailFull?.pdfPreviewUrl);
  }

  detailHasCover(): boolean {
    return !!(this.detailFull?.coverImageUrl || this.detailFull?.imagenThumbUrlPublic);
  }

  detailHasMainFile(): boolean {
    return !!(this.detailFull?.fileUrlPublic);
  }

  /** Solo los PDFs se pueden embeber en iframe; el resto se descarga/abre en nueva pestana. */
  isPdf(format?: string | null): boolean {
    return (format || '').toLowerCase() === 'pdf';
  }

  statusClass(s: DocumentApprovalStatus): string {
    return `pill pill--${(s || "").toLowerCase()}`;
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para esta accion.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}

/**
 * Dispara la descarga de un Blob en el navegador usando un link efimero.
 * Revoca la URL inmediatamente despues del click para no dejar memoria.
 */
function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Deriva un nombre de archivo con extension para usar en `a.download` al
 * descargar el archivo principal de un documento desde el panel admin.
 *
 * <p>El backend persiste en `fileNameId` el `BlobId.toString()` completo
 * (formato {@code "BlobId{bucket=..., name=creator-2292/<nombre-original>.<ext>, ...}"}).
 * Si ese campo trae un nombre reconocible con extension, lo usamos.
 * Si no, caemos a {@code <title>.<format>} y por ultimo a
 * {@code documento-<id>.<format>}.</p>
 */
function deriveDownloadFilename(doc: CreatorDocumentDto | null | undefined): string {
  const fileNameId = doc?.fileNameId;
  if (fileNameId) {
    const m = fileNameId.match(/name=([^,}]+)/);
    if (m && m[1]) {
      let basename = m[1].trim();
      const slash = basename.lastIndexOf('/');
      if (slash >= 0 && slash < basename.length - 1) {
        basename = basename.substring(slash + 1);
      }
      if (basename && basename.includes('.')) {
        return basename.replace(/[\r\n\t"]/g, '_');
      }
    }
  }
  const format = (doc?.format || '').toLowerCase();
  const base = (doc?.title && doc.title.trim())
    ? doc.title.trim()
    : `documento-${doc?.id ?? 'sin-id'}`;
  return format ? `${base}.${format}` : base;
}

/**
 * Convierte una URL "mediaLink" de Firebase/GCS a una URL publica directa
 * que pueda renderizarse dentro de un <iframe> (PDF preview) o un <img>,
 * o abrirse en una nueva pestana con target="_blank".
 *
 * <p>El backend guarda {@code blob.getMediaLink()} de Firebase Storage, que
 * es una URL con tokens/parametros que el navegador no acepta como src
 * de un iframe (queda en blanco y dispara descarga al hacer clic).</p>
 *
 * <p>Como los blobs de preview/cover/thumb se suben con ACL publica
 * ({@code ContentDisposition: inline} + {@code anyone:reader}), podemos
 * construir la URL publica canonica de Firebase Storage que SI renderiza
 * inline en un iframe o abre directo en el navegador.</p>
 *
 * <p><b>Importante:</b> en el endpoint REST
 * {@code /v0/b/{bucket}/o/{object-path}?alt=media} los separadores de
 * directorio dentro de {@code object-path} deben ir como {@code %2F}
 * (NO como {@code /} literal). Si se usan {@code /} literales, Firebase
 * interpreta cada segmento como un parametro de ruta distinto y devuelve
 * {@code 400 — Invalid HTTP method/URL pair}.</p>
 *
 * <p>Formatos soportados como entrada (todos observados en respuestas del backend):</p>
 * <ul>
 *   <li>{@code https://firebasestorage.googleapis.com/v0/b/download/o/{URL-encoded storage/v1/b/{bucket}/o/{path}}?generation=...}
 *       <br>(mediaLink oficial de Firebase Storage REST API)</li>
 *   <li>{@code https://storage.googleapis.com/download/storage/v1/b/{bucket}/o/{path}?generation=...&alt=media}
 *       <br>(mediaLink alternativo del SDK de Firebase - el segmento "download" es parte del path API, NO un bucket)</li>
 *   <li>{@code https://storage.googleapis.com/{bucket}/{path}?generation=...}</li>
 *   <li>{@code https://{bucket}.firebasestorage.app/{path}?generation=...}</li>
 * </ul>
 *
 * <p>Salida: {@code https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{object-path-con-%2F}?alt=media}</p>
 */
function toRenderablePreviewUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isFirebaseHost =
      host === 'firebasestorage.googleapis.com' ||
      host.endsWith('.firebasestorage.app') ||
      host === 'storage.googleapis.com';

    if (!isFirebaseHost) return url;

    // Si la URL ya viene firmada (Signed URL de GCS / Firebase Storage),
    // es una URL publica con acceso temporal. NO la reescribimos al endpoint
    // /v0/b/{bucket}/o/ porque perderiamos los parametros de firma
    // (GoogleAccessId, Expires, Signature) y el navegador rechazaria la peticion.
    if (u.searchParams.has('Signature') || u.searchParams.has('X-Goog-Signature')) {
      return url;
    }

    let bucket = '';
    /** Object path tal como llega, con `%2F` codificando separadores. */
    let objectPath = '';

    if (host === 'firebasestorage.googleapis.com') {
      // Formato Firebase Storage mediaLink: /v0/b/download/o/{URL-encoded}
      // donde {URL-encoded} = storage%2Fv1%2Fb%2F{bucket}%2Fo%2F{path}
      const m = u.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (!m) return url;
      const encoded = m[2];
      let decoded: string;
      try {
        decoded = decodeURIComponent(encoded);
      } catch {
        decoded = encoded;
      }
      // NO reemplazamos %2F por "/" aqui: queremos conservar la estructura
      // de segmentos para detectar el caso "storage/v1/b/{bucket}/o/{path}".
      const inner = decoded.match(/^storage\/v1\/b\/([^/]+)\/o\/(.+)$/);
      if (inner) {
        bucket = inner[1];
        objectPath = inner[2];
      } else {
        bucket = m[1];
        objectPath = decoded;
      }
    } else if (host === 'storage.googleapis.com') {
      // El backend puede retornar DOS formatos con este host:
      //   a) /download/storage/v1/b/{bucket}/o/{path-with-%2F}?generation=...&alt=media
      //   b) /{bucket}/{path}?generation=...  (descarga directa GCS, sin firma)
      const downloadMediaLink = u.pathname.match(/^\/download\/storage\/v1\/b\/([^/]+)\/o\/(.+)$/);
      if (downloadMediaLink) {
        // El objectPath ya viene correctamente URL-encoded desde Firebase
        // (%2F para separadores de directorio). NO debemos re-encodearlo,
        // porque `encodeURIComponent` convertiria el "%" de "%2F" en "%25",
        // produciendo "%252F" y disparando 404 Not Found en Firebase.
        // Devolvemos la URL REST final directamente, sin pasar por el
        // bloque de split/join de mas abajo.
        return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(downloadMediaLink[1])}/o/${downloadMediaLink[2]}?alt=media`;
      }
      // Formato GCS directo: /{bucket}/{path}. Aqui "path" NO viene
      // pre-encodado, asi que hay que encodear los separadores manualmente.
      const parts = u.pathname.replace(/^\/+/, '').split('/');
      bucket = parts.shift() || '';
      objectPath = parts.map((seg) => encodeURIComponent(seg)).join('%2F');
      // Como split('/') ya separo los segmentos, encodeURIComponent por
      // segmento NO mete %2F (los slashes ya no estan). Luego join con %2F.
      // Resultado: path%2Fsegmento1%2Fsegmento2 — exactamente lo que Firebase espera.
      return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${objectPath}?alt=media`;
    } else if (host.endsWith('.firebasestorage.app')) {
      bucket = host;
      // Mismo tratamiento: split + encode por segmento + join con %2F.
      objectPath = u.pathname.replace(/^\/+/, '').split('/').map((seg) => encodeURIComponent(seg)).join('%2F');
      return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${objectPath}?alt=media`;
    }

    if (!bucket || !objectPath) return url;

    // Para el endpoint /v0/b/{bucket}/o/{path} de Firebase, los separadores
    // "/" deben ir CODIFICADOS como %2F (NO literales). Ademas, NO debemos
    // re-encodear segmentos que ya esten URL-encoded (p.ej. si el path tiene
    // "%20" para espacios, encodeURIComponent lo convertiria a "%2520",
    // rompiendo la URL). El cambio clave vs. la version anterior es que
    // joinamos con "%2F" en vez de "/".
    const encodedPath = objectPath
      .split('/')
      .map((seg) => {
        if (/^%[0-9A-Fa-f]{2}/.test(seg)) {
          return seg;
        }
        return encodeURIComponent(seg);
      })
      .join('%2F');

    return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodedPath}?alt=media`;
  } catch {
    return url;
  }
}
