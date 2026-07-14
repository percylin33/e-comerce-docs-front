import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DatePipe, UpperCasePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import {
  ApprovalSummaryDto,
  CreatorApiService,
  CreatorDocumentDto,
  CreatorSummaryDto,
  DocumentApprovalStatus,
} from "../../dashboard-creadores/services/creator-api.service";

type DetailViewMode = 'cover' | 'pages' | 'file';

@Component({
    selector: "ngx-admin-creadores-documentos",
    templateUrl: "./documentos-creador.component.html",
    styleUrls: ["./documentos-creador.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CurrencyPipe, DatePipe, UpperCasePipe, FormsModule],
})
export class AdminCreadoresDocumentosCreadorComponent implements OnInit {
  private api = inject(CreatorApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  creator: CreatorSummaryDto | null = null;
  documents: ApprovalSummaryDto[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  processingId: number | null = null;

  // Filtros
  statusFilter: DocumentApprovalStatus | "" = "";

  // Modal rechazar
  showRejectModal = false;
  rejectDocId: number | null = null;
  rejectDocTitle = "";
  rejectReason = "";
  rejectError: string | null = null;

  // Modal editar precio
  showPriceModal = false;
  priceDocId: number | null = null;
  priceDocTitle = "";
  newPrice: number = 0;
  priceError: string | null = null;

  // Modal editar metadatos
  showMetadataModal = false;
  metadataDocId: number | null = null;
  metadataDocTitle = "";
  newTitle = "";
  newDescription = "";
  metadataError: string | null = null;

  // Modal ver detalle
  showDetailModal = false;
  /** Resumen del que se pidio el detalle (solo para el titulo del modal). */
  detailSummary: ApprovalSummaryDto | null = null;
  /** Documento completo cargado desde el endpoint de detalle. */
  detail: CreatorDocumentDto | null = null;
  detailLoading = false;
  detailError: string | null = null;
  /** Modo de visualizacion dentro del modal: cover grande / preview paginas / archivo principal. */
  detailViewMode: DetailViewMode = 'cover';
  /** URL del preview PDF sanitizada para el iframe. */
  detailPreviewUrl: SafeResourceUrl | null = null;
  /** URL del archivo principal sanitizada (solo si es embeddable, p.ej. PDF). */
  detailMainFileUrl: SafeResourceUrl | null = null;
  /** true si el formato del archivo principal puede renderizarse en iframe. */
  detailMainFileEmbeddable = false;

  // Paginacion
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((qp) => {
      const id = Number(qp.get("creatorId"));
      if (id) {
        this.loadCreator(id);
      } else {
        this.creator = null;
      }
      this.load();
    });
  }

  loadCreator(id: number): void {
    this.api.getCreator(id).subscribe({
      next: (c) => (this.creator = c),
      error: () => (this.creator = null),
    });
  }

  load(): void {
    const creatorId = Number(this.route.snapshot.queryParamMap.get("creatorId")) || undefined;
    this.loading = true;
    this.errorMessage = null;
    this.api
      .listCreatorDocuments({
        creatorId,
        status: this.statusFilter || undefined,
        page: this.page,
        size: this.size,
      })
      .subscribe({
        next: (p) => {
          this.documents = p.content;
          this.totalElements = p.totalElements;
          this.totalPages = p.totalPages;
          this.loading = false;
        },
        error: (e) => {
          this.errorMessage = this.parseError(e, "No se pudieron cargar los documentos.");
          this.loading = false;
        },
      });
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.load();
  }

  onFilterChange(): void {
    this.page = 0;
    this.load();
  }

  backToCreators(): void {
    this.router.navigate(["/admin-creadores/creadores"]);
  }

  // ============ Ver detalle ============
  openDetail(doc: ApprovalSummaryDto): void {
    if (!doc.id) return;
    this.detailSummary = doc;
    this.detail = null;
    this.detailError = null;
    this.detailLoading = true;
    this.detailPreviewUrl = null;
    this.detailMainFileUrl = null;
    this.detailViewMode = 'cover';
    this.showDetailModal = true;
    this.api.getCreatorDocumentById(doc.id).subscribe({
      next: (d) => {
        this.detail = d;
        this.detailLoading = false;
        this.detailMainFileEmbeddable = this.isPdf(d.format);
        const mainUrl = this.buildDriveUrl(d.fileUrlPublic);
        if (mainUrl) {
          this.detailMainFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mainUrl);
        }
        const initial: DetailViewMode = this.detailCanShowPages()
          ? 'pages'
          : this.detailHasCover()
            ? 'cover'
            : this.detailHasMainFile()
              ? 'file'
              : 'cover';
        this.setDetailViewMode(initial);
      },
      error: (e) => {
        this.detailLoading = false;
        this.detailError = this.parseError(e, "No se pudo cargar el detalle.");
      },
    });
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.detailSummary = null;
    this.detail = null;
    this.detailError = null;
    this.detailLoading = false;
    this.detailPreviewUrl = null;
    this.detailMainFileUrl = null;
  }

  // ----- visualizacion -----
  setDetailViewMode(mode: DetailViewMode): void {
    this.detailViewMode = mode;
    if (mode === 'pages' && this.detail?.pdfPreviewUrl) {
      this.detailPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.detail.pdfPreviewUrl);
    } else {
      this.detailPreviewUrl = null;
    }
  }

  detailCanShowPages(): boolean {
    return !!(this.detail?.pdfPreviewUrl);
  }

  detailHasCover(): boolean {
    return !!(this.detail?.coverImageUrl || this.detail?.imagenThumbUrlPublic);
  }

  detailHasMainFile(): boolean {
    return !!(this.detail?.fileUrlPublic);
  }

  /** Solo los PDFs se pueden embeber en iframe; el resto se descarga/abre en nueva pestana. */
  isPdf(format?: string | null): boolean {
    return (format || '').toLowerCase() === 'pdf';
  }

  /**
   * El backend guarda `fileUrlPublic` con el ID crudo de Google Drive (no una URL completa),
   * por lo que hay que envolverlo en `/preview` para que el navegador pueda renderizar el PDF.
   * Si ya viene una URL completa (https://...) o con formato /file/d/xxx, se respeta tal cual.
   */
  buildDriveUrl(rawUrl: string | null | undefined): string | null {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.includes('/') || trimmed.includes('.')) return trimmed;
    return `https://drive.google.com/file/d/${trimmed}/preview`;
  }

  /**
   * URL que fuerza descarga del archivo original desde Google Drive.
   * Si el valor ya es una URL completa (https://...) se respeta tal cual;
   * si es un ID crudo de Drive se envuelve en `/uc?export=download&id=<ID>`
   * para evitar que el navegador baje la pagina HTML de preview.
   *
   * <p>NOTA: en la mayoria de los casos el archivo de Drive NO es publico,
   * asi que esta URL terminaba dando 403 de Google. El fix real es llamar
   * al endpoint autenticado del backend
   * ({@link CreatorApiService#downloadCreatorDocumentFile}). Este helper
   * se conserva solo como fallback para URLs https ya publicas.</p>
   */
  buildDriveDownloadUrl(rawUrl: string | null | undefined): string | null {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.includes('/') || trimmed.includes('.')) return trimmed;
    return `https://drive.google.com/uc?export=download&id=${trimmed}`;
  }

  /**
   * Dispara la descarga autenticada del archivo principal a traves del
   * endpoint admin del backend. Funciona aunque el archivo en Drive NO
   * sea publico (la service account resuelve los permisos).
   */
  downloadMainFile(): void {
    if (!this.detail?.id) return;
    const docId = this.detail.id;
    this.processingId = docId;
    // Forzar un repintado del estado "Descargando..." antes de disparar la
    // peticion HTTP. En archivos pequenos (red local) la respuesta llega tan
    // rapido que el navegador nunca llega a pintar el cambio.
    setTimeout(() => {
      this.api.downloadCreatorDocumentFile(docId).subscribe({
        next: (blob) => {
          this.processingId = null;
          const fileName =
            this.detail?.fileNameId ||
            (this.detail?.title ? `${this.detail.title}.${this.detail.format || 'pdf'}` : 'documento');
          triggerBrowserDownload(blob, fileName);
        },
        error: (e) => {
          this.processingId = null;
          this.detailError = this.parseError(e, 'No se pudo descargar el archivo.');
        },
      });
    }, 0);
  }

  /** Cover grande (o fallback al thumb). */
  get detailCoverUrl(): string | null {
    if (!this.detail) return null;
    return this.detail.coverImageUrl || this.detail.imagenThumbUrlPublic || null;
  }

  /** Miniatura (thumb si esta, sino el cover). */
  get detailThumbUrl(): string | null {
    if (!this.detail) return null;
    return this.detail.imagenThumbUrlPublic || this.detail.coverImageUrl || null;
  }

  /** Nombre legible del archivo principal. */
  get detailMainFileName(): string {
    if (!this.detail) return 'documento';
    return this.detail.fileNameId || this.detail.title || 'documento';
  }

  /** URL absoluta lista para <a href> en el boton Descargar. */
  get detailMainFileHref(): string | null {
    return this.buildDriveDownloadUrl(this.detail?.fileUrlPublic);
  }

  // ----- side cards -----
  detailCreatorDisplay(): { name: string; email: string | null } {
    const fromDocName = this.detail?.creatorName;
    const fromDocEmail = this.detail?.creatorEmail;
    const fromHeaderName =
      this.creator && (this.creator.firstname || this.creator.lastname)
        ? `${this.creator.firstname ?? ""} ${this.creator.lastname ?? ""}`.trim()
        : null;
    const fromHeaderEmail = this.creator?.email ?? null;
    const name = fromDocName?.trim() || fromHeaderName || "Creador sin nombre";
    const email = fromDocEmail || fromHeaderEmail || null;
    return { name, email };
  }

  /** Lista compacta para la card "Archivos" del side. */
  detailFilesList(): Array<{ label: string; url: string; kind: "image" | "pdf" | "file"; name: string }> {
    const out: Array<{ label: string; url: string; kind: "image" | "pdf" | "file"; name: string }> = [];
    const f = this.detail;
    if (!f) return out;
    const mainName = f.fileNameId || `documento-${f.id}.${(f.format || "pdf").toLowerCase()}`;
    if (f.fileUrlPublic) {
      // El archivo principal SIEMPRE se descarga por el endpoint autenticado
      // del backend. La URL aqui es simbolica (el handler intercepta el
      // click cuando kind === 'file'); dejamos algo legible como fallback.
      out.push({ label: "Archivo principal", url: '#download-main', kind: "file", name: mainName });
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

  /**
   * Click handler para los items de la lista de Archivos. Si es el
   * archivo principal, dispara la descarga autenticada. Si no, deja
   * que el <a target="_blank"> del template se abra en nueva pestana.
   */
  onDetailFileClick(item: { kind: 'image' | 'pdf' | 'file'; url: string } | undefined, ev: MouseEvent): void {
    if (item?.kind === 'file') {
      ev.preventDefault();
      this.downloadMainFile();
    }
  }

  // ============ Editar precio ============
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
      next: (d) => {
        this.processingId = null;
        this.showPriceModal = false;
        this.successMessage = "Precio actualizado.";
        // actualizar el resumen en la lista
        this.documents = this.documents.map((x) =>
          x.id === d.id ? { ...x, price: d.price } : x,
        );
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => {
        this.processingId = null;
        this.priceError = this.parseError(e, "No se pudo actualizar el precio.");
      },
    });
  }

  // ============ Editar metadatos (titulo/descripcion) ============
  openMetadata(doc: ApprovalSummaryDto): void {
    if (!doc.id) return;
    this.metadataDocId = doc.id;
    this.metadataDocTitle = doc.title;
    this.newTitle = doc.title;
    this.newDescription = "";
    this.metadataError = null;
    this.showMetadataModal = true;
    // cargar descripcion real desde el endpoint de detalle
    this.api.getCreatorDocumentById(doc.id).subscribe({
      next: (d) => (this.newDescription = d.description ?? ""),
      error: () => {},
    });
  }

  closeMetadata(): void {
    this.showMetadataModal = false;
    this.metadataError = null;
  }

  submitMetadata(): void {
    if (!this.metadataDocId) return;
    if (!this.newTitle || this.newTitle.trim().length < 3) {
      this.metadataError = "El titulo debe tener al menos 3 caracteres.";
      return;
    }
    this.processingId = this.metadataDocId;
    this.api
      .updateDocumentMetadata(this.metadataDocId, this.newTitle.trim(), this.newDescription)
      .subscribe({
        next: (d) => {
          this.processingId = null;
          this.showMetadataModal = false;
          this.successMessage = "Metadatos actualizados.";
          this.documents = this.documents.map((x) =>
            x.id === d.id ? { ...x, title: d.title } : x,
          );
          setTimeout(() => (this.successMessage = null), 3500);
        },
        error: (e) => {
          this.processingId = null;
          this.metadataError = this.parseError(e, "No se pudo actualizar.");
        },
      });
  }

  // ============ Rechazar ============
  openReject(doc: ApprovalSummaryDto): void {
    if (!doc.id) return;
    this.rejectDocId = doc.id;
    this.rejectDocTitle = doc.title;
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
    const confirmed = confirm(
      `Rechazar el documento "${this.rejectDocTitle}"? El precio quedara desbloqueado y el creador podra editarlo y volver a enviarlo.`,
    );
    if (!confirmed) return;
    this.processingId = this.rejectDocId;
    this.api.rejectDocument(this.rejectDocId, this.rejectReason.trim()).subscribe({
      next: (d) => {
        this.processingId = null;
        this.showRejectModal = false;
        this.successMessage = "Documento rechazado.";
        this.documents = this.documents.map((x) =>
          x.id === d.id
            ? {
                ...x,
                creatorApprovalStatus: d.creatorApprovalStatus as DocumentApprovalStatus,
              }
            : x,
        );
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => {
        this.processingId = null;
        this.rejectError = this.parseError(e, "No se pudo rechazar.");
      },
    });
  }

  // ============ Helpers UI ============
  statusClass(s: DocumentApprovalStatus | "" | undefined): string {
    return `doc-pill doc-pill--${(s || "").toLowerCase()}`;
  }

  statusLabel(s: DocumentApprovalStatus | "" | undefined): string {
    switch (s) {
      case "APROBADO":
        return "Aprobado";
      case "RECHAZADO":
        return "Rechazado";
      case "PENDIENTE_APROBACION":
        return "Pendiente";
      case "BORRADOR":
        return "Borrador";
      default:
        return "Sin estado";
    }
  }

  isApproved(d: ApprovalSummaryDto): boolean {
    return d.creatorApprovalStatus === "APROBADO";
  }

  isPending(d: ApprovalSummaryDto): boolean {
    return d.creatorApprovalStatus === "PENDIENTE_APROBACION";
  }

  canReject(d: ApprovalSummaryDto): boolean {
    return d.creatorApprovalStatus === "APROBADO" || d.creatorApprovalStatus === "PENDIENTE_APROBACION";
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
