import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DocumentData, Document, DownloadFreeResponse } from '../../../@core/interfaces/documents';
import { CartService } from '../../../@core/backend/services/cart.service';
import { NbDialogService, NbToastrService, NbPopoverModule, NbIconModule } from '@nebular/theme';
import { DocumentDescriptionModalComponent } from '../document-description-modal/document-description-modal.component';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { CartItem } from '../../../@core/interfaces/cartItem';
import { SharedService } from '../../../@auth/components/shared.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
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

  constructor(private documentsService: DocumentData,
    private cartService: CartService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private dialogServiceMat: MatDialog,
    private router: Router,
    private sharedService: SharedService) { }



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

  downloadFree() {
    this.isLoading = true;

    if (!this.isAuthenticated || !this.currentUser || !this.currentUser.id) {
      this.isLoading = false;
      this.openErrorDialog();
      return;
    }

    this.documentsService.downloadFree(this.document.id, this.currentUser.id).subscribe(
      (response: DownloadFreeResponse) => {
        this.isLoading = false;
        const data = response.data;

        if (data.type === 'TOKEN' && data.token) {
          // Archivo en Google Drive → navegar a la página de descarga
          this.router.navigate(['/site/descarga', data.token]);
        } else if (data.type === 'DIRECT_URL' && data.token) {
          // Archivo en Firebase → proxy del backend con Content-Disposition: attachment
          // window.location.href dispara la descarga sin salir de la página actual
          const proxyUrl = `${environment.apiUrl}/api/v1/payment/free/download/${data.token}`;
          window.location.href = proxyUrl;
        } else {
          this.toastrService.danger('No se pudo obtener el enlace de descarga.', 'Error');
        }
      },
      error => {
        this.isLoading = false;
        this.toastrService.danger('Ocurrió un error al procesar la descarga.', 'Error');
      }
    );
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
