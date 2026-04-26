import { Injectable, signal } from '@angular/core';
import { CartItem } from '../../interfaces/cartItem';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  readonly cartItemCount = signal<number>(0);

  constructor() {
    const storedItems = localStorage.getItem('cartItems');
    if (storedItems) {
      this.cartItems = JSON.parse(storedItems);
      this.cartItemCount.set(this.cartItems.length);
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
      
      // Validar límite de 25 productos antes de añadir
      if (this.cartItems.length >= 25) {
        return false; // Retorna false para indicar que el carrito está lleno
      }
      
      this.cartItems.push(producto);
      this.saveCartItems();
      this.cartItemCount.set(this.cartItems.length);

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
    this.cartItemCount.set(this.cartItems.length);
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
    this.cartItemCount.set(this.cartItems.length);
  }

  clearCart() {
    this.cartItems = [];
    this.saveCartItems();
    this.cartItemCount.set(this.cartItems.length);
  }

  private saveCartItems() {
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
  }

  // Métodos para manejo de descuentos por situación
  getDocumentsBySituation(): Map<string, CartItem[]> {
    const situationMap = new Map<string, CartItem[]>();
    
    this.getDocuments().forEach(item => {
      if (item.situacion) {
        let situationKey: string;
        
        // Para secundaria, agrupamos por situación + materia
        if (item.nivel?.toLowerCase() === 'secundaria' && item.materia) {
          situationKey = `${item.situacion.id}-${item.situacion.nombre}-${item.materia}`;
        } else {
          // Para inicial y primaria, solo por situación
          situationKey = `${item.situacion.id}-${item.situacion.nombre}`;
        }
        
        if (!situationMap.has(situationKey)) {
          situationMap.set(situationKey, []);
        }
        situationMap.get(situationKey)!.push(item);
      } else {
        // Documentos sin situación se agrupan aparte
        const noSituationKey = 'sin-situacion';
        if (!situationMap.has(noSituationKey)) {
          situationMap.set(noSituationKey, []);
        }
        situationMap.get(noSituationKey)!.push(item);
      }
    });
    
    return situationMap;
  }

  getSituationDiscounts(): { situationName: string; documentCount: number; discountPercentage: number; totalDiscount: number; nivel?: string; materia?: string }[] {
    const situationMap = this.getDocumentsBySituation();
    const discounts: { situationName: string; documentCount: number; discountPercentage: number; totalDiscount: number; nivel?: string; materia?: string }[] = [];
    
    situationMap.forEach((items, situationKey) => {
      if (situationKey !== 'sin-situacion' && items.length > 1) {
        const firstItem = items[0];
        const nivel = firstItem.nivel?.toLowerCase();
        let discountPercentage = 0;
        
        // Aplicar descuentos según el nivel educativo
        if (nivel === 'inicial' || nivel === 'primaria') {
          // INICIAL y PRIMARIA: Por situación únicamente
          if (items.length === 2) {
            discountPercentage = 15; // 15% para 2 documentos
          } else if (items.length >= 3) {
            discountPercentage = 25; // 25% para 3 o más documentos
          }
        } else if (nivel === 'secundaria') {
          // SECUNDARIA: Por situación + materia
          if (items.length === 2) {
            discountPercentage = 15; // 15% para 2 documentos
          } else if (items.length === 3) {
            discountPercentage = 25; // 25% para 3 documentos
          } else if (items.length === 4) {
            discountPercentage = 35; // 35% para 4 documentos
          } else if (items.length >= 5) {
            discountPercentage = 40; // 40% para 5 o más documentos
          }
        }
        
        if (discountPercentage > 0) {
          const situationParts = situationKey.split('-');
          const situationName = situationParts.slice(1, -1).join('-'); // Remover ID y materia (si existe)
          const materia = nivel === 'secundaria' && situationParts.length > 2 ? situationParts[situationParts.length - 1] : undefined;
          
          const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
          const totalDiscount = (totalPrice * discountPercentage) / 100;
          
          discounts.push({
            situationName,
            documentCount: items.length,
            discountPercentage,
            totalDiscount,
            nivel: firstItem.nivel,
            materia
          });
        }
      }
    });
    
    return discounts;
  }

  // Métodos para manejo de descuentos por REFORZAMIENTO
  getDocumentsByReforzamiento(): Map<string, CartItem[]> {
    const reforzamientoMap = new Map<string, CartItem[]>();
    
    this.getDocuments().forEach(item => {
      // Solo considerar documentos de categoría REFORZAMIENTO
      if (item.category?.toUpperCase() === 'REFORZAMIENTO' && item.materia) {
        const reforzamientoKey = `REFORZAMIENTO-${item.materia}`;
        if (!reforzamientoMap.has(reforzamientoKey)) {
          reforzamientoMap.set(reforzamientoKey, []);
        }
        reforzamientoMap.get(reforzamientoKey)!.push(item);
      }
    });
    
    return reforzamientoMap;
  }

  getReforzamientoDiscounts(): { categoryName: string; materia: string; documentCount: number; discountPercentage: number; totalDiscount: number }[] {
    const reforzamientoMap = this.getDocumentsByReforzamiento();
    const discounts: { categoryName: string; materia: string; documentCount: number; discountPercentage: number; totalDiscount: number }[] = [];
    
    reforzamientoMap.forEach((items, reforzamientoKey) => {
      if (items.length > 1) {
        let discountPercentage = 0;
        
        // Aplicar descuentos progresivos para REFORZAMIENTO
        if (items.length === 2) {
          discountPercentage = 15; // 15% para 2 documentos
        } else if (items.length === 3) {
          discountPercentage = 25; // 25% para 3 documentos
        } else if (items.length === 4) {
          discountPercentage = 35; // 35% para 4 documentos
        } else if (items.length >= 5) {
          discountPercentage = 40; // 40% para 5 o más documentos
        }
        
        if (discountPercentage > 0) {
          const materia = items[0].materia!; // Sabemos que tiene materia por el filtro anterior
          const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
          const totalDiscount = (totalPrice * discountPercentage) / 100;
          
          discounts.push({
            categoryName: 'REFORZAMIENTO',
            materia,
            documentCount: items.length,
            discountPercentage,
            totalDiscount
          });
        }
      }
    });
    
    return discounts;
  }

  // Métodos para manejo de descuentos por PLAN_LECTOR
  getDocumentsByPlanLector(): Map<string, CartItem[]> {
    const planLectorMap = new Map<string, CartItem[]>();
    
    this.getDocuments().forEach(item => {
      // Solo considerar documentos de categoría PLAN_LECTOR
      if (item.category?.toUpperCase() === 'PLAN_LECTOR' && item.nivel) {
        const planLectorKey = `PLAN_LECTOR-${item.nivel}`;
        if (!planLectorMap.has(planLectorKey)) {
          planLectorMap.set(planLectorKey, []);
        }
        planLectorMap.get(planLectorKey)!.push(item);
      }
    });
    
    return planLectorMap;
  }

  getPlanLectorDiscounts(): { categoryName: string; nivel: string; documentCount: number; discountPercentage: number; totalDiscount: number }[] {
    const planLectorMap = this.getDocumentsByPlanLector();
    const discounts: { categoryName: string; nivel: string; documentCount: number; discountPercentage: number; totalDiscount: number }[] = [];
    
    planLectorMap.forEach((items, planLectorKey) => {
      if (items.length > 1) {
        const nivel = items[0].nivel!.toLowerCase(); // Sabemos que tiene nivel por el filtro anterior
        let discountPercentage = 0;
        
        // Aplicar descuentos según el nivel educativo
        if (nivel === 'inicial' || nivel === 'primaria') {
          // INICIAL y PRIMARIA: Por nivel únicamente
          if (items.length === 2) {
            discountPercentage = 10; // 10% para 2 documentos
          } else if (items.length >= 3) {
            discountPercentage = 15; // 15% para 3 o más documentos
          }
        } else if (nivel === 'secundaria') {
          // SECUNDARIA: Descuentos progresivos
          if (items.length === 2) {
            discountPercentage = 10; // 10% para 2 documentos
          } else if (items.length === 3) {
            discountPercentage = 15; // 15% para 3 documentos
          } else if (items.length === 4) {
            discountPercentage = 20; // 20% para 4 documentos
          } else if (items.length >= 5) {
            discountPercentage = 25; // 25% para 5 o más documentos
          }
        }
        
        if (discountPercentage > 0) {
          const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
          const totalDiscount = (totalPrice * discountPercentage) / 100;
          
          discounts.push({
            categoryName: 'PLAN_LECTOR',
            nivel: items[0].nivel!,
            documentCount: items.length,
            discountPercentage,
            totalDiscount
          });
        }
      }
    });
    
    return discounts;
  }

  getTotalWithDiscounts(): { subtotal: number; totalDiscounts: number; finalTotal: number } {
    const documents = this.getDocuments();
    const subtotal = documents.reduce((sum, item) => sum + item.price, 0);
    
    const situationDiscounts = this.getSituationDiscounts();
    const reforzamientoDiscounts = this.getReforzamientoDiscounts();
    const planLectorDiscounts = this.getPlanLectorDiscounts();
    
    const totalSituationDiscounts = situationDiscounts.reduce((sum, discount) => sum + discount.totalDiscount, 0);
    const totalReforzamientoDiscounts = reforzamientoDiscounts.reduce((sum, discount) => sum + discount.totalDiscount, 0);
    const totalPlanLectorDiscounts = planLectorDiscounts.reduce((sum, discount) => sum + discount.totalDiscount, 0);
    const totalDiscounts = totalSituationDiscounts + totalReforzamientoDiscounts + totalPlanLectorDiscounts;
    
    return {
      subtotal,
      totalDiscounts,
      finalTotal: subtotal - totalDiscounts
    };
  }
}
