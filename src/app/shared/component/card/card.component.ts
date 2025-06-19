import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Document, DocumentData } from '../../../@core/interfaces/documents';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../../@core/backend/services/cart.service';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'ngx-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input() item: Document;


  constructor(private router: Router,
              private dialogService: MatDialog,
              private cartService: CartService,
              private toastrService: NbToastrService,
              private documentsService: DocumentData,
  ) { }


   goDetails() {
    this.router.navigate(['site/detail', this.item.id]);
  }

  addToCart() {
    const added = this.cartService.addToCart(this.item);
    if (added) {
      this.toastrService.success('Documento agregado al carrito', 'Éxito');
    } else {
      if (this.item.documentoLibre){
        this.toastrService.warning('Este documento es gratis no se puede añadir al carrito', 'Información');
      } else {
        this.toastrService.warning('El documento ya está en el carrito', 'Información');
      }
    }
  }

  openCartDialog() {
    this.cartService.addToCart(this.item);

    this.dialogService.open(ShoppingCartComponent, {
      width: '80%',
      maxWidth: '90vw',
      data: {
        document: this.item
      }
    });
  }

  likeDocument() {
    if (this.item && this.item.id) {
      this.documentsService.putLikes(this.item.id.toString()).subscribe(
        response => {
          // Aquí puedes actualizar el estado del documento si es necesario
          if (response.result) {

            this.item.countLikes += 1;
          }
        },
        error => {
        }
      );
    }
  }

}
