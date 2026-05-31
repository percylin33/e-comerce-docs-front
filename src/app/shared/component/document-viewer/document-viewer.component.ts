import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { DocumentData, Document } from '../../../@core/interfaces/documents';
import { DownloadSessionService } from '../../../@core/services/download-session.service';
import { CartService } from '../../../@core/backend/services/cart.service';
import { NbDialogService, NbToastrService, NbPopoverModule, NbIconModule } from '@nebular/theme';
import { DocumentDescriptionModalComponent } from '../document-description-modal/document-description-modal.component';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { CartItem } from '../../../@core/interfaces/cartItem';
import { SharedService } from '../../../@auth/components/shared.service';
import { Subject, throwError } from 'rxjs';
import { takeUntil, catchError, timeout } from 'rxjs/operators';
import { AppPriceComponent } from '../../ui/price/price.component';
import { AppButtonComponent } from '../../ui/button/button.component';
import { AppIconButtonComponent } from '../../ui/icon-button/icon-button.component';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';

@Component({
    selector: 'ngx-document-viewer',
    templateUrl: './document-viewer.component.html',
    styleUrls: ['./document-viewer.component.scss'],
    standalone: true,
    imports: [NbPopoverModule, NbIconModule, AppPriceComponent, AppButtonComponent, AppIconButtonComponent, MatMenuTrigger, MatMenu, MatMenuItem]
})
export class DocumentViewerComponent implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  private documentsService = inject(DocumentData);
  private sessionsService = inject(DownloadSessionService);
  private cartService = inject(CartService);
  private toastrService = inject(NbToastrService);
  private dialogService = inject(NbDialogService);
  private dialogServiceMat = inject(MatDialog);
  private sharedService = inject(SharedService);


  @Input() document!: Document;
  @ViewChild('descEl', { static: false }) descEl?: ElementRef<HTMLElement>;
  currentPage: number = 1;
  isModalOpen: boolean = false;
  currentUser: any;
  isLoading: boolean = false;
  successMessage: string = '';
  isAuthenticated: boolean = false;

  // Estado de descripción expandible
  isDescExpanded: boolean = false;
  isDescOverflowing: boolean = false;
  private resizeObs?: ResizeObserver;
  private destroy$ = new Subject<void>();



  ngOnInit() {
    // Suscribirse al estado de autenticación
    this.sharedService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
      });

    // Suscribirse a los datos del usuario
    this.sharedService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeObs?.disconnect();
  }

  ngAfterViewInit() {
    // Esperar al primer ciclo para medir overflow real
    queueMicrotask(() => this.measureOverflow());
    this.observeResize();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.document) {
      // Reset estado al cambiar de documento y volver a medir tras render
      this.isDescExpanded = false;
      queueMicrotask(() => this.measureOverflow());
    }
  }

  toggleDescription(): void {
    this.isDescExpanded = !this.isDescExpanded;
  }

  private measureOverflow(): void {
    const el = this.descEl?.nativeElement;
    if (!el) return;
    // Forzamos estado colapsado para la medición
    const wasExpanded = this.isDescExpanded;
    if (wasExpanded) {
      this.isDescOverflowing = true;
      return;
    }
    this.isDescOverflowing = el.scrollHeight > el.clientHeight + 1;
  }

  private observeResize(): void {
    const el = this.descEl?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    this.resizeObs = new ResizeObserver(() => this.measureOverflow());
    this.resizeObs.observe(el);
  }

  likeDocument() {
    if (this.document && this.document.id) {
      this.documentsService.putLikes(this.document.id.toString()).subscribe(
        response => {
          // Aquí puedes actualizar el estado del documento si es necesario
          if (response.result) {

            this.document.countLikes += 1;
          }
        },
        error => {
        }
      );
    }
  }

  shareDocument(platform: string) {
    const url = window.location.href; // URL actual de la página
    const text = `Check out this document: ${this.document.title}`;
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(this.document.title)}&body=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          alert('Enlace copiado al portapapeles');
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  }

  addToCart() {
    const documentItem: CartItem = {
      id: this.document.id,
      title: this.document.title,
      description: this.document.description,
      price: this.document.price,
      imagenUrlPublic: this.document.imagenUrlPublic,
      imagenThumbUrlPublic: this.document.imagenThumbUrlPublic,
      isSubscription: false,
      nivel: this.document.nivel,
      materia: this.document.materia,
      category: this.document.category,
      situacion: this.document.situacion ? {
        id: this.document.situacion.id,
        nombre: this.document.situacion.nombre
      } : undefined
    };

    const added = this.cartService.addToCart(documentItem);
    if (added) {
      this.toastrService.success('Documento agregado al carrito', 'Éxito');
    } else {
      // Verificar si el carrito está lleno
      const cartItems = this.cartService.getCartItems();
      if (cartItems.length >= 25) {
        this.toastrService.warning('Carrito lleno. Máximo 25 productos permitidos', 'Límite alcanzado');
      } else {
        this.toastrService.warning('El documento ya está en el carrito', 'Información');
      }
    }
  }

  openModal() {
    this.dialogService.open(DocumentDescriptionModalComponent, {
      context: {
        description: this.document.description,
      },
    });
  }

  addToCartDownload() {
    const documentItem: CartItem = {
      id: this.document.id,
      title: this.document.title,
      description: this.document.description,
      price: this.document.price,
      imagenUrlPublic: this.document.imagenUrlPublic,
      imagenThumbUrlPublic: this.document.imagenThumbUrlPublic,
      isSubscription: false,
      nivel: this.document.nivel,
      materia: this.document.materia,
      category: this.document.category,
      situacion: this.document.situacion ? {
        id: this.document.situacion.id,
        nombre: this.document.situacion.nombre
      } : undefined
    };
    const added = this.cartService.addToCart(documentItem);
    if (added) {
      this.toastrService.success('Documento agregado al carrito', 'Éxito');
      this.openCartDialog(); // Abre el modal del carrito de compras
    } else {
      // Verificar si el carrito está lleno
      const cartItems = this.cartService.getCartItems();
      if (cartItems.length >= 25) {
        this.toastrService.warning('Carrito lleno. Máximo 25 productos permitidos', 'Límite alcanzado');
      } else {
        this.toastrService.warning('El documento ya está en el carrito', 'Información');
      }
      this.openCartDialog(); // Abre el modal del carrito de compras
    }
  }

  openCartDialog() {
    this.dialogServiceMat.open(ShoppingCartComponent, {
      width: '80%',
      maxWidth: '90vw',
    });
  }

  /**
   * Descarga un documento gratuito via sesion (intent DOWNLOAD).
   *
   * Reemplaza el flujo legacy `documentsService.downloadFree` que devolvia
   * { type: 'TOKEN' | 'DIRECT_URL', token } y enrutaba a /site/descarga o
   * /api/v1/payment/free/download. El back valida que el documento sea
   * gratuito (`documentoLibre=true`) en `userTieneAcceso`.
   */
  downloadFree() {
    if (!this.isAuthenticated || !this.currentUser || !this.currentUser.id) {
      this.openErrorDialog();
      return;
    }
    if (this.isLoading || !this.document?.id) return;

    this.isLoading = true;

    this.sessionsService
      .createSession({ documentId: this.document.id, intent: 'DOWNLOAD' })
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
          this.isLoading = false;
          if (!session?.downloadUrl) {
            this.toastrService.danger('No se pudo obtener el enlace de descarga.', 'Error');
            return;
          }
          const a = window.document.createElement('a');
          a.href = session.downloadUrl;
          a.download = '';
          a.rel = 'noopener noreferrer';
          window.document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            try { window.document.body.removeChild(a); } catch (e) { /* ignore */ }
          }, 200);
        },
        error: (err: any) => {
          this.isLoading = false;
          let message = 'Ocurrió un error al procesar la descarga.';
          if (err?.status === 429) {
            message = 'Demasiadas descargas. Intenta de nuevo en unos minutos.';
          } else if (err?.status === 410 || err?.status === 404) {
            message = 'El permiso expiró. Intenta de nuevo.';
          } else if (err?.status === 403) {
            message = 'No tienes acceso a este documento.';
          } else if (err?._timeout || err?.status === 0) {
            message = 'El servidor tardó demasiado. Intenta de nuevo.';
          }
          this.toastrService.danger(message, 'Error de descarga', { duration: 7000 });
        }
      });
  }

  openErrorDialog() {
    const screenWidth = window.innerWidth;
    const dialogWidth = screenWidth > 1200 ? '50%' : '80%';

    this.dialogServiceMat.open(ErrorDialogComponent, {
      width: dialogWidth,
    });
  }

  goToWhatsApp() {
    const phoneNumber = '+51978768681'; // Reemplaza con el número de WhatsApp
    const message = encodeURIComponent(`Hola, estoy interesado en el taller: ${this.document.title}`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank'); // Abre el enlace en una nueva pestaña
  }

  getDisplayCategory(category: string): string {
    if (category === 'PLANIFICACION') {
      return 'SESIONES';
    } else if (category === 'PLAN_LECTOR') {
      return 'PLAN LECTOR';
    }
    return category;
  }

}
