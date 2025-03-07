import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../@core/backend/services/cart.service';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { PaymentData } from '../../@core/interfaces/payments';
import { environment } from '../../../environments/environment';
import { CuponService } from '../../@core/backend/services/cupon.service';

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
  discount: number = 0;
  total: number = 0;
  promoApplied: boolean = false;

  constructor(
    private cartService: CartService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastrService: NbToastrService,
    private paymentService: PaymentData,
    private cuponService: CuponService,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadAuthState();
    this.loadCartItems();
    this.calculateTotal();

    if (this.isAuthenticated) {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);

        this.checkoutForm.patchValue({
          fullName: `${userData.name} ${userData.lastname}`,
          email: userData.sub,
        });
      }
    }

    Culqi.publicKey = environment.CULQI_PUBLIC_KEY;
    Culqi.settings({
      title: 'Carpeta Digital',
      currency: 'PEN',
      description: 'Compra de ejemplo',
      amount: this.total * 100, // Monto en céntimos
      order: environment.ORDER,
    });

    console.log("Culqi", Culqi);
    

    Culqi.options({
      lang: "auto",
      installments: false,
      style: {
        logo: 'https://firebasestorage.googleapis.com/v0/b/cd-store-529c3.firebasestorage.app/o/LOGOTIPO_CD.png?alt=media&token=4d5a070b-f2d9-45ed-90b8-edc7921f0eaf', // URL del logo de tu tienda
        maincolor: '#1a73e8', // Color principal
        buttontext: 'Pagar', // Texto del botón
        buttoncolor: '#1a73e8', // Color del botón
        titlecolor: '#000000', // Color del título
        desctextcolor: '#000000', // Color de la descripción
        amountcolor: '#000000' // Color del monto
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
    window['culqi'] = this.culqi.bind(this);
  }

  private initForm(): void {
    this.checkoutForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[0-9]{8,}$/)]],
      agreement: [false, [Validators.requiredTrue]],
      terms: [false, [Validators.requiredTrue]],
      codigo: [{ value: '', disabled: this.promoApplied }],
    });
  }

  public verifyPromoCode(): void {
    const code = this.checkoutForm.get('codigo')?.value;

    console.log("code", code);
    
    if (code) {
      this.cuponService.getValidar(code).subscribe({
        next: (response) => {
          if (response.result) {
            console.log("response", response);
            
            this.discount = response.data.descuento;
            this.calculateTotal(); // Recalcular el total después de aplicar el descuento
            this.toastrService.success('Código promocional aplicado', 'Éxito');
          } else {
            this.discount = 0;
            this.calculateTotal(); // Recalcular el total si el código no es válido
            this.toastrService.warning('Código promocional no válido', 'Advertencia');
          }
        },
        error: () => {
          this.discount = 0;
          this.calculateTotal(); // Recalcular el total en caso de error
          this.toastrService.danger('Error al verificar el código promocional', 'Error');
        }
      });
    } else {
      this.discount = 0;
      this.calculateTotal(); // Recalcular el total si no se ingresa un código
      this.toastrService.warning('Ingrese un código promocional', 'Advertencia');
    }
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

  // getTotal(): number {
  //   console.log("total");
    
  //   return this.cartItems.reduce((sum, item) => sum + item.price, 0);
  // }

  private calculateTotal(): void {
    console.log("calculateTotal");
    
    const total = this.cartItems.reduce((sum, item) => sum + item.price, 0);
    const discountAmount = total * (this.discount / 100);
    this.total = total - discountAmount;

    // Actualizar el monto en los ajustes de Culqi
  Culqi.settings({
    title: 'Carpeta Digital',
    currency: 'PEN',
    description: 'Compra de ejemplo',
    amount: this.total * 100, // Monto en céntimos
    order: environment.ORDER,
  });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);

    if (field.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (field.hasError('email')) {
      return 'Ingrese un email válido';
    }
    if (field.hasError('minlength')) {
      return 'Debe tener al menos 3 caracteres';
    }
    if (field.hasError('pattern')) {
      return 'Ingrese un número de teléfono válido';
    }
    return '';
  }

  abrirCulqi(): void {
    Culqi.open();
  }

  culqi(): void {
    if (Culqi.token) {
      const token = Culqi.token.id;
      const email = Culqi.token.email;
      this.procesarPago(token, email);
    } else {
      console.error(Culqi.error);
    }
  }

  procesarPago(token: string, email: string): void {

    const totalAmount = this.total * 100; // Monto en céntimos

    // Validar el monto
    if (totalAmount <= 0) {
      this.toastrService.danger('El monto total debe ser mayor a cero', 'Error');
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true; // Mostrar el spinner
    
    const paymentData = {
      token: token,
      amount: totalAmount, // Monto en céntimos
      email: email,
      description: 'Compra de ejemplo',
      userId: this.isAuthenticated ? JSON.parse(localStorage.getItem('currentUser') || '{}').id : null,
      name: this.checkoutForm.get('fullName').value,
      phone: this.checkoutForm.get('phone').value,
      isSubscription: false,
      status: '2',
      subscriptionType: '', // Agrega la propiedad subscriptionType
      documentIds: this.cartItems.map(item => item.id),
      guestEmail: this.checkoutForm.get('email').value,
      codigo: this.checkoutForm.get('codigo').value,

    };
  
    this.paymentService.chargePayment(paymentData).subscribe({
      next: (response) => {
        if (response.result) {
          this.cartService.clearCart();
          this.toastrService.success('Compra realizada con éxito', 'Éxito');
          Culqi.close();
          this.router.navigate(['/site/home']);
        } else {
          this.toastrService.danger('Error al procesar la compra', 'Error');
        }
        this.isProcessing = false;
      },
      error: (error) => {
        this.toastrService.danger('Error al procesar la compra', 'Error');
        this.isProcessing = false;
      },
    });
  }
}
