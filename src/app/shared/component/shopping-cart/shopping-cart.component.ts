import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Document } from '../../../@core/interfaces/documents';
import { CartService } from '../../../@core/backend/services/cart.service';
import { Router } from '@angular/router';
import { CartItem } from '../../../@core/interfaces/cartItem';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'ngx-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss'],
})
export class ShoppingCartComponent implements OnInit {
  cartItems: CartItem[] = [];

  constructor(
    private dialogRef: MatDialogRef<ShoppingCartComponent>,
    private cartService: CartService,
    private router: Router,
    private toastrService: NbToastrService,
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
    // Verificar si hay alguna suscripción en el carrito
    const hasSubscription = this.cartItems.some(item => item.isSubscription === true);
    const isAuthenticated = !!localStorage.getItem('currentUser');

    if (hasSubscription && !isAuthenticated) {
      // Si hay suscripción pero no está logueado, informar y redirigir
      this.toastrService.warning(
        'Para adquirir una membresía es necesario iniciar sesión o registrarse.',
        'Autenticación requerida',
        { duration: 6000 }
      );

      this.dialogRef.close();

      // Pequeño retardo para que el usuario logre leer el mensaje antes del cambio de página
      setTimeout(() => {
        this.router.navigate(['/autenticacion/login'], { queryParams: { returnUrl: '/site/checkout' } });
      }, 2000);
      return;
    }

    this.dialogRef.close();
    this.router.navigate(['/site/checkout']);
  }
}
