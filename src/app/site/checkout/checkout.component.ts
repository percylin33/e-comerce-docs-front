import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../@core/backend/services/cart.service';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { PaymentData, PostPayment } from '../../@core/interfaces/payments';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { last } from 'rxjs-compat/operator/last';
import { first } from 'rxjs-compat/operator/first';

declare var Culqi: any;

@Component({
  selector: 'ngx-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  isAuthenticated: boolean = false;
  cartItems: any[] = [];
  checkoutForm: FormGroup;
  isProcessing: boolean = false;
  orderId: string;

  constructor(
    private cartService: CartService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastrService: NbToastrService,
    private paymentService: PaymentData,
    private http: HttpClient
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadAuthState();
    this.loadCartItems();

    if (this.isAuthenticated) {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        this.checkoutForm.patchValue({
          firstName: userData.name,
          lastName: userData.lastname,
          email: userData.sub,
        });
      }
    }

    this.initCulqi();
  }

  private initForm(): void {
    this.checkoutForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[0-9]{8,}$/)]],
      agreement: [false, [Validators.requiredTrue]],
      
    });
  }

  private loadAuthState(): void {
    const currentUser = localStorage.getItem('currentUser');
    this.isAuthenticated = !!currentUser;
  }

  private loadCartItems(): void {
    this.cartItems = this.cartService.getCartItems();
    if (this.cartItems.length === 0) {
      this.toastrService.warning('El carrito está vacío');
      this.router.navigate(['/site/home']);
    }
  }

  // Inicialización de Culqi: se configuran las llaves, estilos y se habilitan múltiples métodos de pago.
  private initCulqi(): void {
    window['culqi'] = this.culqiHandler.bind(this);
    Culqi.publicKey = environment.CULQI_PUBLIC_KEY;
    Culqi.settings({
      title: 'Carpeta Digital',
      currency: 'PEN',
      description: 'Compra de ejemplo',
      amount: this.getTotal() * 100,
      order: this.orderId,  // Se actualizará cuando se cree la orden
    });

    Culqi.options({
      lang: "auto",
      installments: false,
      style: {
        logo: 'https://firebasestorage.googleapis.com/v0/b/cd-store-529c3.firebasestorage.app/o/LOGOTIPO_CD.png?alt=media&token=4d5a070b-f2d9-45ed-90b8-edc7921f0eaf',
        maincolor: '#1a73e8',
        buttontext: 'Pagar',
        buttoncolor: '#1a73e8',
        titlecolor: '#000000',
        desctextcolor: '#000000',
        amountcolor: '#000000'
      },
      paymentMethods: {
        tarjeta: true,
        yape: true,
        bancaMovil: true,
        agente: true,
        billetera: true,
        cuotealo: true,
      },
    });
  }

  // Se crea la orden en el backend y, al obtener el orderId, se reconfigura Culqi y se abre el checkout.
  abrirCulqi(): void {
    if (this.checkoutForm.valid) {
      this.createOrder((orderId) => {
        this.orderId = orderId;
        // Actualizar configuración con el nuevo orderId
        Culqi.settings({
          title: 'Carpeta Digital',
          currency: 'PEN',
          description: 'Compra de ejemplo',
          amount: this.getTotal() * 100,
          order: this.orderId,
        });
        // Validamos los métodos de pago disponibles antes de abrir el checkout
        Culqi.validationPaymentMethods();
        Culqi.open();
      });
    } else {
      this.checkoutForm.markAllAsTouched();
    }
  }

  private createOrder(callback: (orderId: string) => void): void {
    const metadata = {
      
      orderId: this.orderId,
      userId: this.isAuthenticated ? JSON.parse(localStorage.getItem('currentUser')).id : null,
      name: (this.checkoutForm.get('firstName')?.value || '') + ' ' + (this.checkoutForm.get('lastName')?.value || ''),
      amount: this.getTotal(),
      description: 'Compra en Carpeta Digital',
      phone: this.checkoutForm.get('phone').value,
      isSubscription: false,
      status: '2',
      subscriptionType: '',
      documentIds: this.cartItems.map(item => item.id),
      guestEmail: !this.isAuthenticated ? this.checkoutForm.get('email').value : null,
      email: this.checkoutForm.get('email').value,
    };
    const orderData = {
      amount: this.getTotal() * 100,
      firstName: this.checkoutForm.get('firstName').value,
      lastName: this.checkoutForm.get('lastName').value,
      currency_code: 'PEN',
      email: this.checkoutForm.get('email').value,
      confirm: false,
      description: 'Compra en Carpeta Digital',
      phone: this.checkoutForm.get('phone').value,
      metadata: metadata,
    };
  
    this.paymentService.postOrder(orderData).subscribe({
      next: (response: any) => {
        if (response.data && response.data.orderId) {
          callback(response.data.orderId); // <-- Uso correcto del orderId
        } else {
          this.toastrService.danger('Error al crear la orden', 'Error');
          this.router.navigate(['/site/cart']);
        }
      },
      error: (error) => {
        this.toastrService.danger('Error de conexión al crear la orden', 'Error');
        this.router.navigate(['/site/cart']);
      }
    });
  }

  getTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  // Maneja la respuesta de Culqi según el método de pago seleccionado.
  private culqiHandler(): void {
    if (Culqi.token) {
      // Si se generó un token, se trata de un pago con tarjeta.
      console.log("targeta " + Culqi.token);
      this.procesarPago(Culqi.token.id, Culqi.token.email);
      
    } else if (Culqi.order) {
      // Si se retornó un objeto order, es posible que se haya usado otro método (Yape, CIP, cuotéalo, etc.)
      const orderData = Culqi.order;
      if (orderData.paymentCode) {
        // Ejemplo: pago vía CIP (banca móvil, agente o billetera)
        //this.procesarPago(orderData.paymentCode, this.checkoutForm.get('email').value);
      } else if (orderData.cuotealo) {
        // Ejemplo: pago vía Cuotéalo
        //this.procesarPago(orderData.cuotealo, this.checkoutForm.get('email').value);
      } else if (orderData.qr) {
        // Ejemplo: pago vía QR para billeteras móviles
        console.log("qr " + orderData.qr);
        
        //this.procesarPago(orderData.qr, this.checkoutForm.get('email').value);
      } else {
        // Si no se tienen detalles específicos, se procesa como pago por orden.
        //this.procesarPago("order-" + this.orderId, this.checkoutForm.get('email').value);
      }
    } else if (Culqi.error) {
      this.toastrService.danger(Culqi.error.user_message, 'Error de pago');
      this.isProcessing = false;
    }
  }

  // Envía la información (token o código alternativo) al backend para procesar el cargo.
  procesarPago(token: string, email: string): void {
    console.log("token 2 " + token);
    console.log(this.orderId);
    
    if (!this.orderId) {
      this.toastrService.danger('Orden no válida', 'Error');
      return;
    }
    console.log("paso 1");
    

    const paymentData: PostPayment = {
      token: token,
      orderId: this.orderId,
      amount: this.getTotal() * 100,
      email: email,
      description: 'Compra en Carpeta Digital',
      userId: this.isAuthenticated ? JSON.parse(localStorage.getItem('currentUser')).id : null,
      name: (this.checkoutForm.get('firstName')?.value || '') + ' ' + (this.checkoutForm.get('lastName')?.value || ''),
      phone: this.checkoutForm.get('phone').value,
      documentIds: this.cartItems.map(item => item.id),
      guestEmail: !this.isAuthenticated ? this.checkoutForm.get('email').value : null,
      isSubscription: false,
      status: '2',
      subscriptionType: ''
    };

    this.isProcessing = true;
    console.log("paymentData" + paymentData);
    
    this.paymentService.postCharge(paymentData).subscribe({
      next: (response) => {
      
        if (response.result) {
          this.handleSuccessPayment();
          Culqi.close();
          this.router.navigate(['/site/home']);
        }
      },
      error: (error) => {
        this.handlePaymentError(error.error.data)
      }
    });
  }

  private handleSuccessPayment(): void {
    this.cartService.clearCart();
    this.toastrService.success('Pago procesado correctamente', 'Éxito');
    this.router.navigate(['/site/confirmation']);
    this.isProcessing = false;
  }

  private handlePaymentError(message: string): void {
    console.log(message);
    
    Culqi.close();
    this.toastrService.danger(message || 'Error al procesar el pago', 'Error', { duration: 10000 });
    this.router.navigate(['/site/confirmation']);
    this.isProcessing = false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    if (field.hasError('required')) return 'Campo requerido';
    if (field.hasError('email')) return 'Email inválido';
    if (field.hasError('minlength')) return 'Mínimo 3 caracteres';
    if (field.hasError('pattern')) return 'Teléfono inválido';
    return '';
  }
}
