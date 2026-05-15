import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Document, DocumentData } from '../../../@core/interfaces/documents';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../../@core/backend/services/cart.service';
import { NbToastrService, NbPopoverModule } from '@nebular/theme';
import { CartItem } from '../../../@core/interfaces/cartItem';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TruncateTextPipe } from '../../pipes/truncate-text.pipe';

@Component({
    selector: 'ngx-talleres-card',
    templateUrl: './talleres-card.component.html',
    styleUrls: ['./talleres-card.component.scss'],
    standalone: true,
    imports: [NbPopoverModule, MatButton, MatCardModule, TruncateTextPipe]
})
export class TalleresCardComponent {
   private router = inject(Router);
   private dialogService = inject(MatDialog);
   private cartService = inject(CartService);
   private toastrService = inject(NbToastrService);
   private documentsService = inject(DocumentData);

   @Input() item: Document;
  
  
     goDetails() {
      this.router.navigate(['site/detail', this.item.id]);
    }
  
    addToCart() {
      const documentItem: CartItem = {
        id: this.item.id,
        title: this.item.title,
        description: this.item.description,
        price: this.item.price,
        imagenUrlPublic: this.item.imagenUrlPublic,
        imagenThumbUrlPublic: this.item.imagenThumbUrlPublic,
        isSubscription: false,
        nivel: this.item.nivel,
        materia: this.item.materia,
        category: this.item.category,
        situacion: this.item.situacion ? {
          id: this.item.situacion.id,
          nombre: this.item.situacion.nombre
        } : undefined
      };
      const added = this.cartService.addToCart(documentItem);
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
      const documentItem: CartItem = {
        id: this.item.id,
        title: this.item.title,
        description: this.item.description,
        price: this.item.price,
        imagenUrlPublic: this.item.imagenUrlPublic,
        imagenThumbUrlPublic: this.item.imagenThumbUrlPublic,
        isSubscription: false,
        nivel: this.item.nivel,
        materia: this.item.materia,
        category: this.item.category,
        situacion: this.item.situacion ? {
          id: this.item.situacion.id,
          nombre: this.item.situacion.nombre
        } : undefined
      };
      this.cartService.addToCart(documentItem);
  
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
