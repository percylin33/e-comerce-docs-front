import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../../interfaces/cartItem';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  cartItemCount = new BehaviorSubject<number>(0);

  constructor() {
    const storedItems = localStorage.getItem('cartItems');
    if (storedItems) {
      this.cartItems = JSON.parse(storedItems);
      this.cartItemCount.next(this.cartItems.length);
    }
  }

  
  // private updateCartItemCount() {
  //   this.cartItemCountSubject.next(this.cartItems.length);
  // }


  addToCart(producto: CartItem): boolean {
    
    const itemExists = this.cartItems.some(item => item.id === producto.id);

    if (!itemExists) {
      const isPaymentQuota = this.isPaymentQuota(producto);
      const hasPaymentQuotas = this.hasPaymentQuotas();
      const hasSubscriptions = this.hasSubscription();
      const hasDocuments = this.hasDocuments();

      // Si el producto es un pago de cuota
      if (isPaymentQuota) {
        // Los pagos de cuota no se pueden mezclar con nada, limpiamos todo el carrito
        this.cartItems = [];
      }
      // Si el producto es una suscripción
      else if (producto.isSubscription) {
        // Las suscripciones no se pueden mezclar con otras suscripciones ni con pagos de cuota
        this.cartItems = this.cartItems.filter(item => !item.isSubscription && !this.isPaymentQuota(item));
        
      }
      // Si el producto es un documento
      else {
        // Los documentos no se pueden mezclar con suscripciones ni pagos de cuota
        this.cartItems = this.cartItems.filter(item => !item.isSubscription && !this.isPaymentQuota(item));
        
      }

      // Si hay pagos de cuota en el carrito y se intenta añadir cualquier otra cosa
      if (hasPaymentQuotas && !isPaymentQuota) {
        this.cartItems = [];
      }
      
      this.cartItems.push(producto);
      this.saveCartItems();
      this.cartItemCount.next(this.cartItems.length);

      if (producto.documentoLibre) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

  removeFromCart(producto: CartItem) {
    this.cartItems = this.cartItems.filter(item => item.id !== producto.id);
    this.saveCartItems();
    this.cartItemCount.next(this.cartItems.length);
  }

  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  hasSubscription(): boolean {
    return this.cartItems.some(item => item.isSubscription);
  }

  getSubscriptions(): CartItem[] {
    return this.cartItems.filter(item => item.isSubscription);
  }

  getDocuments(): CartItem[] {
    return this.cartItems.filter(item => !item.isSubscription && !this.isPaymentQuota(item));
  }

  hasDocuments(): boolean {
    return this.cartItems.some(item => !item.isSubscription && !this.isPaymentQuota(item));
  }

  isPaymentQuota(item: CartItem): boolean {
    return item.title && item.title.startsWith('Cuota -');
  }

  hasPaymentQuotas(): boolean {
    return this.cartItems.some(item => this.isPaymentQuota(item));
  }

  getPaymentQuotas(): CartItem[] {
    return this.cartItems.filter(item => this.isPaymentQuota(item));
  }

  getCartType(): 'empty' | 'documents' | 'subscription' | 'payment-quota' {
    if (this.cartItems.length === 0) return 'empty';
    if (this.hasPaymentQuotas()) return 'payment-quota';
    if (this.hasSubscription()) return 'subscription';
    return 'documents';
  }

  updateCartItems(items: CartItem[]) {
    this.cartItems = items;
    this.saveCartItems();
    this.cartItemCount.next(this.cartItems.length);
  }

  clearCart() {
    this.cartItems = [];
    this.saveCartItems();
    this.cartItemCount.next(this.cartItems.length);
  }

  private saveCartItems() {
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
  }
}
