import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../@core/backend/services/cart.service';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { PaymentData, PostPayment } from '../../@core/interfaces/payments';
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
  orderId: string;
  totalOriginal: number = 0;
  discountAmount: number = 0;
  showPromoCode: boolean = false;
  isCuotaPago: boolean = false;
  hasDocuments: boolean = false;

  constructor(
    private cartService: CartService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastrService: NbToastrService,
    private paymentService: PaymentData,
    private cuponService: CuponService
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
          firstName: userData.name,
          lastName: userData.lastname,
          email: userData.sub,
          phone: userData.phone,
        });
      }
    }

    Culqi.publicKey = environment.CULQI_PUBLIC_KEY;
    
    // Asegurar que el monto sea un entero en céntimos
    const amountInCents = this.getAmountInCents(this.total);
    
    if (amountInCents > 0) {
      Culqi.settings({
        title: 'Carpeta Digital',
        currency: 'PEN',
        description: 'Compra de ejemplo',
        amount: amountInCents, // Monto en céntimos como entero
        order: environment.ORDER,
      });
    }

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
    this.initCulqi();
  }

  private initForm(): void {
    this.checkoutForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[0-9]{8,}$/)]],
      agreement: [false], // Inicializar sin validadores, se configurarán dinámicamente
      terms: [false, [Validators.requiredTrue]],
      codigo: [{ value: '', disabled: this.promoApplied }],
    });
  }

  // Método para actualizar validadores del campo agreement según el tipo de productos
  private updateAgreementValidators(): void {
    const agreementControl = this.checkoutForm.get('agreement');
    if (agreementControl) {
      // Si hay documentos, el campo es requerido
      if (this.hasDocuments) {
        agreementControl.setValidators([Validators.requiredTrue]);
      } else {
        // Si no hay documentos, remover validadores
        agreementControl.clearValidators();
        agreementControl.setValue(true); // Marcar como true para que no bloquee el formulario
      }
      agreementControl.updateValueAndValidity();
    }
  }

  public verifyPromoCode(): void {
    const code = this.checkoutForm.get('codigo')?.value;

    if (code) {
      this.cuponService.getValidar(code).subscribe({
        next: (response) => {
          if (response.result) {

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
    
    // Detectar si es un pago de cuota PENDIENTE (no compra nueva)
    // Los pagos de cuotas tienen isSubscription: false y características específicas
    this.isCuotaPago = this.cartItems.some(item => 
      // Debe ser isSubscription: false (no es compra nueva)
      item.isSubscription === false &&
      (
        // Y tener características de pago de cuota
        (item.title && (
          item.title.includes('Cuota -') || 
          item.title.includes('Cuota ') || 
          item.title.toLowerCase().includes('cuota')
        )) ||
        (item.description && (
          item.description.includes('Pago de cuota pendiente') || 
          item.description.toLowerCase().includes('pago de cuota') ||
          item.description.toLowerCase().includes('cuota pendiente')
        )) ||
        item.isInstallment ||
        (item.transactionType && item.transactionType === 'installment')
      )
    );
    
    // Detectar si hay documentos en el carrito
    // Los documentos son productos que NO son suscripciones ni pagos de cuotas
    this.hasDocuments = this.cartItems.some(item => 
      // No es suscripción Y no es pago de cuota
      item.isSubscription !== true && 
      !this.isItemCuotaPago(item) &&
      // Es un documento (producto regular)
      (!item.title?.toLowerCase().includes('suscri') && 
       !item.title?.toLowerCase().includes('membres') &&
       !item.description?.toLowerCase().includes('suscri') &&
       !item.description?.toLowerCase().includes('membres'))
    );
    
    
    // Actualizar validadores del formulario según el tipo de productos
    this.updateAgreementValidators();
    
    // Debug: mostrar tipo de cada item
    this.cartItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        title: item.title,
        isSubscription: item.isSubscription,
        esCompra: item.isSubscription === true,
        esPagoCuota: item.isSubscription === false && (
          item.title?.toLowerCase().includes('cuota') ||
          item.description?.toLowerCase().includes('pago de cuota')
        )
      });
    });
  }

  // Método helper para detectar si un item es pago de cuota
  private isItemCuotaPago(item: any): boolean {
    return item.isSubscription === false && (
      (item.title && (
        item.title.includes('Cuota -') || 
        item.title.includes('Cuota ') || 
        item.title.toLowerCase().includes('cuota')
      )) ||
      (item.description && (
        item.description.includes('Pago de cuota pendiente') || 
        item.description.toLowerCase().includes('pago de cuota') ||
        item.description.toLowerCase().includes('cuota pendiente')
      )) ||
      item.isInstallment ||
      (item.transactionType && item.transactionType === 'installment')
    );
  }

  // getTotal(): number {

  //   return this.cartItems.reduce((sum, item) => sum + item.price, 0);
  // }

  private calculateTotal(): void {

    this.totalOriginal = this.cartItems.reduce((sum, item) => sum + item.price, 0);
    this.discountAmount = this.totalOriginal * (this.discount / 100);

    this.total = this.totalOriginal - this.discountAmount;
    
    // Asegurar que el total sea un número válido y redondear a 2 decimales
    this.total = Math.round(this.total * 100) / 100;
    
   
    

    // Actualizar el monto en los ajustes de Culqi
    // El monto debe ser un entero en céntimos
    const amountInCents = this.getAmountInCents(this.total);
    
    if (amountInCents > 0) {
      Culqi.settings({
        title: 'Carpeta Digital',
        currency: 'PEN',
        description: 'Compra de ejemplo',
        amount: amountInCents, // Monto en céntimos como entero
        order: environment.ORDER,
      });
    }
  }

  // Inicialización de Culqi: se configuran las llaves, estilos y se habilitan múltiples métodos de pago.
  private initCulqi(): void {
    window['culqi'] = this.culqiHandler.bind(this);
    Culqi.publicKey = environment.CULQI_PUBLIC_KEY;
    
    // Asegurar que el monto sea un entero en céntimos
    const amountInCents = this.getAmountInCents(this.total);
    
    if (amountInCents > 0) {
      Culqi.settings({
        title: 'Carpeta Digital',
        currency: 'PEN',
        description: 'Compra de ejemplo',
        amount: amountInCents,
        order: environment.ORDER,
      });
    }

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
        bancaMovil: false,
        agente: false,
        billetera: false,
        cuotealo: false,
      },
    });
  }

  // Se crea la orden en el backend y, al obtener el orderId, se reconfigura Culqi y se abre el checkout.
  abrirCulqi(): void {
    if (this.checkoutForm.valid) {
      // Debug: mostrar información del carrito
      
      // Validar que tenemos un total válido
      if (this.total <= 0) {
        this.toastrService.danger('El monto debe ser mayor a 0', 'Error');
        return;
      }

      // Validar datos de fraccionamiento si aplica
      if (!this.validateInstallmentData()) {
        this.toastrService.danger('Error en los datos de fraccionamiento', 'Error');
        return;
      }
      
      this.createOrder((orderId) => {
        this.orderId = orderId;
        
        // Asegurar que el monto sea un entero en céntimos y sea válido
        const amountInCents = this.getAmountInCents(this.total);
        
        if (amountInCents <= 0 || !Number.isInteger(amountInCents)) {
          this.toastrService.danger('Error en el cálculo del monto', 'Error');
          return;
        }
        
        // Actualizar configuración con el nuevo orderId
        try {
          Culqi.settings({
            title: 'Carpeta Digital',
            currency: 'PEN',
            description: 'Compra de ejemplo',
            amount: amountInCents,
            order: this.orderId,
          });
          
          // Validamos los métodos de pago disponibles antes de abrir el checkout
          Culqi.validationPaymentMethods();
          Culqi.open();
        } catch (error) {
          console.error('Error al configurar Culqi:', error);
          this.toastrService.danger('Error al inicializar el pago', 'Error');
        }
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
      amount: this.total,
      description: 'Compra en Carpeta Digital',
      phone: this.checkoutForm.get('phone').value,
      isSubscription: this.cartItems.some(item => item.isSubscription),
      status: '2',
      subscriptionType: '',

      documentIds:
        this.cartItems
          .filter(item => !item.isSubscription) // Filtra solo los documentos
          .map(item => item.id) // Mapea los IDs de los documentos
      ,
      subscriptionDetails: this.cartItems
        .filter(item => item.isSubscription) // Filtra solo las suscripciones
        .map(item => ({
          // id: item.id,
          // title: item.title,
          // price: item.price,
          subscriptionTypeId: item.id, // Agrega el ID del tipo de suscripción
          totalCuotas: item.totalCuotas,
          montoPorCuota: item.montoPorCuota,
          montoTotal: item.montoTotal,
          // materiasSeleccionadas: item.materiasSeleccionadas,
          materiasSeleccionadas: item.materiasSeleccionadas?.map(materia => ({
            materiaId: materia.id,
            opcionesIds: materia.opcionesSeleccionadas.map(opcion => opcion.id)
          }))
        })),

      guestEmail: !this.isAuthenticated ? this.checkoutForm.get('email').value : null,
      email: this.checkoutForm.get('email').value,
      codigo: this.checkoutForm.get('codigo').value,
    };
    
    // Asegurar que el monto sea un entero en céntimos
    const amountInCents = this.getAmountInCents(this.total);
    
    const orderData = {
      amount: amountInCents,
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
          callback(response.data.orderId); // Uso correcto del orderId
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

  // getTotal(): number {
  //   return this.cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  // }

  // Maneja la respuesta de Culqi según el método de pago seleccionado.
  private culqiHandler(): void {
    if (Culqi.token) {
      // Si se generó un token, se trata de un pago con tarjeta.
      this.procesarPago(Culqi.token.id, Culqi.token.email);

      // } else if (Culqi.order) {
      //   // Si se retornó un objeto order, es posible que se haya usado otro método (Yape, CIP, cuotéalo, etc.)
      //   const orderData = Culqi.order;
      //   if (orderData.paymentCode) {
      //     // Ejemplo: pago vía CIP (banca móvil, agente o billetera)
      //     //this.procesarPago(orderData.paymentCode, this.checkoutForm.get('email').value);
      //   } else if (orderData.cuotealo) {
      //     // Ejemplo: pago vía Cuotéalo
      //     //this.procesarPago(orderData.cuotealo, this.checkoutForm.get('email').value);
      //   } else if (orderData.qr) {
      //     // Ejemplo: pago vía QR para billeteras móviles

      //     //this.procesarPago(orderData.qr, this.checkoutForm.get('email').value);
      //   } else {
      //     // Si no se tienen detalles específicos, se procesa como pago por orden.
      //     //this.procesarPago("order-" + this.orderId, this.checkoutForm.get('email').value);
      //   }
    } else if (Culqi.error) {
      this.toastrService.danger(Culqi.error.user_message, 'Error de pago');
      this.isProcessing = false;
    }
  }

  // Envía la información (token o código alternativo) al backend para procesar el cargo.
  procesarPago(token: string, email: string): void {
    if (!this.orderId) {
      this.toastrService.danger('Orden no válida', 'Error');
      return;
    }

    // Determinar el tipo de pago y encontrar el item correspondiente
    let subscriptionItem = null;
    let isInstallmentPayment = false;

    if (this.isCuotaPago) {
      // Es un pago de cuota pendiente (isSubscription: false)
      const cuotaItem = this.cartItems.find(item => 
        item.isSubscription === false &&
        (
          (item.title && item.title.toLowerCase().includes('cuota')) ||
          (item.description && item.description.toLowerCase().includes('pago de cuota'))
        )
      );
      
      if (cuotaItem) {
        subscriptionItem = cuotaItem;
        isInstallmentPayment = true;
      }
    } else {
      // Es una compra nueva de suscripción (isSubscription: true)
      subscriptionItem = this.cartItems.find(item => item.isSubscription === true);
    }


    // Asegurar que el monto sea un entero en céntimos
    const amountInCents = this.getAmountInCents(this.total);

    const paymentData: PostPayment & { subscriptionDetails?: any } = {
      token: token,
      orderId: this.orderId,
      amount: amountInCents,
      email: email,
      description: 'Compra en Carpeta Digital',
      userId: this.isAuthenticated ? JSON.parse(localStorage.getItem('currentUser')).id : null,
      name: (this.checkoutForm.get('firstName')?.value || '') + ' ' + (this.checkoutForm.get('lastName')?.value || ''),
      phone: this.checkoutForm.get('phone').value,
      documentIds: this.cartItems.map(item => item.id),
      guestEmail: !this.isAuthenticated ? this.checkoutForm.get('email').value : null,
      isSubscription: !!subscriptionItem && subscriptionItem.isSubscription === true, // Solo true para compras nuevas
      status: '2',
      subscriptionType: '',
      transactionType: isInstallmentPayment ? 'installment' : 'purchase',
      idPayment: isInstallmentPayment ? this.cartItems[0].id : '',
      codigo: this.checkoutForm.get('codigo').value,
      ...(subscriptionItem && subscriptionItem.isSubscription === true && {
        // Solo incluir subscriptionDetails para compras nuevas de suscripción
        subscriptionDetails: {
          subscriptionTypeId: subscriptionItem.id,
          totalCuotas: subscriptionItem.totalCuotas,
          montoPorCuota: subscriptionItem.montoPorCuota,
          montoTotal: subscriptionItem.montoTotal,
          materiasSeleccionadas: subscriptionItem.materiasSeleccionadas?.map(materia => ({
            materiaId: materia.id,
            opcionesIds: materia.opcionesSeleccionadas.map(opcion => opcion.id)
          }))
        }
      })

    };

    this.isProcessing = true;

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

  // Método para obtener los errores de validación del formulario
  getFormErrors(): string[] {
    const errors: string[] = [];
    
    if (this.checkoutForm.get('firstName')?.invalid) {
      if (this.checkoutForm.get('firstName')?.hasError('required')) {
        errors.push('El nombre es requerido');
      } else if (this.checkoutForm.get('firstName')?.hasError('minlength')) {
        errors.push('El nombre debe tener al menos 3 caracteres');
      }
    }
    
    if (this.checkoutForm.get('lastName')?.invalid) {
      if (this.checkoutForm.get('lastName')?.hasError('required')) {
        errors.push('El apellido es requerido');
      } else if (this.checkoutForm.get('lastName')?.hasError('minlength')) {
        errors.push('El apellido debe tener al menos 3 caracteres');
      }
    }
    
    if (this.checkoutForm.get('email')?.invalid) {
      if (this.checkoutForm.get('email')?.hasError('required')) {
        errors.push('El correo electrónico es requerido');
      } else if (this.checkoutForm.get('email')?.hasError('email')) {
        errors.push('El correo electrónico debe tener un formato válido');
      }
    }
    
    if (this.checkoutForm.get('phone')?.invalid) {
      if (this.checkoutForm.get('phone')?.hasError('required')) {
        errors.push('El teléfono es requerido');
      } else if (this.checkoutForm.get('phone')?.hasError('pattern')) {
        errors.push('El teléfono debe tener un formato válido');
      }
    }
    
    if (this.hasDocuments && this.checkoutForm.get('agreement')?.invalid) {
      errors.push('Debes confirmar que entiendes las condiciones de entrega del documento');
    }
    
    if (this.checkoutForm.get('terms')?.invalid) {
      errors.push('Debes aceptar los términos y condiciones');
    }
    
    return errors;
  }

  // Método para manejar el clic en el botón cuando está deshabilitado
  onConfirmClick(): void {
    if (this.checkoutForm.valid && !this.isProcessing) {
      this.abrirCulqi();
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.checkoutForm.markAllAsTouched();
      
      const errors = this.getFormErrors();
      if (errors.length > 0) {
        const errorMessage = errors.join('\n• ');
        this.toastrService.warning(
          `Por favor, completa los siguientes campos:\n• ${errorMessage}`,
          'Formulario incompleto',
          { duration: 8000 }
        );
      }
    }
  }

  // abrirCulqi(): void {
  //   Culqi.open();
  // }

  culqi(): void {
    if (Culqi.token) {
      const token = Culqi.token.id;
      const email = Culqi.token.email;
      this.procesarPago(token, email);
    } else {
      console.error(Culqi.error);
    }
  }

  togglePromoCode(): void {
    this.showPromoCode = !this.showPromoCode; // Alterna la visibilidad
  }

  // Función auxiliar para calcular el monto en céntimos de forma segura
  private getAmountInCents(amount: number): number {
    // Asegurar que el monto sea un número válido
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      console.error('Monto inválido:', amount);
      return 0;
    }
    
    // Redondear a 2 decimales primero, luego convertir a céntimos
    const roundedAmount = Math.round(amount * 100) / 100;
    const amountInCents = Math.round(roundedAmount * 100);
    
    
    return amountInCents;
  }

  // Validar datos de fraccionamiento
  private validateInstallmentData(): boolean {

    if (!this.isCuotaPago) {
      return true; // No es pago fraccionado, está bien
    }

    // Para pagos de cuotas PENDIENTES (isSubscription: false)
    // Buscar el item de pago de cuota
    const cuotaItem = this.cartItems.find(item => 
      item.isSubscription === false &&
      (
        (item.title && item.title.toLowerCase().includes('cuota')) ||
        (item.description && item.description.toLowerCase().includes('pago de cuota'))
      )
    );

    if (cuotaItem) {
      
      // Para pagos de cuotas pendientes, solo validar que tengamos un monto válido
      if (this.total > 0) {
        return true;
      } else {
        console.error('Monto de cuota pendiente inválido');
        return false;
      }
    }

    // Si no es cuota pendiente, podría ser compra nueva de suscripción fraccionada
    // Buscar item de suscripción tradicional (isSubscription: true)
    const subscriptionItem = this.cartItems.find(item => item.isSubscription === true);
    
    if (!subscriptionItem) {
      console.error('No se encontró item de suscripción ni de cuota pendiente');
      return false;
    }


    // Validar que los datos de cuotas sean correctos si están presentes
    const { totalCuotas, montoPorCuota, montoTotal } = subscriptionItem;
    
    // Si no hay datos de cuotas, asumir que es un pago único válido
    if (!totalCuotas && !montoPorCuota && !montoTotal) {
      return true;
    }

    // Si hay datos de cuotas, validarlos
    if (totalCuotas && totalCuotas <= 0) {
      console.error('Total de cuotas inválido:', totalCuotas);
      return false;
    }

    if (montoPorCuota && montoPorCuota <= 0) {
      console.error('Monto por cuota inválido:', montoPorCuota);
      return false;
    }

    if (montoTotal && montoTotal <= 0) {
      console.error('Monto total inválido:', montoTotal);
      return false;
    }

    // Validar coherencia solo si tenemos todos los datos
    if (totalCuotas && montoPorCuota && montoTotal) {
      const calculatedTotal = montoPorCuota * totalCuotas;
      const tolerance = 0.01; // 1 centavo de tolerancia
      
      if (Math.abs(calculatedTotal - montoTotal) > tolerance) {
        console.error(`Inconsistencia en cálculo de cuotas: ${montoPorCuota} x ${totalCuotas} = ${calculatedTotal}, pero montoTotal = ${montoTotal}`);
        return false;
      }
    }

    return true;
  }

 
}

