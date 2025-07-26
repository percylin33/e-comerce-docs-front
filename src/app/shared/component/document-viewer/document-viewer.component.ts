import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DocumentData, Document } from '../../../@core/interfaces/documents';
import { CartService } from '../../../@core/backend/services/cart.service';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { DocumentDescriptionModalComponent } from '../document-description-modal/document-description-modal.component';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { CartItem } from '../../../@core/interfaces/cartItem';

@Component({
  selector: 'ngx-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss']
})
export class DocumentViewerComponent implements OnChanges {

  @Input() document: Document;
  currentPage: number = 1;
  isModalOpen: boolean = false;
  currentUser: any;
  isLoading: boolean = false;
  successMessage: string = '';

  constructor(private documentsService: DocumentData,
    private cartService: CartService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private dialogServiceMat: MatDialog,
    private router: Router) { }



  ngOnChanges(changes: SimpleChanges) {
    if (changes.document) {
    }
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
      isSubscription: false, // Asume que no es una suscripción
    };

    const added = this.cartService.addToCart(documentItem);
    if (added) {
      this.toastrService.success('Documento agregado al carrito', 'Éxito');
    } else {
      this.toastrService.warning('El documento ya está en el carrito', 'Información');
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
      isSubscription: false, // Asume que no es una suscripción
    };
    const added = this.cartService.addToCart(documentItem);
    if (added) {
      this.toastrService.success('Documento agregado al carrito', 'Éxito');
      this.openCartDialog(); // Abre el modal del carrito de compras
    } else {
      this.toastrService.warning('El documento ya está en el carrito', 'Información');
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
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const user = JSON.parse(userString);

      if (user && user.id) {
        this.documentsService.downloadFree(this.document.id, user.id).subscribe(
          response => {
            this.isLoading = false;
            if (response.result) {
              this.successMessage = 'Documento fue enviado asu correo electrónico exitosamente';
            }
          },
          error => {
            this.isLoading = false;
            // Aquí puedes manejar el error
          }
        );
      } else {
        this.isLoading = false;
        this.openErrorDialog();
      }
    } else {
      this.isLoading = false;
      this.openErrorDialog();
    }
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
  }
  return category;
}

}
