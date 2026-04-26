import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { UserData, Promotores } from '../../@core/interfaces/users';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdminHeaderActionsComponent } from '../../@theme/components/admin-header-actions/admin-header-actions.component';
import { FormsModule } from '@angular/forms';
import { NgClass, TitleCasePipe, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'ngx-embajadores',
    templateUrl: './embajadores.component.html',
    styleUrls: ['./embajadores.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        AdminHeaderActionsComponent,
        FormsModule,
        NgClass,
        TitleCasePipe,
        CurrencyPipe,
        DatePipe,
    ],
})
export class EmbajadoresComponent implements OnInit, OnDestroy {
  embajadores: Promotores[] = [];
  isLoading = false;
  // pagination
  currentPage = 1; // 1-based (API expects pagina)
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  pages: number[] = [];

  // filters
  searchTerm = '';
  statusFilter = 'todos';
  private searchSubject: Subject<string> = new Subject<string>();
  private searchSub: Subscription | null = null;

  constructor(public userService: UserData) {}

  ngOnInit(): void {
    this.loadEmbajadores();
    // subscribe to debounced search
    this.searchSub = this.searchSubject.pipe(
      debounceTime(600),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadEmbajadores(1);
    });
  }

    loadEmbajadores(page: number = this.currentPage): void {
      this.isLoading = true;
      const search = this.searchTerm && this.searchTerm.trim().length > 0 ? this.searchTerm.trim() : undefined;
      const status = this.statusFilter && this.statusFilter !== 'todos' ? this.statusFilter : undefined;
      this.userService.getPromotores(page, this.pageSize, search, status).subscribe(
        (res) => {
          if (res && res.result) {
            this.embajadores = res.data || [];
            this.currentPage = res.pagination?.paginaActual || page;
            this.totalPages = res.pagination?.cantidadDePaginas || 0;
            this.totalElements = res.pagination?.cantidadDeDocumentos || 0;
            this.buildPages();
          } else {
            this.embajadores = [];
            this.totalPages = 0;
            this.totalElements = 0;
            this.pages = [];
          }
          this.isLoading = false;
        },
        (err) => {
          console.error('Error loading embajadores', err);
          this.embajadores = [];
          this.totalPages = 0;
          this.totalElements = 0;
          this.pages = [];
          this.isLoading = false;
        }
      );
    }

    applyFilters(): void {
      // currently backend getPromotores doesn't accept search/status params; if it does, include them.
      // For now, we reload page 1 and rely on backend pagination.
      this.currentPage = 1;
      this.loadEmbajadores(1);
    }

    onSearchInput(term: string): void {
      this.searchSubject.next(term);
    }

    ngOnDestroy(): void {
      if (this.searchSub) this.searchSub.unsubscribe();
    }

    goToPage(page: number): void {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return;
      this.currentPage = page;
      this.loadEmbajadores(page);
    }

    nextPage(): void {
      this.goToPage(this.currentPage + 1);
    }

    prevPage(): void {
      this.goToPage(this.currentPage - 1);
    }

    buildPages(): void {
      if (this.totalPages <= 0) {
        this.pages = [];
        return;
      }
      
      const pages: number[] = [];
      const maxPagesToShow = 7;
      let start = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
      let end = start + maxPagesToShow - 1;
      if (end > this.totalPages) {
        end = this.totalPages;
        start = Math.max(1, end - maxPagesToShow + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
      this.pages = pages;
    }

    // action handlers (stubs)
    viewDetails(id: number): void {
      // fetch ventas del promotor y open modal
        this.selectedPromotor = this.embajadores.find(e => e.idPromotor === id) || null;
        const idStr = id !== undefined && id !== null ? String(id) : '';
        if (!idStr) {
          console.warn('viewDetails called with empty id for promotor', id);
          // show a small informative modal instead of calling backend
          this.detallesPromotor = { ventas: [], totalVentasPendientes: 0, totalComision: 0, totalRecaudado: this.selectedPromotor?.totalRecaudado || 0, error: 'ID de promotor inválido' };
          this.showDetailsModal = true;
          return;
        }
        this.isLoading = true;
        console.debug(`Requesting ventasPromotor for id=${idStr}`);
        (this.userService as any).getVentasPromotor(idStr).subscribe(
        (res: any) => {
          // Backend sometimes wraps response as { result, data: { ventas: [...] } }
          // Normalize to a payload that the template expects: { ventas: [...], totalVentasPendientes, totalComision, totalRecaudado }
          const payload = res && res.data ? res.data : res || { ventas: [], totalVentasPendientes: 0, totalComision: 0, totalRecaudado: 0 };

          // Ensure ventas is an array and normalize field names (idPayment -> paymentId)
          if (!Array.isArray(payload.ventas)) {
            payload.ventas = [];
          } else {
            payload.ventas = payload.ventas.map((v: any) => ({
              paymentId: v.paymentId ?? v.idPayment ?? v.idPaymentRaw ?? v.id ?? '',
              amount: v.amount ?? v.monto ?? 0,
              paymentDate: v.paymentDate ?? v.date ?? v.createdAt ?? null,
              paidPromotor: v.paidPromotor ?? (v.status === 'PAGADO' || false),
              name: v.name ?? v.nombre ?? ''
            }));
          }

          this.detallesPromotor = payload;
          this.isLoading = false;
          this.showDetailsModal = true;
        },
        (err: any) => {
          console.error('Error fetching ventasPromotor', err);
          this.isLoading = false;
          // Try to recover if server returned wrapper
          const fallback = err && err.error && err.error.data ? err.error.data : null;
          this.detallesPromotor = fallback || { ventas: [], totalVentasPendientes: 0, totalComision: 0, totalRecaudado: 0 };
          this.showDetailsModal = true;
        }
      );
    }

    editEmbajador(id: number): void {
        // find the embajador and open modal
        const found = this.embajadores.find(e => e.idPromotor === id);
        if (found) {
          // ensure the editing object contains a commission field (some APIs return totalRecaudado)
          const commission = (found as any).commission ?? (found as any).totalRecaudado ?? 0;
          const descuento = (found as any).descuento ?? (found as any).discount ?? (found as any).discountValue ?? undefined;
          const abono = (found as any).abono ?? (found as any).abonoValue ?? undefined;
          this.editingEmbajador = { ...found, commission, descuento, abono } as any;
          this.showEditModal = true;
        }
    }

    toggleActive(id: number): void {
      // Confirm with user before removing role and coupon
      if (!confirm('¿Estás seguro de quitar el rol de promotor y eliminar el cupón de este usuario?')) {
        return;
      }
      
      this.isLoading = true;
      
      // Call backend to remove PROMOTOR role and delete cupon
      // We'll set statePromotor=false and cuponCode=null (or empty string)
      const payload: any = {
        id: Number(id),
        statePromotor: false,
        cuponCode: '', // empty string to signal deletion
        // You might also want to clear descuento and abono
        descuento: '0',
        abono: '0'
      };
      
      (this.userService as any).updateRoles(String(id), payload).subscribe(
        (res: any) => {
          if (res) {
            // Remove from local list or reload
            this.embajadores = this.embajadores.filter(e => e.idPromotor !== id);
            this.totalElements = Math.max(0, (this.totalElements || 1) - 1);
           
          } else {
            console.warn('updateRoles returned falsy response', res);
          }
          this.isLoading = false;
        },
        (err: any) => {
          console.error('Error removing promotor role', err);
          this.isLoading = false;
          alert('Error al quitar el rol de promotor. Intenta de nuevo.');
        }
      );
    }

  // modal state and helpers for create/edit embajador
  showCreateModal = false;
  showEditModal = false;
  showDetailsModal = false;
  detallesPromotor: any = null;
  selectedPromotor: any = null;
  newEmbajador: any = { name: '', email: '', cuponCode: '', commission: 0 };
  editingEmbajador: any = null;

  openCreateModal(): void {
    this.newEmbajador = { name: '', email: '', cuponCode: '', commission: 0 };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createEmbajador(): void {
    // TODO: call backend to create; for now simulate and close
    const newItem = { ...this.newEmbajador, idPromotor: Date.now() };
    this.embajadores.unshift(newItem as any);
    this.totalElements = (this.totalElements || 0) + 1;
    this.closeCreateModal();
  }

  openEditModal(id: number): void {
    const found = this.embajadores.find(e => e.idPromotor === id);
    if (found) {
      const commission = (found as any).commission ?? (found as any).totalRecaudado ?? 0;
      const descuento = (found as any).descuento ?? (found as any).discount ?? (found as any).discountValue ?? undefined;
      const abono = (found as any).abono ?? (found as any).abonoValue ?? undefined;
      const statePromotor = (found as any).statePromotor ?? (found as any).isPromotor ?? false;
      const stateConfig = (found as any).stateConfig ?? (found as any).isConfig ?? false;
      this.editingEmbajador = { ...found, commission, descuento, abono, statePromotor, stateConfig } as any;
      this.showEditModal = true;
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingEmbajador = null;
  }

  saveEditedEmbajador(): void {
    if (!this.editingEmbajador) return;

    const id = this.editingEmbajador.idPromotor;
    const idx = this.embajadores.findIndex(e => e.idPromotor === id);

    // Build a minimal RequesUser-compatible payload accepted by backend update endpoint
    // RequesUser fields: id, username, email, firstname, lastname, country, image, rol, descuento, abono
    // We'll provide id, email and firstname (split name if possible). If you want to persist commission
    // server-side we need a dedicated backend field/endpoint — currently not available.
    const fullName: string = this.editingEmbajador.name || this.editingEmbajador.firstname || '';
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ') || '';

    const payload: any = {
      id: Number(id),
      firstname: firstName || undefined,
      lastname: lastName || undefined,
      email: this.editingEmbajador.email || undefined,
    };

    // include descuento and abono if provided in the edit modal
    if ((this.editingEmbajador as any).descuento !== undefined && (this.editingEmbajador as any).descuento !== null) {
      // backend expects strings for RequesUser fields
      payload.descuento = String((this.editingEmbajador as any).descuento);
    }
    if ((this.editingEmbajador as any).abono !== undefined && (this.editingEmbajador as any).abono !== null) {
      payload.abono = String((this.editingEmbajador as any).abono);
    }
    // include cuponCode if provided
    if ((this.editingEmbajador as any).cuponCode !== undefined && (this.editingEmbajador as any).cuponCode !== null) {
      payload.cuponCode = (this.editingEmbajador as any).cuponCode;
    }
    // include statePromotor and stateConfig if provided
    if ((this.editingEmbajador as any).statePromotor !== undefined && (this.editingEmbajador as any).statePromotor !== null) {
      payload.statePromotor = Boolean((this.editingEmbajador as any).statePromotor);
    }
    if ((this.editingEmbajador as any).stateConfig !== undefined && (this.editingEmbajador as any).stateConfig !== null) {
      payload.stateConfig = Boolean((this.editingEmbajador as any).stateConfig);
    }

    // show loading state during request
    this.isLoading = true;

    // userService is typed as UserData; cast to any to access updateRoles which is implemented in UsersService
    (this.userService as any).updateRoles(String(id), payload).subscribe(
      (res: any) => {
        // Backend returns boolean true on success (DashboardService.updateUser returns boolean)
        if (res) {
          // Update local item to reflect the edited fields
          if (idx >= 0) {
            const updated = { ...this.embajadores[idx], ...this.editingEmbajador } as any;
            // Keep both possible properties in sync: commission and totalRecaudado (client-side only)
            if ((this.editingEmbajador as any).commission !== undefined) {
              updated.commission = (this.editingEmbajador as any).commission;
              updated.totalRecaudado = (this.editingEmbajador as any).commission;
            }
            // Apply firstname/lastname/email from payload if backend accepted them
            if (payload.firstname) updated.firstname = payload.firstname;
            if (payload.lastname) updated.lastname = payload.lastname;
            if (payload.email) updated.email = payload.email;
            this.embajadores[idx] = updated;
          }
        } else {
          console.warn('updateRoles returned falsy response', res);
        }
        this.isLoading = false;
        this.closeEditModal();
      },
      (err: any) => {
        console.error('Error updating embajador on server', err);
        // fall back to local update to keep UI responsive (optional)
        if (idx >= 0) {
          const updated = { ...this.embajadores[idx], ...this.editingEmbajador } as any;
          if ((this.editingEmbajador as any).commission !== undefined) {
            updated.commission = (this.editingEmbajador as any).commission;
            updated.totalRecaudado = (this.editingEmbajador as any).commission;
          }
          this.embajadores[idx] = updated;
        }
        this.isLoading = false;
        this.closeEditModal();
      }
    );
  }

  deleteEmbajador(id: number): void {
    this.embajadores = this.embajadores.filter(e => e.idPromotor !== id);
    this.totalElements = Math.max(0, (this.totalElements || 1) - 1);
    this.closeEditModal();
  }
}
