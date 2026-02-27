import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DashboardPromotoresService } from '../../@core/backend/services/dashboard-promotores.service';
import { WithdrawalService } from '../services/withdrawal.service';

@Component({
  selector: 'ngx-solicitud-retiro',
  templateUrl: './solicitud-retiro.component.html',
  styleUrls: ['./solicitud-retiro.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SolicitudRetiroComponent implements OnInit {
  showModal = false;
  showNewRequestModal = false;
  safeComprobanteUrl: SafeResourceUrl | null = null;
  downloadHref: string | null = null;
  private currentBlobUrl: string | null = null;
  
  // Datos del dashboard
  saldoDisponible: number = 0;
  minimoRetiro: number = 50;
  
  // Formulario de nueva solicitud
  newRequest = {
    method: 'Transferencia bancaria',
    accountDetails: ''
  };
  
  currentUserId: number | null = null;
  // estado seleccionado en el filtro (valor del select del template)
  statusFilter: string = 'pendiente';
  selected: any = {
    embajador: '',
    fecha: '',
    monto: '',
    estado: '',
    metodo: '',
    comprobanteNum: '',
    comprobanteUrl: ''
  };
  showActions = false;

  constructor(
    private dashboardService: DashboardPromotoresService,
    private withdrawalService: WithdrawalService
    ,private sanitizer: DomSanitizer
  ) {}

  // lista local de retiros (se puede mapear a la tabla)
  withdrawals: any[] = [];
  // término de búsqueda (input)
  searchTerm: string = '';
  // paginación
  currentPage: number = 0; // 0-based
  pageSize: number = 20;
  totalElements: number = 0;
  totalPages: number = 0;
  // pagination UI helpers
  pagesToShow: number[] = [];
  showLeftEllipsis: boolean = false;
  showRightEllipsis: boolean = false;
  pageJump: number | null = null; // 1-based input for jump

  ngOnInit(): void {
    // Obtener userId desde localStorage (ajustar según tu implementación de autenticación)
    const userDataStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        this.currentUserId = userData?.id || userData?.userId;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Si no hay userId en localStorage, intentar obtenerlo de otra manera
    if (!this.currentUserId) {
      // Por defecto usar el ID 1 para pruebas (ajustar en producción)
      this.currentUserId = 1;
      console.warn('UserId not found, using default userId = 1');
    }
    
    // Cargar datos del dashboard
    if (this.currentUserId) {
      this.loadDashboardData(this.currentUserId);
    }
    
    // cargar la lista inicial (pendientes)
    this.loadList(this.mapStatusToApi(this.statusFilter), this.searchTerm, this.currentPage, this.pageSize);
  }

  /**
   * Maneja el cambio del select de estado desde la plantilla.
   * Recibe el valor tal cual sale del <select> (en la UI usamos valores en español)
   */
  onStatusFilterChange(value: string) {
    this.statusFilter = value;
    // mapear y recargar la lista inmediatamente al cambiar
    const apiStatus = this.mapStatusToApi(value);
    this.currentPage = 0;
    this.loadList(apiStatus, this.searchTerm, this.currentPage, this.pageSize);
  }

  /**
   * Llamado por el botón "Aplicar Filtros" (por si el usuario quiere aplicar manualmente)
   */
  applyFilters() {
    const apiStatus = this.mapStatusToApi(this.statusFilter);
    this.currentPage = 0;
    this.loadList(apiStatus, this.searchTerm, this.currentPage, this.pageSize);
  }

  /**
   * Convierte los valores mostrados en el UI a los códigos que espera la API.
   * Si no corresponde, devuelve undefined para no enviar el parámetro.
   */
  mapStatusToApi(filterValue?: string): string | undefined {
    if (!filterValue) return undefined;
    switch (filterValue) {
      case 'todos':
        return undefined;
      case 'pendiente':
        return 'pending';
      case 'procesando':
        return 'processing';
      case 'pagado':
        return 'paid';
      case 'rechazado':
        return 'rejected';
      default:
        return filterValue; // fallback: pasar tal cual
    }
  }

  onSearchInput(value: string) {
    this.searchTerm = value;
    // opcional: puede recargar en cada tecla, ahora no — dejamos que el usuario pulse Aplicar o presione Enter
  }

  /**
   * Carga lista usando filtros combinados status y búsqueda
   */
  loadList(status?: string, search?: string, page: number = 0, size: number = 20) {
    this.dashboardService.getList(status, search, page, size).subscribe({
      next: (data: any) => {
        // data expected to be a paged response
        this.withdrawals = Array.isArray(data.content) ? data.content : [];
        this.totalElements = data.totalElements || 0;
        this.totalPages = data.totalPages || 0;
        this.currentPage = data.number || page;
        this.pageSize = data.size || size;
        this.updatePagination();
      },
      error: err => console.error('Error cargando retiros', err)
    });
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadList(this.mapStatusToApi(this.statusFilter), this.searchTerm, this.currentPage, this.pageSize);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadList(this.mapStatusToApi(this.statusFilter), this.searchTerm, this.currentPage, this.pageSize);
    }
  }

  /**
   * Go to given 0-based page and reload
   */
  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadList(this.mapStatusToApi(this.statusFilter), this.searchTerm, this.currentPage, this.pageSize);
  }

  /**
   * Jump to page from input (1-based UI). Validates range.
   */
  jumpToPage() {
    if (!this.pageJump) return;
    const p = Math.floor(this.pageJump) - 1;
    if (p < 0 || p >= this.totalPages) return;
    this.goToPage(p);
    this.pageJump = null;
  }

  /**
   * Build pagesToShow array and ellipsis flags based on currentPage/totalPages
   */
  updatePagination() {
    const maxButtons = 7; // max numeric buttons to show in middle
    this.pagesToShow = [];
    this.showLeftEllipsis = false;
    this.showRightEllipsis = false;

    if (this.totalPages <= maxButtons + 2) {
      // show all pages
      for (let i = 0; i < this.totalPages; i++) this.pagesToShow.push(i);
      return;
    }

    // always show current +-3 window (or adjusted near edges)
    let start = Math.max(0, this.currentPage - 3);
    let end = Math.min(this.totalPages - 1, this.currentPage + 3);

    // ensure we have maxButtons in window if possible
    const windowSize = end - start + 1;
    if (windowSize < maxButtons) {
      const need = maxButtons - windowSize;
      if (start === 0) {
        end = Math.min(this.totalPages - 1, end + need);
      } else if (end === this.totalPages - 1) {
        start = Math.max(0, start - need);
      } else {
        // distribute
        const addLeft = Math.floor(need / 2);
        start = Math.max(0, start - addLeft);
        end = Math.min(this.totalPages - 1, end + (need - addLeft));
      }
    }

    // decide ellipses
    if (start > 1) this.showLeftEllipsis = true;
    if (end < this.totalPages - 2) this.showRightEllipsis = true;

    // include first page if not in window
    if (start > 0) this.pagesToShow.push(0);

    for (let i = Math.max(1, start); i <= Math.min(this.totalPages - 2, end); i++) {
      this.pagesToShow.push(i);
    }

    // include last page if not in window
    if (end < this.totalPages - 1) this.pagesToShow.push(this.totalPages - 1);
  }

  openModal(rowElement: HTMLElement | any, mode: 'view' | 'review' = 'review') {
    // rowElement can be the <tr> DOM element passed from template
    try {
      const tr: HTMLElement = rowElement instanceof HTMLElement ? rowElement : (rowElement && rowElement.nativeElement) || null;
      const dataset = tr ? (tr.dataset as DOMStringMap) : {} as DOMStringMap;
      const idFromDataset = dataset.id || dataset['data-id'] || '';
      this.selected = {
        embajador: dataset.embajador || dataset['data-embajador'] || tr?.querySelector('td')?.textContent?.trim() || '',
        id: idFromDataset,
        fecha: dataset.fecha || dataset['data-fecha'] || '',
        monto: dataset.monto || dataset['data-monto'] || '',
        estado: dataset.estado || dataset['data-estado'] || '',
        metodo: dataset.metodo || dataset['data-metodo'] || '',
        comprobanteNum: dataset.comprobanteNum || dataset['data-comprobante-num'] || '',
        comprobanteUrl: dataset.comprobanteUrl || dataset['data-comprobante-url'] || ''
      };
    } catch (e) {
      // fallback: empty selected
      this.selected = { embajador: '', fecha: '', monto: '', estado: '', metodo: '', comprobanteNum: '', comprobanteUrl: '' };
    }
    this.showActions = mode === 'review';
    this.showModal = true;

    // Ensure we have a URL to preview/download. Prefer selected.comprobanteUrl, otherwise use a hardcoded test PDF for debugging.
    const hardcodedPdf = 'https://storage.googleapis.com/download/storage/v1/b/cd-store-529c3.firebasestorage.app/o/withdrawals%2Fwithdrawal_63_1771343433112.pdf?generation=1771343433478915&alt=media';
    this.downloadHref = this.selected.comprobanteUrl || hardcodedPdf;

    // Try to fetch the file as blob and use a blob: URL for the iframe to avoid
    // browser download caused by remote Content-Disposition: attachment headers.
    if (this.downloadHref) {
      this.loadComprobanteAsBlob(this.downloadHref);
    } else {
      this.safeComprobanteUrl = null;
    }
    // debug log
    // eslint-disable-next-line no-console
    console.log('openModal selected=', this.selected, 'downloadHref=', this.downloadHref);
  }

  closeModal() {
    this.showModal = false;
    this.safeComprobanteUrl = null;
    // revoke any created blob URL
    if (this.currentBlobUrl) {
      try { window.URL.revokeObjectURL(this.currentBlobUrl); } catch(e) { /* ignore */ }
      this.currentBlobUrl = null;
    }
    this.downloadHref = null;
  }

  onIframeLoad(): void {
    // eslint-disable-next-line no-console
    console.log('receipt iframe loaded for', this.downloadHref);
  }

  onIframeError(): void {
    // eslint-disable-next-line no-console
    console.error('receipt iframe failed to load', this.downloadHref);
  }

  onDownloadClick(event: MouseEvent): void {
    event.preventDefault();
    if (!this.downloadHref) {
      alert('No hay archivo para descargar');
      return;
    }
    // If we already have a blob URL, use it directly for download to avoid re-fetching
    (async () => {
      try {
        const suggestedName = this.selected && this.selected.comprobanteNum ? `${this.selected.comprobanteNum.replace(/\s+/g,'_')}.pdf` : `comprobante-retiro-${this.selected?.id || 'file'}.pdf`;
        if (this.downloadHref && this.downloadHref.startsWith('blob:')) {
          const a = document.createElement('a');
          a.href = this.downloadHref;
          a.download = suggestedName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          return;
        }

        // Fallback: fetch remote and force-download (existing behavior)
        const resp = await fetch(this.downloadHref!, { method: 'GET', mode: 'cors' });
        if (!resp.ok) throw new Error('Error fetching file: ' + resp.status);
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Download failed', err);
        alert('No se pudo descargar el archivo. Revisa la consola para más detalles.');
      }
    })();
  }

  private async loadComprobanteAsBlob(url: string) {
    // revoke previous blob if any
    if (this.currentBlobUrl) {
      try { window.URL.revokeObjectURL(this.currentBlobUrl); } catch(e) { /* ignore */ }
      this.currentBlobUrl = null;
    }

    try {
      const resp = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!resp.ok) {
        // If fetch fails (CORS or 4xx/5xx), fallback to using the remote URL directly
        console.warn('Failed to fetch comprobante as blob, status=', resp.status);
        this.safeComprobanteUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.downloadHref = url;
        return;
      }

      const blob = await resp.blob();
      // If server returned HTML (error page), fallback to remote URL
      if (blob.type && blob.type.indexOf('html') !== -1) {
        console.warn('Remote returned HTML instead of PDF');
        this.safeComprobanteUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.downloadHref = url;
        return;
      }

      const blobUrl = window.URL.createObjectURL(blob);
      this.currentBlobUrl = blobUrl;
      this.safeComprobanteUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      this.downloadHref = blobUrl;
    } catch (err) {
      console.error('Error loading comprobante blob', err);
      // fallback: use remote URL so iframe still attempts to load
      this.safeComprobanteUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.downloadHref = url;
    }
  }

  onApprove() {
    const id = Number(this.selected.id);
    if (!id || isNaN(id)) {
      alert('ID de retiro inválido');
      return;
    }
  this.dashboardService.approve(id, 'Aprobado desde panel').subscribe({
      next: res => {
        alert('Retiro aprobado');
        this.selected.estado = res.status || 'pagado';
        this.loadList(this.mapStatusToApi(this.statusFilter), this.searchTerm, this.currentPage, this.pageSize);
        this.closeModal();
      },
      error: err => {
        console.error(err);
        alert('Error al aprobar');
      }
    });
  }

  onReject() {
    const id = Number(this.selected.id);
    if (!id || isNaN(id)) {
      alert('ID de retiro inválido');
      return;
    }
    const reason = prompt('Motivo del rechazo:', 'Fondos insuficientes');
    this.dashboardService.reject(id, reason || '').subscribe({
      next: res => {
        alert('Retiro rechazado');
        this.selected.estado = res.status || 'rechazado';
        this.loadList(this.mapStatusToApi(this.statusFilter), this.searchTerm, this.currentPage, this.pageSize);
        this.closeModal();
      },
      error: err => {
        console.error(err);
        alert('Error al rechazar');
      }
    });
  }

  loadDashboardData(userId: number) {
    this.withdrawalService.getDashboardData(userId).subscribe({
      next: (data) => {
        this.saldoDisponible = data.saldoDisponible || 0;
        this.minimoRetiro = data.minimoRetiro || 50;
      },
      error: (err) => {
        console.error('Error cargando datos del dashboard:', err);
      }
    });
  }

  openNewRequestModal() {
    if (!this.currentUserId) {
      alert('Usuario no identificado');
      return;
    }
    
    if (this.saldoDisponible < this.minimoRetiro) {
      alert(`Saldo insuficiente. Mínimo requerido: S/. ${this.minimoRetiro.toFixed(2)}`);
      return;
    }
    
    this.showNewRequestModal = true;
  }

  closeNewRequestModal() {
    this.showNewRequestModal = false;
    this.newRequest = {
      method: 'Transferencia bancaria',
      accountDetails: ''
    };
  }

  submitNewRequest() {
    if (!this.currentUserId) {
      alert('Usuario no identificado');
      return;
    }

    if (this.saldoDisponible < this.minimoRetiro) {
      alert(`Saldo insuficiente. Mínimo requerido: S/. ${this.minimoRetiro.toFixed(2)}`);
      return;
    }

    if (!this.newRequest.accountDetails.trim()) {
      alert('Ingrese los detalles de la cuenta');
      return;
    }
    const requestData = {
      userId: this.currentUserId,
      method: this.newRequest.method,
      accountDetails: this.newRequest.accountDetails
    };

    // Prevent creating a new request if user already has a pending one (quick client-side check)
    this.withdrawalService.getDashboardData(this.currentUserId).subscribe({
      next: (dash) => {
        const pending = dash?.retirosPendientes || dash?.retiros_pendientes || 0;
        if (pending > 0) {
          alert('No puedes crear una nueva solicitud: ya tienes una solicitud pendiente.');
          return;
        }

        // proceed to create
        this.withdrawalService.create(requestData).subscribe({
          next: (res) => {
            alert('Solicitud de retiro creada exitosamente');
            this.closeNewRequestModal();
            this.loadList(this.mapStatusToApi(this.statusFilter), this.searchTerm, this.currentPage, this.pageSize);
            if (this.currentUserId) {
              this.loadDashboardData(this.currentUserId);
            }
          },
          error: (err) => {
            console.error('Error creando solicitud:', err);
            this.showServerError(err);
          }
        });
      },
      error: (err) => {
        console.error('Error verificando solicitudes pendientes:', err);
        // fallback: still attempt creation; server will validate
        this.withdrawalService.create(requestData).subscribe({
          next: (res) => {
            alert('Solicitud de retiro creada exitosamente');
            this.closeNewRequestModal();
            this.loadList(this.mapStatusToApi(this.statusFilter), this.searchTerm, this.currentPage, this.pageSize);
            if (this.currentUserId) {
              this.loadDashboardData(this.currentUserId);
            }
          },
          error: (err2) => {
            console.error('Error creando solicitud:', err2);
            this.showServerError(err2);
          }
        });
      }
    });
  
  }

  private showServerError(err: any) {
    // Robust extraction for various backend error shapes
    try {
      console.error('Server error payload:', err);
      if (!err) {
        alert('Error desconocido');
        return;
      }

      // Prefer structured error from HttpErrorResponse.error
      const payload = err?.error ?? err;

      let serverMsg: string | null = null;

      if (typeof payload === 'string') {
        // payload may be JSON encoded or a plain message
        try {
          const parsed = JSON.parse(payload);
          serverMsg = parsed?.message || parsed?.mensaje || parsed?.error || JSON.stringify(parsed);
        } catch (_) {
          serverMsg = payload;
        }
      } else if (typeof payload === 'object' && payload !== null) {
        serverMsg = payload?.message || payload?.mensaje || payload?.error ||
                    (Array.isArray(payload?.errors) && (payload.errors[0]?.message || JSON.stringify(payload.errors))) ||
                    err?.message || `${err?.status || ''} ${err?.statusText || ''}` || JSON.stringify(payload);
      } else {
        serverMsg = err?.message || String(payload);
      }

      if (!serverMsg) serverMsg = 'Error desconocido';
      alert(serverMsg);
    } catch (e) {
      console.error('Error mostrando mensaje del servidor', e);
      alert('Error al procesar la respuesta del servidor');
    }
  }
}
