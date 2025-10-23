import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../@core/backend/services/cart.service';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { PaymentData, PostPayment } from '../../@core/interfaces/payments';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CuponService } from '../../@core/backend/services/cupon.service';
import { IPayPalConfig } from 'ngx-paypal';

declare var Culqi: any;

@Component({
  selector: 'ngx-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  isAuthenticated: boolean = false;
  showPaymentModal: boolean = false;
  selectedPaymentMethod: 'culqi' | 'paypal' | null = null;
  // Control visibility of the PayPal section: hidden until user selects PayPal
  showPaypalSection: boolean = false;
  // PayPal currency: force to USD because PayPal integration doesn't accept PEN for this account
  paypalCurrency: 'USD' = 'USD';
  // Latest exchange rate (PEN per USD) fetched from backend
  latestExchangeRate: number | null = null;
  // Converted total in USD (computed when user selects USD)
  convertedTotalUSD: number | null = null;
  // Abre el modal de selección de método de pago
  openPaymentModal(): void {
    // Enforce that terms are accepted and, when applicable, agreement is checked
    const termsAccepted = this.checkoutForm?.get('terms')?.value === true;
    const agreementAccepted = !this.hasDocuments || (this.checkoutForm?.get('agreement')?.value === true);
    if (!termsAccepted || !agreementAccepted) {
      this.checkoutForm.markAllAsTouched();
      const msgs = [];
      if (!termsAccepted) msgs.push('Debes aceptar los términos y condiciones');
      if (!agreementAccepted && this.hasDocuments) msgs.push('Debes confirmar que entiendes las condiciones de entrega del documento');
      this.toastrService.warning(msgs.join('. '), 'Faltan confirmaciones');
      return;
    }

    this.showPaymentModal = true;
    // esperar al render y poner foco en la primera tarjeta
    setTimeout(() => {
      const first = document.querySelector('.payment-card') as HTMLElement;
      if (first) {
        first.focus();
      }
    }, 50);
    // Añadir listener ESC
    window.addEventListener('keydown', this.handleModalKeydown);
  }

  // Cierra el modal
  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedPaymentMethod = null;
    window.removeEventListener('keydown', this.handleModalKeydown);
  }

  // Selecciona el método de pago y ejecuta el flujo correspondiente
  selectPaymentMethod(method: 'culqi' | 'paypal'): void {
    this.selectedPaymentMethod = method;
    this.showPaymentModal = false;
    window.removeEventListener('keydown', this.handleModalKeydown);
    if (method === 'culqi') {
      this.abrirCulqi();
    } else if (method === 'paypal') {
      // Mostrar la sección de PayPal solo cuando el usuario la selecciona
      this.showPaypalSection = true;
      // Inicializar configuración de PayPal con la moneda seleccionada
      this.initPayPalConfig();
      this.toastrService.info('Seleccionaste PayPal. Completa el pago usando el botón mostrado.', 'Pago PayPal');
      // Opcional: hacer scroll al botón PayPal
      setTimeout(() => {
        const paypalSection = document.querySelector('.paypal-section');
        if (paypalSection) {
          paypalSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }

  // Maneja teclado dentro del modal (ESC para cerrar)
  private handleModalKeydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' || ev.key === 'Esc') {
      this.closePaymentModal();
    }
    if (ev.key === 'Enter') {
      const active = document.activeElement as HTMLElement;
      if (active && active.classList.contains('payment-card')) {
        // simular click en la tarjeta activa
        active.click();
      }
    }
  }
  // Propiedades ya declaradas arriba, se eliminan duplicados

  // ...existing code...

  onPaypalSuccess(event: any) {
    // Aquí puedes procesar el pago exitoso, guardar la orden, mostrar mensaje, etc.
    console.log('Pago PayPal exitoso:', event);
    alert('¡Pago realizado con éxito!');
    // Aquí podrías llamar a tu backend para registrar la orden
  }

  onPaypalError(error: any) {
    // Aquí puedes manejar el error de pago
    console.error('Error en pago PayPal:', error);
    alert('Hubo un error al procesar el pago con PayPal. Intenta nuevamente.');
  }
  cartItems: any[] = [];
  checkoutForm: FormGroup;
  isProcessing: boolean = false;
  discount: number = 0;
  // If a coupon provides a fixed amount discount (abono), store it here.
  discountFixedAmount: number = 0;
  total: number = 0;
  promoApplied: boolean = false;
  orderId: string;
  totalOriginal: number = 0;
  discountAmount: number = 0;
  showPromoCode: boolean = false;
  isCuotaPago: boolean = false;
  hasDocuments: boolean = false;
  // Nuevas propiedades para descuentos por situación
  situationDiscounts: { situationName: string; documentCount: number; discountPercentage: number; totalDiscount: number; nivel?: string; materia?: string }[] = [];
  totalSituationDiscounts: number = 0;
  // Nuevas propiedades para descuentos por reforzamiento
  reforzamientoDiscounts: { categoryName: string; materia: string; documentCount: number; discountPercentage: number; totalDiscount: number }[] = [];
  totalReforzamientoDiscounts: number = 0;
  // Nuevas propiedades para descuentos por PLAN_LECTOR
  planLectorDiscounts: { categoryName: string; nivel: string; documentCount: number; discountPercentage: number; totalDiscount: number }[] = [];
  totalPlanLectorDiscounts: number = 0;

  constructor(
    private cartService: CartService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastrService: NbToastrService,
    private paymentService: PaymentData,
    private http: HttpClient,
    private cuponService: CuponService
  ) {
    this.initForm();
  }

  payPalConfig?: IPayPalConfig;
  ngOnInit(): void {
    this.loadAuthState();
    this.loadCartItems();
    this.calculateTotal();
    this.initPayPalConfig();

    if (this.isAuthenticated) {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        this.checkoutForm.patchValue({
          firstName: userData.name,
          lastName: userData.lastname,
          email: userData.email,
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
    // Initialize the checkout form with the controls used across the component
    this.checkoutForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9+\s()\-]+$')]],
      codigo: [''],
      agreement: [false],
      terms: [false]
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
    // Calcular subtotal original
    this.totalOriginal = this.cartItems.reduce((sum, item) => sum + item.price, 0);
    
    // Calcular descuentos por situación primero
    this.situationDiscounts = this.cartService.getSituationDiscounts();
    this.totalSituationDiscounts = this.situationDiscounts.reduce((sum, discount) => sum + discount.totalDiscount, 0);
    
    // Calcular descuentos por reforzamiento
    this.reforzamientoDiscounts = this.cartService.getReforzamientoDiscounts();
    this.totalReforzamientoDiscounts = this.reforzamientoDiscounts.reduce((sum, discount) => sum + discount.totalDiscount, 0);
    
    // Calcular descuentos por PLAN_LECTOR
    this.planLectorDiscounts = this.cartService.getPlanLectorDiscounts();
    this.totalPlanLectorDiscounts = this.planLectorDiscounts.reduce((sum, discount) => sum + discount.totalDiscount, 0);
    
    // Calcular subtotal después de todos los descuentos automáticos
    const subtotalConDescuentosAutomaticos = this.totalOriginal - this.totalSituationDiscounts - this.totalReforzamientoDiscounts - this.totalPlanLectorDiscounts;
    
    // Aplicar descuento por código promocional sobre el subtotal ya descontado
    // Soportar dos modos: porcentaje (this.discount > 0) o abono fijo (this.discountFixedAmount > 0)
    if (this.discountFixedAmount && this.discountFixedAmount > 0) {
      // Fixed amount discount (abono)
      this.discountAmount = Math.min(this.discountFixedAmount, subtotalConDescuentosAutomaticos);
    } else {
      this.discountAmount = subtotalConDescuentosAutomaticos * (this.discount / 100);
    }
    
    // Calcular total final
    this.total = subtotalConDescuentosAutomaticos - this.discountAmount;
    
    // Asegurar que el total sea un número válido y redondear a 2 decimales
    this.total = Math.round(this.total * 100) / 100;
    
    console.log('Cálculo de totales:', {
      subtotal: this.totalOriginal,
      descuentosSituacion: this.totalSituationDiscounts,
      descuentosReforzamiento: this.totalReforzamientoDiscounts,
      descuentosPlanLector: this.totalPlanLectorDiscounts,
      subtotalConDescuentosAutomaticos: subtotalConDescuentosAutomaticos,
      porcentajeCodigoPromocional: this.discount,
      descuentoPromocional: this.discountAmount,
      totalFinal: this.total,
      situationDiscounts: this.situationDiscounts,
      reforzamientoDiscounts: this.reforzamientoDiscounts,
      planLectorDiscounts: this.planLectorDiscounts
    });

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

  // Verifica el código promocional usando el servicio de cupones
  verifyPromoCode(): void {
    const code = this.checkoutForm.get('codigo')?.value;
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      this.toastrService.warning('Ingresa un código promocional', 'Código vacío');
      return;
    }

    this.cuponService.getValidar(code.trim()).subscribe({
      next: (resp: any) => {
        if (!resp) {
          this.toastrService.warning('Código inválido o no encontrado', 'Código promocional');
          return;
        }

        if (resp.result && resp.data) {
          const data = resp.data as any;
          // Si el cupon trae 'descuento' lo interpretamos como porcentaje
          if (data.descuento && data.descuento > 0) {
            this.discount = Number(data.descuento);
            this.discountFixedAmount = 0;
          } else if (data.abono && data.abono > 0) {
            // Abono fijo en moneda local (PEN)
            this.discountFixedAmount = Number(data.abono);
            this.discount = 0;
          } else {
            this.toastrService.warning('Cupón válido pero sin valor de descuento', 'Código promocional');
            return;
          }

          this.promoApplied = true;
          // Recalcular totales
          this.calculateTotal();

          this.toastrService.success('Código promocional aplicado', '¡Éxito');
        } else {
          this.toastrService.warning('Código promocional inválido o expirado', 'Código promocional');
        }
      },
      error: (err) => {
        console.error('Error validando cupón:', err);
        this.toastrService.danger('Error al verificar el código promocional', 'Error');
      }
    });
  }

  // Inicialización de Culqi: se configuran las llaves, estilos y se habilitan múltiples métodos de pago.
  private initCulqi(): void {
    try {
      // Verificar que Culqi esté disponible
      if (typeof Culqi === 'undefined') {
        console.error('❌ Culqi no está disponible');
        this.toastrService.danger('Error: Sistema de pagos no disponible', 'Error de configuración');
        return;
      }

      // Verificar que tengamos la clave pública
      if (!environment.CULQI_PUBLIC_KEY) {
        console.error('❌ Clave pública de Culqi no configurada');
        this.toastrService.danger('Error: Configuración de pagos incompleta', 'Error de configuración');
        return;
      }

      window['culqi'] = this.culqiHandler.bind(this);
      Culqi.publicKey = environment.CULQI_PUBLIC_KEY;
      
      // Agregar listener para cuando se cierre Culqi manualmente por el usuario
      window['culqiclose'] = () => {
        console.log('🚪 Modal de Culqi cerrado por el usuario');
        // Solo desactivar procesamiento si no hay una orden o token válidos
        // (es decir, si el usuario cancela antes de completar el pago)
        if (this.isProcessing && !Culqi.order && !Culqi.token) {
          console.log('⚠️ Desactivando procesamiento por cancelación del usuario');
          this.isProcessing = false;
          this.toastrService.info('Pago cancelado por el usuario', 'Cancelado');
        }
      };
      
      // Asegurar que el monto sea un entero en céntimos
      const amountInCents = this.getAmountInCents(this.total);
      
      if (amountInCents > 0) {
        // Preparar configuración inicial
        const culqiSettings: any = {
          title: 'Carpeta Digital',
          currency: 'PEN',
          description: 'Compra en Carpeta Digital',
          amount: amountInCents,
          order: environment.ORDER,
        };

        // Agregar datos del cliente si están disponibles en el formulario
        if (this.checkoutForm.valid) {
          const formValues = this.checkoutForm.value;
          culqiSettings.client = {
            first_name: formValues.firstName,
            last_name: formValues.lastName,
            email: formValues.email,
            phone_number: formValues.phone
          };
        }

        Culqi.settings(culqiSettings);
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

      console.log('✅ Culqi inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar Culqi:', error);
      this.toastrService.danger('Error al configurar el sistema de pagos', 'Error de configuración');
    }
  }

  // Se crea la orden en el backend y, al obtener el orderId, se reconfigura Culqi y se abre el checkout.
  abrirCulqi(): void {
    if (this.checkoutForm.valid) {
      // Verificar configuración de Culqi
      if (!this.validateCulqiConfiguration()) {
        this.toastrService.danger('Sistema de pagos no disponible. Intenta recargar la página.', 'Error');
        return;
      }

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

        // Validar que el orderId sea válido
        if (!this.orderId || this.orderId.trim() === '') {
          this.toastrService.danger('Error al generar la orden de pago', 'Error');
          return;
        }
        
        // Actualizar configuración con el nuevo orderId
        try {
          // Obtener nombre y apellido del formulario
          const firstName = this.checkoutForm.get('firstName')?.value || '';
          const lastName = this.checkoutForm.get('lastName')?.value || '';
          const email = this.checkoutForm.get('email')?.value || '';
          const phone = this.checkoutForm.get('phone')?.value || '';
          
          // Configurar Culqi con datos validados
          Culqi.settings({
            title: 'Carpeta Digital',
            currency: 'PEN',
            description: 'Compra en Carpeta Digital',
            amount: amountInCents,
            order: this.orderId,
            // Datos del cliente
            client: {
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone_number: phone
            }
          });

          console.log('💰 Configuración de pago:', {
            amount: amountInCents,
            orderId: this.orderId,
            total: this.total,
            publicKey: Culqi.publicKey ? 'Configurada' : 'No configurada',
            client: {
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone_number: phone
            }
          });
          
          // Validamos los métodos de pago disponibles antes de abrir el checkout
          Culqi.validationPaymentMethods();
          
          // Abrir el checkout de Culqi
          Culqi.open();
          
          console.log('🚀 Checkout de Culqi abierto');
        } catch (error) {
          console.error('❌ Error al configurar Culqi:', error);
          this.toastrService.danger('Error al inicializar el pago. Intenta nuevamente.', 'Error');
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
      // Campos para validación de descuentos en el backend
      subtotalOriginal: this.totalOriginal,
      totalSituationDiscounts: this.totalSituationDiscounts,
      totalReforzamientoDiscounts: this.totalReforzamientoDiscounts,
      totalPlanLectorDiscounts: this.totalPlanLectorDiscounts,
      totalAutomaticDiscounts: this.totalSituationDiscounts + this.totalReforzamientoDiscounts + this.totalPlanLectorDiscounts,
      
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
    console.log('📱 Culqi Handler ejecutado:', {
      token: Culqi.token,
      order: Culqi.order,
      error: Culqi.error
    });

    if (Culqi.token) {
      // Si se generó un token, se trata de un pago con tarjeta.
      console.log('💳 Procesando pago con tarjeta...');
      
      // Cerrar Culqi inmediatamente para mejor UX también en tarjetas
      console.log('💳 Cerrando checkout de Culqi para tarjeta...');
      Culqi.close();
      
      // Mostrar mensaje informativo al usuario
      this.toastrService.info('Procesando pago con tarjeta. Este proceso puede tardar unos segundos...', 'Procesando', { duration: 8000 });
      
      this.procesarPago(Culqi.token.id, Culqi.token.email);

    } else if (Culqi.order) {
      // Si se retornó un objeto order, puede ser Yape u otro método
      console.log('📱 Procesando pago con orden (Yape/Otros):', Culqi.order);
      
      // Para Yape y otros métodos que retornan order
      if (Culqi.order.object === 'order') {
        // Usar el ID de la orden como token alternativo
        const orderToken = Culqi.order.id;
        const email = this.checkoutForm.get('email')?.value || 'no-email@example.com';
        
        console.log('📱 Procesando con orderToken:', orderToken);
        console.log('📱 Cerrando checkout de Culqi para Yape...');
        
        // Cerrar Culqi inmediatamente para mejor UX
        Culqi.close();
        
        // Mostrar mensaje informativo al usuario
        this.toastrService.info('Procesando pago con Yape. Este proceso puede tardar unos segundos...', 'Procesando', { duration: 8000 });
        
        this.procesarPago(orderToken, email);
      } else {
        console.error('❌ Tipo de orden no reconocido:', Culqi.order);
        this.toastrService.danger('Tipo de pago no soportado', 'Error de pago');
        this.isProcessing = false;
        Culqi.close();
      }

    } else if (Culqi.error) {
      console.error('❌ Error de Culqi:', Culqi.error);
      
      // Extraer mensaje de error más específico
      let errorMessage = 'Error en el procesamiento del pago';
      
      if (Culqi.error) {
        if (Culqi.error.user_message) {
          errorMessage = Culqi.error.user_message;
        } else if (Culqi.error.merchant_message) {
          errorMessage = Culqi.error.merchant_message;
        } else if (Culqi.error.message) {
          errorMessage = Culqi.error.message;
        } else if (typeof Culqi.error === 'string') {
          errorMessage = Culqi.error;
        }
      }

      console.log('💬 Mensaje de error procesado:', errorMessage);
      
      // Navegar a la página de error con el mensaje
      this.router.navigate(['/site/purchase-confirmation'], {
        queryParams: {
          error: 'true',
          errorMessage: errorMessage,
          email: this.checkoutForm.get('email')?.value || '',
          name: `${this.checkoutForm.get('firstName')?.value || ''} ${this.checkoutForm.get('lastName')?.value || ''}`.trim()
        }
      });
      
      this.isProcessing = false;
      Culqi.close();
      
    } else {
      // Si el usuario cierra el modal sin completar el pago
      console.log('⚠️ Modal cerrado sin respuesta de Culqi');
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
      firstName: this.checkoutForm.get('firstName')?.value || '',
      lastName: this.checkoutForm.get('lastName')?.value || '',
      phone: this.checkoutForm.get('phone').value,
      documentIds: this.cartItems.map(item => item.id),
      guestEmail: !this.isAuthenticated ? this.checkoutForm.get('email').value : null,
      isSubscription: !!subscriptionItem && subscriptionItem.isSubscription === true, // Solo true para compras nuevas
      status: '2',
      subscriptionType: '',
      transactionType: isInstallmentPayment ? 'installment' : 'purchase',
      idPayment: isInstallmentPayment ? this.cartItems[0].id : '',
      codigo: this.checkoutForm.get('codigo').value,
      // Campos para validación de descuentos en el backend
      subtotalOriginal: this.totalOriginal,
      totalSituationDiscounts: this.totalSituationDiscounts,
      totalReforzamientoDiscounts: this.totalReforzamientoDiscounts,
      totalPlanLectorDiscounts: this.totalPlanLectorDiscounts,
      totalAutomaticDiscounts: this.totalSituationDiscounts + this.totalReforzamientoDiscounts + this.totalPlanLectorDiscounts,
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
        }
      },
      error: (error) => {
        this.handlePaymentError(error.error.data)
      }
    });
  }

  private handleSuccessPayment(): void {
    this.cartService.clearCart();
    
    // Determinar si es suscripción
    const isSubscription = this.cartItems.some(item => item.isSubscription === true);
    
    // Navegar a la nueva vista de confirmación con parámetros
    this.router.navigate(['/site/purchase-confirmation'], {
      queryParams: {
        success: 'true',
        isSubscription: isSubscription,
        transactionType: this.isCuotaPago ? 'installment' : 'purchase',
        email: this.checkoutForm.get('email')?.value || '',
        name: `${this.checkoutForm.get('firstName')?.value || ''} ${this.checkoutForm.get('lastName')?.value || ''}`.trim()
      }
    });
    
    this.isProcessing = false;
  }

  private handlePaymentError(message: string): void {
    Culqi.close();
    
    // Extraer el user_message del JSON de error si está presente
    let displayMessage = 'Error al procesar el pago';
    
    if (message) {
      try {
        // Buscar el JSON dentro del string del mensaje
        const jsonMatch = message.match(/\{.*\}/);
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0]);
          if (errorData.user_message) {
            displayMessage = errorData.user_message;
          } else if (errorData.merchant_message) {
            displayMessage = errorData.merchant_message;
          }
        } else {
          // Si no hay JSON, usar el mensaje tal como viene
          displayMessage = message;
        }
      } catch (error) {
        // Si hay error al parsear, usar el mensaje original
        displayMessage = message;
      }
    }
    
    // Navegar a la nueva vista de confirmación con error
    this.router.navigate(['/site/purchase-confirmation'], {
      queryParams: {
        error: 'true',
        errorMessage: displayMessage,
        email: this.checkoutForm.get('email')?.value || '',
        name: `${this.checkoutForm.get('firstName')?.value || ''} ${this.checkoutForm.get('lastName')?.value || ''}`.trim()
      }
    });
    
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
      console.error('❌ Monto inválido:', amount);
      return 0;
    }

    // Validar que el monto no sea demasiado pequeño
    if (amount < 1) {
      console.error('❌ Monto demasiado pequeño:', amount);
      return 0;
    }

    // Validar que el monto no sea demasiado grande (límite de Culqi)
    if (amount > 99999999) { // 999,999.99 PEN
      console.error('❌ Monto demasiado grande:', amount);
      return 0;
    }
    
    // Redondear a 2 decimales primero, luego convertir a céntimos
    const roundedAmount = Math.round(amount * 100) / 100;
    const amountInCents = Math.round(roundedAmount * 100);
    
    // Validar que el resultado sea un entero válido
    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
      console.error('❌ Error al convertir a céntimos:', {
        original: amount,
        rounded: roundedAmount,
        cents: amountInCents
      });
      return 0;
    }

    console.log('💰 Monto convertido:', {
      original: amount,
      rounded: roundedAmount,
      cents: amountInCents
    });
    
    return amountInCents;
  }

  // Método para verificar que Culqi esté disponible y configurado correctamente
  private validateCulqiConfiguration(): boolean {
    // Verificar que Culqi esté disponible globalmente
    if (typeof Culqi === 'undefined') {
      console.error('❌ Culqi no está disponible. Verifica que el script esté cargado.');
      return false;
    }

    // Verificar que tengamos la clave pública
    if (!environment.CULQI_PUBLIC_KEY) {
      console.error('❌ Clave pública de Culqi no configurada en environment');
      return false;
    }

    // Verificar que Culqi tenga la clave pública configurada
    if (!Culqi.publicKey) {
      console.error('❌ Culqi no tiene clave pública configurada');
      return false;
    }

    // Verificar que la clave coincida con la del environment
    if (Culqi.publicKey !== environment.CULQI_PUBLIC_KEY) {
      console.warn('⚠️ La clave pública de Culqi no coincide con environment');
    }

    return true;
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

  // Actualiza validadores de campos de acuerdo y términos según el contenido del carrito
  private updateAgreementValidators(): void {
    if (!this.checkoutForm) return;
    const agreementControl = this.checkoutForm.get('agreement');
    const termsControl = this.checkoutForm.get('terms');
    if (!agreementControl || !termsControl) return;

    if (this.hasDocuments) {
      agreementControl.setValidators([Validators.requiredTrue]);
    } else {
      agreementControl.clearValidators();
    }

    // Terms should always be accepted
    termsControl.setValidators([Validators.requiredTrue]);

    agreementControl.updateValueAndValidity();
    termsControl.updateValueAndValidity();
  }

  private initPayPalConfig(): void {
    // Server-side create/capture flow (Option A)
    // Only initialize if the PayPal section is visible (user selected PayPal)
    if (!this.showPaypalSection) {
      this.payPalConfig = undefined;
      return;
    }

    const paypalClientId = environment.PAYPAL_PUBLIC;
    if (!paypalClientId) {
      console.warn('PAYPAL_PUBLIC no está configurado en environment');
      this.toastrService.warning('Configuración de PayPal incompleta', 'PayPal');
    }

    this.payPalConfig = {
      currency: this.paypalCurrency || 'USD',
      clientId: paypalClientId || '',
      createOrderOnServer: (data) => {
        // Build a full payment DTO similar to the Culqi payload so the server
        // has all metadata it needs when the order is captured.
        const isSubscription = this.cartItems.some(item => item.isSubscription === true);

        const dto: any = {
          // Basic fields
          documentIds: this.cartItems.filter(item => !item.isSubscription).map(item => item.id),
          guestEmail: !this.isAuthenticated ? this.checkoutForm.get('email')?.value : null,
          codigo: this.checkoutForm.get('codigo')?.value || null,
          currency: this.paypalCurrency || 'USD',

          // User/contact info
          userId: this.isAuthenticated ? JSON.parse(localStorage.getItem('currentUser')).id : null,
          name: (this.checkoutForm.get('firstName')?.value || '') + ' ' + (this.checkoutForm.get('lastName')?.value || ''),
          firstName: this.checkoutForm.get('firstName')?.value || '',
          lastName: this.checkoutForm.get('lastName')?.value || '',
          phone: this.checkoutForm.get('phone')?.value,

          // Payment/session flags
          isSubscription: isSubscription,
          status: '2', // default to paid for post-processing (server still validates)
          subscriptionType: '',

          // Discount / totals data used by backend validation
          subtotalOriginal: this.totalOriginal,
          totalSituationDiscounts: this.totalSituationDiscounts,
          totalReforzamientoDiscounts: this.totalReforzamientoDiscounts,
          totalPlanLectorDiscounts: this.totalPlanLectorDiscounts,
          totalAutomaticDiscounts: this.totalSituationDiscounts + this.totalReforzamientoDiscounts + this.totalPlanLectorDiscounts,

          // Transaction-specific fields (server will compute final amount)
          transactionType: 'purchase',
          idPayment: '',

          // Include subscription details only when creating a new subscription
          subscriptionDetails: this.cartItems.filter(item => item.isSubscription).map(item => ({
            subscriptionTypeId: item.id,
            totalCuotas: item.totalCuotas,
            montoPorCuota: item.montoPorCuota,
            montoTotal: item.montoTotal,
            materiasSeleccionadas: item.materiasSeleccionadas?.map(materia => ({
              materiaId: materia.id,
              opcionesIds: materia.opcionesSeleccionadas.map(opcion => opcion.id)
            }))
          }))
        };

        return this.paymentService.postPaypalCreateOrder(dto).toPromise().then(resp => {
          if (!resp) throw new Error('Empty response from create-order');
          const payload = resp.data && typeof resp.data === 'object' ? resp.data : resp;
          // payload expected: { orderId, payPalAmount, payPalCurrency, serverAmount }
          const orderId = payload.orderId || payload;
          if (payload.payPalAmount) {
            // store converted USD for UI if backend returned payPalAmount
            this.convertedTotalUSD = Math.round(Number(payload.payPalAmount) * 100) / 100;
          }
          return orderId;
        }).catch(err => {
          // Surface backend error early so user can see reason when PayPal fails
          console.error('Error creating PayPal order on server:', err);
          try {
            const msg = err?.error?.data || err?.error?.message || err?.message || JSON.stringify(err);
            this.toastrService.danger(`Error creando orden PayPal en el servidor: ${msg}`, 'PayPal');
          } catch (e) {
            this.toastrService.danger('Error creando orden PayPal en el servidor', 'PayPal');
          }
          return Promise.reject(err);
        });
      },
      onApprove: (data, actions) => {
        const orderId = data.orderID || data.orderId || data.id;
        if (!orderId) {
          this.onPaypalError(new Error('No orderId received on approve'));
          return Promise.reject('No orderId');
        }
        return this.paymentService.postPaypalCapture(orderId).toPromise()
          .then(resp => {
            this.handleSuccessPayment();
          })
          .catch(err => {
            console.error('Error capturing order on server:', err);
            this.onPaypalError(err);
            return Promise.reject(err);
          });
      },
      onError: err => {
        this.onPaypalError(err);
      }
    } as any;
  }

  onPaypalCurrencyChange(event: any): void {
    // Fetch latest exchange rate from backend via PaymentService and reinitialize PayPal
    this.paymentService.getExchangeRate().subscribe({
      next: (resp) => {
        // ResponseHandler in backend usually wraps value in { data: value } when successful
        // Normalize response to a numeric value safely
        let candidate: any = null;
        if (resp == null) {
          candidate = null;
        } else if (typeof resp === 'number') {
          candidate = resp;
        } else if (resp.data != null && (typeof resp.data === 'number' || typeof resp.data === 'string')) {
          candidate = resp.data;
        } else if (typeof resp === 'string') {
          candidate = resp;
        } else {
          // fallback: try to coerce any other shape
          candidate = (resp as any).data || resp;
        }

        const numericRate = (typeof candidate === 'number') ? candidate : (candidate ? parseFloat(String(candidate)) : NaN);
        if (!isNaN(numericRate) && numericRate > 0) {
          this.latestExchangeRate = numericRate;
        } else {
          this.latestExchangeRate = null;
        }

        if (this.paypalCurrency === 'USD' && this.latestExchangeRate) {
          // total is in PEN; USD = PEN / (PEN per USD)
          this.convertedTotalUSD = Math.round((this.total / this.latestExchangeRate) * 100) / 100;
        } else {
          this.convertedTotalUSD = null;
        }

        this.initPayPalConfig();
        this.toastrService.info(`Moneda PayPal establecida a ${this.paypalCurrency}`, 'Moneda actualizada');
      },
      error: (err) => {
        console.error('Error fetching exchange rate', err);
        this.latestExchangeRate = null;
        if (this.paypalCurrency === 'USD') {
          // Fallback: approximate using default 0.27 if backend not available
          const fallbackRate = 0.27;
          this.convertedTotalUSD = Math.round((this.total / fallbackRate) * 100) / 100;
        } else {
          this.convertedTotalUSD = null;
        }
        this.initPayPalConfig();
        this.toastrService.warning('No se obtuvo el tipo de cambio; usando valor aproximado', 'Tipo de cambio');
      }
    });
  }

  setPaypalCurrency(currency: 'PEN' | 'USD'): void {
    // PayPal must use USD for this integration. Ignore any attempt to set PEN.
    if (currency === 'PEN') {
      this.toastrService.warning('PayPal sólo procesa pagos en USD para esta pasarela; se usará USD automáticamente.', 'Moneda fija');
      // ensure config remains USD
      this.paypalCurrency = 'USD';
      this.onPaypalCurrencyChange({ value: 'USD' });
      return;
    }

    if (this.paypalCurrency === currency) return;
    this.paypalCurrency = currency;
    this.onPaypalCurrencyChange({ value: currency });
  }

 
}

