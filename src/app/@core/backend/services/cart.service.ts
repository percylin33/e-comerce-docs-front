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
    console.log('Adding to cart:', producto);
    
    const itemExists = this.cartItems.some(item => item.id === producto.id);

    if (!itemExists) {
      this.cartItems.push(producto);
      this.saveCartItems();
      this.cartItemCount.next(this.cartItems.length);

      if (document.documentoLibre) {
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
