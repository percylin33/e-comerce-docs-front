import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Document, DocumentData } from '../../../@core/interfaces/documents';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../../@core/backend/services/cart.service';
import { NbToastrService } from '@nebular/theme';
import { CartItem } from '../../../@core/interfaces/cartItem';

@Component({
  selector: 'ngx-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit {
  @Input() item: Document;

  isLiked: boolean = false;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private dialogService: MatDialog,
    private cartService: CartService,
    private toastrService: NbToastrService,
    private documentsService: DocumentData,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Inicializar estado del like (puedes implementar persistencia aquí)
    this.isLiked = this.checkIfLiked();
  }

  private checkIfLiked(): boolean {
    // Implementar lógica para verificar si el usuario ya dio like
    // Por ejemplo, verificar en localStorage o estado global
    const likedItems = JSON.parse(localStorage.getItem('likedDocuments') || '[]');
    return likedItems.includes(this.item.id);
  }

  private updateLikedState(liked: boolean) {
    this.isLiked = liked;
    const likedItems = JSON.parse(localStorage.getItem('likedDocuments') || '[]');
    
    if (liked && !likedItems.includes(this.item.id)) {
      likedItems.push(this.item.id);
    } else if (!liked) {
      const index = likedItems.indexOf(this.item.id);
      if (index > -1) {
        likedItems.splice(index, 1);
      }
    }
    
    localStorage.setItem('likedDocuments', JSON.stringify(likedItems));
    this.cdr.markForCheck(); // Marcar para verificación de cambios
  }

  goDetails(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['site/detail', this.item.id]);
  }

  addToCart(event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (this.item.documentoLibre) {
      this.toastrService.warning('Este documento es gratuito, no se puede añadir al carrito', 'Información');
      return;
    }

    const documentItem: CartItem = {
      id: this.item.id,
      title: this.item.title,
      description: this.item.description,
      price: this.item.price,
      imagenUrlPublic: this.item.imagenUrlPublic,
      isSubscription: false,
    };

    const added = this.cartService.addToCart(documentItem);
    
    if (added) {
      this.toastrService.success('Documento agregado al carrito', 'Éxito', {
        duration: 3000,
        icon: 'shopping-cart-outline'
      });
    } else {
      this.toastrService.warning('El documento ya está en el carrito', 'Información');
    }
  }

  likeDocument(event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (!this.item || !this.item.id) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // Forzar detección de cambios para mostrar estado de loading

    this.documentsService.putLikes(this.item.id.toString()).subscribe({
      next: (response) => {
        if (response.result) {
          // Actualizar contador de likes
          this.item.countLikes = (this.item.countLikes || 0) + (this.isLiked ? -1 : 1);
          
          // Cambiar estado visual
          this.isLiked = !this.isLiked;
          this.updateLikedState(this.isLiked);

          // Mostrar notificación
          const message = this.isLiked ? 'Te gusta este documento' : 'Ya no te gusta este documento';
          this.toastrService.success(message, '', {
            duration: 2000,
            icon: this.isLiked ? 'heart' : 'heart-outline'
          });
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios para reflejar el nuevo estado
      },
      error: (error) => {
        console.error('Error al dar like:', error);
        this.toastrService.danger('Error al procesar tu reacción', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios en caso de error
      }
    });
  }

  openCartDialog(event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const documentItem: CartItem = {
      id: this.item.id,
      title: this.item.title,
      description: this.item.description,
      price: this.item.price,
      imagenUrlPublic: this.item.imagenUrlPublic,
      isSubscription: false,
    };
  
    const added = this.cartService.addToCart(documentItem);
  
    if (added) {
      this.toastrService.success('Documento agregado al carrito', 'Éxito');
    } else {
      this.toastrService.warning('El documento ya está en el carrito', 'Información');
    }

    this.dialogService.open(ShoppingCartComponent, {
      width: '80%',
      maxWidth: '90vw',
      data: {
        document: this.item
      }
    });
  }

  // Método para formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  // Método para obtener clase CSS según el tipo de documento
  getCardClass(): string {
    const classes = ['card'];
    if (this.item.documentoLibre) {
      classes.push('free-document');
    }
    if (this.isLoading) {
      classes.push('loading');
    }
    return classes.join(' ');
  }
}
