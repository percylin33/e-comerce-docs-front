import { Injectable } from '@angular/core';
import { Document } from '../../interfaces/documents';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: Document[] = [];
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

  addToCart(document: Document): boolean {
    
    
    const itemExists = this.cartItems.some(item => item.id === document.id);
    
    if (!itemExists) {
      this.cartItems.push(document);
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

  removeFromCart(document: Document) {
    this.cartItems = this.cartItems.filter(item => item.id !== document.id);
    this.saveCartItems();
    this.cartItemCount.next(this.cartItems.length);
  }

  getCartItems(): Document[] {
    return this.cartItems;
  }

  updateCartItems(items: Document[]) {
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
