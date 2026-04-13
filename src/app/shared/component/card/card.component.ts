import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Document, DocumentData } from '../../../@core/interfaces/documents';
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
  @Input() item!: Document;
  @Input() showDiscounts: boolean = false;

  isLiked: boolean = false;
  isLoading: boolean = false;

  constructor(
    private router: Router,
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

  private buildCartItem(): CartItem {
    return {
      id: this.item.id,
      title: this.item.title,
      description: this.item.description,
      price: this.item.price,
      imagenUrlPublic: this.item.imagenUrlPublic,
      isSubscription: false,
      nivel: this.item.nivel,
      materia: this.item.materia,
      category: this.item.category,
      situacion: this.item.situacion
        ? { id: this.item.situacion.id, nombre: this.item.situacion.nombre }
        : undefined
    };
  }

  addToCart(event?: Event) {
    if (event) event.stopPropagation();

    if (this.item.documentoLibre) {
      this.toastrService.warning('Este documento es gratuito, no se puede añadir al carrito', 'Información');
      return;
    }

    const added = this.cartService.addToCart(this.buildCartItem());

    if (added) {
      this.toastrService.success('Documento agregado al carrito', 'Éxito', {
        duration: 3000,
        icon: 'shopping-cart-outline'
      });
    } else {
      const cartItems = this.cartService.getCartItems();
      if (cartItems.length >= 25) {
        this.toastrService.warning('Carrito lleno. Máximo 25 productos permitidos', 'Límite alcanzado');
      } else {
        this.toastrService.warning('El documento ya está en el carrito', 'Información');
      }
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
    this.cdr.markForCheck();

    this.documentsService.putLikes(this.item.id.toString()).subscribe({
      next: (response) => {
        if (response.result) {
          this.item.countLikes = (this.item.countLikes || 0) + (this.isLiked ? -1 : 1);
          this.isLiked = !this.isLiked;
          this.updateLikedState(this.isLiked);
          const message = this.isLiked ? 'Te gusta este documento' : 'Ya no te gusta este documento';
          this.toastrService.success(message, '', {
            duration: 2000,
            icon: this.isLiked ? 'heart' : 'heart-outline'
          });
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al dar like:', error);
        this.toastrService.danger('Error al procesar tu reacción', 'Error');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Métodos para mostrar descuentos disponibles (solo cuando showDiscounts es true)
  hasAvailableDiscounts(): boolean {
    if (!this.showDiscounts) return false;
    return this.getMultiItemDiscount() > 0 || this.hasComboDiscount();
  }

  getMultiItemDiscount(): number {
    if (!this.showDiscounts) return 0;
    
    // Solo categorías específicas tienen descuentos según el cart.service
    const category = this.item.category?.toLowerCase();
    
    // PLANIFICACION, EVALUACION, ESTRATEGIAS - descuentos por situación
    if (category === 'planificacion' || category === 'evaluacion' || category === 'estrategias') {
      // Verificar si tiene situación definida (necesario para descuentos por situación)
      if (this.item.situacion && this.item.situacion.id && this.item.situacion.nombre) {
        return 15; // 15% por 2+ documentos de la misma situación
      }
      return 0; // Sin situación no hay descuento
    } 
    // REFORZAMIENTO - descuentos por materia
    else if (category === 'reforzamiento') {
      // Verificar si tiene materia definida (necesario para descuentos por reforzamiento)
      if (this.item.materia) {
        return 15; // 15% por 2+ documentos de la misma materia en reforzamiento
      }
      return 0; // Sin materia no hay descuento
    } 
    // PLAN_LECTOR - descuentos por nivel
    else if (category === 'plan_lector') {
      // Verificar si tiene nivel definido (necesario para descuentos por plan lector)
      if (this.item.nivel) {
        return 10; // 10% por 2+ documentos del mismo nivel en plan lector
      }
      return 0; // Sin nivel no hay descuento
    }
    
    return 0; // Otras categorías no tienen descuentos automáticos
  }

  hasComboDiscount(): boolean {
    if (!this.showDiscounts) return false;
    
    // Solo las categorías que realmente tienen descuentos progresivos
    const category = this.item.category?.toLowerCase();
    
    if (category === 'planificacion' || category === 'evaluacion' || category === 'estrategias') {
      return !!(this.item.situacion && this.item.situacion.id && this.item.situacion.nombre);
    } else if (category === 'reforzamiento') {
      return !!this.item.materia;
    } else if (category === 'plan_lector') {
      return !!this.item.nivel;
    }
    
    return false;
  }

  // Métodos para calcular precios con descuento (solo cuando showDiscounts es true)
  getDiscountedPrice(): number {
    if (!this.showDiscounts) return this.item.price;
    
    const discount = this.getMultiItemDiscount();
    if (discount > 0) {
      return this.item.price * (1 - discount / 100);
    }
    return this.item.price;
  }

  getSavingsAmount(): number {
    if (!this.showDiscounts) return 0;
    
    const discount = this.getMultiItemDiscount();
    if (discount > 0) {
      return this.item.price * (discount / 100);
    }
    return 0;
  }
}
