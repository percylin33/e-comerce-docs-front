import { Component, Input } from '@angular/core';
import { Document } from '../../../@core/interfaces/documents';
import { Router } from '@angular/router';
import { CartService } from '../../../@core/backend/services/cart.service';
import { CartItem } from '../../../@core/interfaces/cartItem';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'ngx-document-card',
  templateUrl: './document-card.component.html',
  styleUrls: ['./document-card.component.scss']
})
export class DocumentCardComponent {
  @Input() document: Document;

  constructor(
    private router: Router,
    private cartService: CartService,
    private toastrService: NbToastrService,
  ) { }

  goDetails() {
    this.router.navigate(['site/detail', this.document.id]);
  }

  addToCart(event: MouseEvent): void {
    // Evitar que el click se propague al contenedor (que navega al detalle)
    event.stopPropagation();

    const item: CartItem = {
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
        nombre: this.document.situacion.nombre,
      } : undefined,
    };

    const added = this.cartService.addToCart(item);
    if (added) {
      this.toastrService.success('Documento agregado al carrito', 'Éxito');
    } else {
      const cartItems = this.cartService.getCartItems();
      if (cartItems.length >= 25) {
        this.toastrService.warning('Carrito lleno. Máximo 25 productos permitidos', 'Límite alcanzado');
      } else {
        this.toastrService.warning('El documento ya está en el carrito', 'Información');
      }
    }
  }
}
