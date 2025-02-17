import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Document } from '../../../@core/interfaces/documents';
import { CartService } from '../../../@core/backend/services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'ngx-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss'],
})
export class ShoppingCartComponent implements OnInit {
  cartItems: Document[] = [];

  constructor(
    private dialogRef: MatDialogRef<ShoppingCartComponent>,
    private cartService: CartService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.cartItems = this.cartService.getCartItems();
  }

  removeFromCart(document: Document) {
    this.cartItems = this.cartItems.filter(item => item.id !== document.id);
    this.cartService.updateCartItems(this.cartItems);
  }

  getTotal() {
    return this.cartItems.reduce((sum, item) => sum + item.price, 0);
  }

  close(): void {
    this.dialogRef.close();
  }

  checkout(): void {
    // Lógica para el proceso de compra

    //this.cartService.clearCart();
    this.dialogRef.close();
    this.router.navigate(['/site/checkout']);
  }
}
