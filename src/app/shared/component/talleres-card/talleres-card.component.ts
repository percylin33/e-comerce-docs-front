import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Document, DocumentData } from '../../../@core/interfaces/documents';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../../@core/backend/services/cart.service';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'ngx-talleres-card',
  templateUrl: './talleres-card.component.html',
  styleUrls: ['./talleres-card.component.scss']
})
export class TalleresCardComponent implements OnInit {
   @Input() item: Document;

   ngOnInit(): void {
    console.log('Item recibido:', this.item);
  }
  
  
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
        this.toastrService.warning('El documento ya está en el carrito', 'Información');
      }
    }

    goToWhatsApp() {
      const phoneNumber = '+51978768681'; // Reemplaza con el número de WhatsApp
      const message = encodeURIComponent(`Hola, estoy interesado en el taller: ${this.item.title}`);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank'); // Abre el enlace en una nueva pestaña
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
