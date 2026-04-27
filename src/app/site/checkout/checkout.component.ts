import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../@core/backend/services/cart.service';
import { Router, RouterLink } from '@angular/router';
import { NbToastrService, NbCardModule, NbListModule, NbCheckboxModule } from '@nebular/theme';
import { PaymentData, PostPayment, PaymentResponse, DownloadInfo } from '../../@core/interfaces/payments';
import { HttpClient } from '@angular/common/http';
// libphonenumber-js se carga dinámicamente (build /min ~40 KB) para no inflar el chunk inicial.
type LibPhone = typeof import('libphonenumber-js/min');
import { environment } from '../../../environments/environment';
import { CuponService } from '../../@core/backend/services/cupon.service';
import { IPayPalConfig, NgxPayPalModule } from 'ngx-paypal';
import { firstValueFrom } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgClass, DecimalPipe, TitleCasePipe, CurrencyPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { ScriptLoaderService } from '../../@core/services/script-loader.service';

const CULQI_SCRIPT_URL = 'https://checkout.culqi.com/js/v4';

declare var Culqi: any;

@Component({
    selector: 'ngx-checkout',
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.scss'],
    standalone: true,
    imports: [MatProgressSpinnerModule, NbCardModule, NgClass, NbListModule, MatIconModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, MatRadioModule, NbCheckboxModule, NgxPayPalModule, RouterLink, DecimalPipe, TitleCasePipe, CurrencyPipe, DatePipe]
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private toastrService = inject(NbToastrService);
  private paymentService = inject(PaymentData);
  private http = inject(HttpClient);
  private cuponService = inject(CuponService);
  private scriptLoader = inject(ScriptLoaderService);

  // libphonenumber-js: carga perezosa con memoización.
  private libPhonePromise?: Promise<LibPhone>;
  private libPhone?: LibPhone;
  private loadLibPhone(): Promise<LibPhone> {
    if (this.libPhone) return Promise.resolve(this.libPhone);
    if (!this.libPhonePromise) {
      this.libPhonePromise = import('libphonenumber-js/min').then(m => {
        this.libPhone = m;
        return m;
      });
    }
    return this.libPhonePromise;
  }

  // Stepper state: start on step 2 (Información Personal)
  currentStep: number = 2;
  isAuthenticated: boolean = false;
  showPaymentModal: boolean = false;
  showPaypalModalOverlay: boolean = false; // Modal específico para PayPal con botones
  selectedPaymentMethod: 'culqi' | 'paypal' | null = null;
  // Control visibility of the PayPal section: hidden until user selects PayPal
  showPaypalSection: boolean = false;
  // PayPal currency: force to USD because PayPal integration doesn't accept PEN for this account
  paypalCurrency: 'USD' = 'USD';
  // Latest exchange rate (PEN per USD) fetched from backend
  latestExchangeRate: number | null = null;
  // Converted total in USD (computed when user selects USD)
  convertedTotalUSD: number | null = null;
  // Payment result returned from server after successful charge (contains payment and downloads)
  paymentResult: PaymentResponse | null = null;
  paymentResultDownloads: DownloadInfo[] = [];
  // Dynamic hint shown under the phone input (e.g. suggested normalized number)
  phoneHint: string = '';
  // Whether the downloads list is visible in Step 4
  downloadsVisible = false;
  // Show confetti emojis briefly when payment succeeds
  showConfetti = false;
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

  // Retry payment: return to payment methods and clear error state
  retryPayment(): void {
    this.paymentError = false;
    this.paymentErrorMessage = '';
    this.paymentSuccess = false;
    this.showConfetti = false;
    // Keep cart intact so user can retry
    this.selectedPaymentMethod = null;
    this.showPaypalSection = false;
    this.paymentResult = null;
    this.paymentResultDownloads = [];
    // Go back to payment selection (step 3)
    this.goToStep(3);
  }

  // Cierra el modal
  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedPaymentMethod = null;
    window.removeEventListener('keydown', this.handleModalKeydown);
  }

  closePaypalModal(): void {
    this.showPaypalModalOverlay = false;
    this.selectedPaymentMethod = null;
    window.removeEventListener('keydown', this.handleModalKeydown);
  }

  // Stepper helpers
  goToStep(step: number) {
    if (step < 1) step = 1;
    this.currentStep = step;

    // Scroll the top of the checkout component into view whenever the
    // step changes so the user always sees the start of the new step.
    // Use a slightly larger timeout to allow rendering and layout shifts to
    // finish before scrolling. Prefer scrolling to the stepper (.process-steps)
    // so users see the progress header; fallback to the component root.
    setTimeout(() => {
      try {
        // prefer the stepper element so the user sees the progress bar
        const preferred = document.querySelector('.process-steps') as HTMLElement;
        const el = preferred || document.getElementById('checkout-root');
        if (el) {
          // Use requestAnimationFrame to ensure browser layout is stable
          requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect();

            // detect a fixed app header (Nebular's nb-layout-header or common header selectors)
            const headerEl = document.querySelector('nb-layout-header') as HTMLElement
              || document.querySelector('.app-header') as HTMLElement
              || document.querySelector('.main-header') as HTMLElement
              || null;
            const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;

            // Find nearest scrollable ancestor. If none, fall back to document.scrollingElement / window.
            const findScrollableParent = (node: HTMLElement | null): HTMLElement | Element | null => {
              let parent = node && node.parentElement;
              while (parent) {
                const style = window.getComputedStyle(parent);
                const overflowY = style.overflowY;
                const isScrollable = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && parent.scrollHeight > parent.clientHeight;
                if (isScrollable) return parent;
                parent = parent.parentElement;
              }
              // no ancestor scrollable element found
              return document.scrollingElement || document.documentElement || document.body;
            };

            const scrollParent = findScrollableParent(el);

            // Compute target offset depending on whether we scroll the window/document or an element
            if (scrollParent === document.scrollingElement || scrollParent === document.documentElement || scrollParent === document.body) {
              const currentPageYOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
              const target = currentPageYOffset + rect.top - (headerHeight + 8);
              // If small delta, use scrollIntoView to let browser choose best behavior
              if (Math.abs(target - currentPageYOffset) < 6) {
                try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (ie) { window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' }); }
              } else {
                window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
              }
            } else if (scrollParent instanceof HTMLElement) {
              // Need to compute element position relative to the scrollParent
              const parentRect = scrollParent.getBoundingClientRect();
              const elTopRelative = rect.top - parentRect.top + (scrollParent as HTMLElement).scrollTop;
              const final = Math.max(0, elTopRelative - (headerHeight + 8));
              try {
                (scrollParent as HTMLElement).scrollTo({ top: final, behavior: 'smooth' });
              } catch (err) {
                // fallback: adjust parent's scrollTop directly
                (scrollParent as HTMLElement).scrollTop = final;
              }
            } else {
              // ultimate fallback
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (e) {
        // ignore DOM errors
      }
    }, 260);
  }

  nextStep() { this.goToStep(this.currentStep + 1); }
  prevStep() { this.goToStep(this.currentStep - 1); }

  // Handler para cuando cambia la moneda seleccionada
  onCurrencyChange(): void {
    const currency = this.checkoutForm.get('currency')?.value;
    
    if (currency === 'USD') {
      // Obtener tipo de cambio y convertir total a USD
      this.fetchExchangeRateAndConvert();
    } else {
      // Resetear conversión cuando vuelve a PEN
      this.convertedTotalUSD = null;
    }
  }

  // Método auxiliar para obtener tipo de cambio y convertir
  private fetchExchangeRateAndConvert(): void {
    // Si ya existe el tipo de cambio, solo convertir
    if (this.latestExchangeRate && this.latestExchangeRate > 0) {
      this.convertedTotalUSD = this.total / this.latestExchangeRate;
      return;
    }

    // Obtener tipo de cambio del backend usando el servicio
    this.paymentService.getExchangeRate().subscribe({
      next: (response) => {
        // Normalizar la respuesta (puede venir como número directo o en response.data)
        let rate: number | null = null;
        if (typeof response === 'number') {
          rate = response;
        } else if (response && response.data) {
          rate = typeof response.data === 'number' ? response.data : parseFloat(response.data);
        }
        
        if (rate && rate > 0) {
          this.latestExchangeRate = rate;
          this.convertedTotalUSD = this.total / this.latestExchangeRate;
        }
      },
      error: (err) => {
        console.error('Error obteniendo tipo de cambio:', err);
        // Usar tipo de cambio de respaldo
        this.latestExchangeRate = 3.75;
        this.convertedTotalUSD = this.total / this.latestExchangeRate;
      }
    });
  }

  // Nuevo método unificado: procesa el pago según la moneda seleccionada
  processPayment(): void {
    // 1. Validar formulario
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.focusFirstInvalidField();
      this.toastrService.warning(
        'Por favor completa todos los campos requeridos',
        'Formulario Incompleto',
        { duration: 4000 }
      );
      return;
    }

    // 2. Validar términos y acuerdos
    const termsAccepted = this.checkoutForm?.get('terms')?.value === true;
    const agreementAccepted = !this.hasDocuments || (this.checkoutForm?.get('agreement')?.value === true);
    if (!termsAccepted || !agreementAccepted) {
      this.toastrService.warning(
        'Debes aceptar los términos y condiciones para continuar',
        'Términos Requeridos',
        { duration: 4000 }
      );
      return;
    }

    // 3. Validar cupón no aplicado
    const promoCode = this.checkoutForm.get('codigo')?.value;
    if (promoCode && promoCode.trim().length > 0 && !this.promoApplied && !this.ignoreUnappliedPromo) {
      this.showUnappliedPromoWarning = true;
      return;
    }

    // 4. Determinar método de pago según moneda
    const currency = this.checkoutForm.get('currency')?.value;
    
    if (currency === 'PEN') {
      // Flujo Culqi: abrir modal Culqi directamente
      this.selectedPaymentMethod = 'culqi';
      this.abrirCulqi();
    } else if (currency === 'USD') {
      // Flujo PayPal: abrir modal con botones PayPal
      this.selectedPaymentMethod = 'paypal';
      this.openPayPalModal();
    }
  }

  // Abre modal específico para PayPal (sin opciones de Culqi)
  openPayPalModal(): void {
    // Ya no muestra modal de selección, va directo a PayPal
    // Este método ahora simplemente delega a selectPaymentMethod
    this.selectPaymentMethod('paypal');
  }

  // MANTENER MÉTODO ORIGINAL DEPRECADO para compatibilidad (ya no se usa)
  proceedToPaymentStep(): void {
    // enforce terms and agreement like before
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

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      // Scroll/focus the first invalid field to make it obvious to the user
      this.focusFirstInvalidField();
      this.toastrService.warning('Complete los campos requeridos antes de continuar', 'Formulario incompleto');
      return;
    }

    // NUEVO: Validación de cupón no aplicado
    const promoCode = this.checkoutForm.get('codigo')?.value;
    if (promoCode && promoCode.trim().length > 0 && !this.promoApplied && !this.ignoreUnappliedPromo) {
      this.showUnappliedPromoWarning = true;
      // Scroll to the warning if needed, though it will likely be near the button
      return;
    }

    // Advance to step 3 using the helper so we also scroll to the component top.
    this.goToStep(3);
    // Optionally show PayPal section reset
    this.showPaypalSection = false;
    this.showUnappliedPromoWarning = false;
  }

  // Permite al usuario continuar sin aplicar el cupón
  confirmContinueWithoutPromo(): void {
    this.ignoreUnappliedPromo = true;
    this.showUnappliedPromoWarning = false;
    this.processPayment(); // Cambiado de proceedToPaymentStep() a processPayment()
  }

  // Verifica el cupón y luego continúa si es exitoso
  verifyPromoAndContinue(): void {
    const code = this.checkoutForm.get('codigo')?.value;
    if (!code) return;

    this.cuponService.getValidar(code.trim()).subscribe({
      next: (resp: any) => {
        if (resp && resp.result && resp.data) {
          // Aplicar el cupón usando la lógica existente
          this.handlePromoSuccess(resp.data);
          this.showUnappliedPromoWarning = false;
          this.toastrService.success('¡Cupón aplicado! Continuando al pago...', 'Éxito');
          this.processPayment(); // Cambiado de proceedToPaymentStep() a processPayment()
        } else {
          this.toastrService.warning('El código ingresado no es válido', 'Cupón inválido');
          this.showUnappliedPromoWarning = false;
        }
      },
      error: () => {
        this.toastrService.danger('Error al verificar el cupón', 'Error');
        this.showUnappliedPromoWarning = false;
      }
    });
  }

  // Helper para centralizar la aplicación del cupón
  private handlePromoSuccess(data: any): void {
    if (data.descuento && data.descuento > 0) {
      this.discount = Number(data.descuento);
      this.discountFixedAmount = 0;
    } else if (data.abono && data.abono > 0) {
      this.discountFixedAmount = Number(data.abono);
      this.discount = 0;
    }
    this.promoApplied = true;
    this.calculateTotal();
  }

  // Focus and scroll the first invalid field in the form to help the user fix it
  private focusFirstInvalidField(): void {
    if (!this.checkoutForm) return;

    // Order of importance for fields in the form UI
    const fieldOrder = ['firstName', 'lastName', 'source', 'email', 'phone', 'agreement', 'terms'];

    for (const name of fieldOrder) {
      const control = this.checkoutForm.get(name);
      if (!control) continue;
      if (control.invalid) {
        // Try to find an element with formControlName
        const selector = `[formcontrolname="${name}"]`;
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          try {
            // Scroll the element into the center of the viewport for visibility
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // If it's an input/select/textarea, focus it
            if ((el as HTMLInputElement).focus) {
              (el as HTMLInputElement).focus();
            }
          } catch (e) {
            // ignore
          }
        } else {
          // If not found, check for a checkbox (nb-checkbox) with formControlName
          const nb = document.querySelector(`nb-checkbox[formcontrolname="${name}"]`) as HTMLElement | null;
          if (nb) { try { nb.scrollIntoView({ behavior: 'smooth', block: 'center' }); nb.focus(); } catch (e) { } }
        }

        // Show a contextual toast with field-specific message where applicable
        const fieldMessage = this.getErrorMessage(name) || (name === 'agreement' ? 'Debes aceptar la confirmación requerida' : (name === 'terms' ? 'Debes aceptar los términos y condiciones' : 'Completa este campo'));
        this.toastrService.warning(fieldMessage, 'Campo requerido');
        break; // focus only the first invalid field
      }
    }
  }

  // Selecciona el método de pago y ejecuta el flujo correspondiente
  selectPaymentMethod(method: 'culqi' | 'paypal'): void {
    this.selectedPaymentMethod = method;
    this.showPaymentModal = false;
    window.removeEventListener('keydown', this.handleModalKeydown);
    if (method === 'culqi') {
      // For Culqi we open the Culqi flow immediately (PEN)
      this.abrirCulqi();
    } else if (method === 'paypal') {
      // Prepare PayPal USD flow y abrir modal específico de PayPal
      
      // 1. PRIMERO: Mostrar modal de PayPal (necesario para que initPayPalConfig funcione)
      this.showPaypalModalOverlay = true;
      
      // 2. Añadir listener ESC para cerrar modal
      window.addEventListener('keydown', this.handleModalKeydown);
      
      // 3. Establecer moneda USD y obtener exchange rate (esto llamará a initPayPalConfig internamente)
      this.setPaypalCurrency('USD');
      
      this.toastrService.info('Completa el pago usando PayPal', 'Pago Internacional');
    }
  }

  // Selección visual sin ejecutar el pago (usada en la vista inline del paso 3)
  choosePaymentOption(method: 'culqi' | 'paypal'): void {
    this.selectedPaymentMethod = method;
    // collapse any PayPal inline section until the user confirms
    this.showPaypalSection = false;
    // If user selects PayPal visually, prefetch the USD conversion and init config
    if (method === 'paypal') {
      // Provide an immediate approximate USD so user sees a value quickly
      const fallbackRate = this.latestExchangeRate && this.latestExchangeRate > 0 ? this.latestExchangeRate : 3.50; // PEN per USD
      if (fallbackRate > 0 && this.total != null) {
        this.convertedTotalUSD = Math.round((this.total / fallbackRate) * 100) / 100;
      } else {
        this.convertedTotalUSD = null;
      }
      // Then request the authoritative rate and init PayPal config
      this.setPaypalCurrency('USD');
    } else {
      // reset any USD conversion when choosing Culqi
      this.convertedTotalUSD = null;
    }
  }

  // Download a simple receipt (generates a small text file) — placeholder for a real receipt endpoint
  downloadReceipt(): void {
    try {
      const receipt = `Pedido: ${this.orderId || 'N/A'}\nNombre: ${this.checkoutForm.get('firstName')?.value || ''} ${this.checkoutForm.get('lastName')?.value || ''}\nEmail: ${this.checkoutForm.get('email')?.value || ''}\nTeléfono: ${this.checkoutForm.get('phone')?.value || ''}\nTotal: ${this.total}\nFecha: ${new Date().toLocaleString()}`;
      const blob = new Blob([receipt], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${this.orderId || 'order'}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      this.toastrService.danger('No se pudo generar la descarga', 'Error');
    }
  }

  // Maneja teclado dentro del modal (ESC para cerrar)
  private handleModalKeydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' || ev.key === 'Esc') {
      // Cerrar modal de PayPal si está abierto
      if (this.showPaypalModalOverlay) {
        this.closePaypalModal();
      }
      // Cerrar modal de selección de pago si está abierto
      if (this.showPaymentModal) {
        this.closePaymentModal();
      }
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

    alert('¡Pago realizado con éxito!');
    // Aquí podrías llamar a tu backend para registrar la orden
  }

  onPaypalError(error: any) {
    // Ensure any global processing spinner is hidden
    this.isProcessing = false;

    // Log and route the error into the inline error handling so the
    // confirmation/error Step 4 is shown (instead of a separate alert
    // or navigation). Prefer a human-friendly message when available.

    let msg = 'Hubo un error al procesar el pago con PayPal. Intenta nuevamente.';
    try {
      if (!error) {
        msg = 'Error desconocido en pasarela PayPal';
      } else if (typeof error === 'string') {
        msg = error;
      } else if (error?.message) {
        msg = error.message;
      } else if (error?.error && (error.error.data || error.error.message)) {
        msg = error.error.data || error.error.message;
      } else {
        msg = JSON.stringify(error);
      }
    } catch (e) {
      // fallback message
    }

    // Use the existing inline error handler to show Step 4 with the message
    this.handlePaymentError(msg);
  }
  cartItems: any[] = [];
  checkoutForm!: FormGroup;
  isProcessing: boolean = false;
  processingMessage: string = '';
  discount: number = 0;
  // If a coupon provides a fixed amount discount (abono), store it here.
  discountFixedAmount: number = 0;
  total: number = 0;
  promoApplied: boolean = false;
  orderId: string = '';
  totalOriginal: number = 0;
  discountAmount: number = 0;
  showPromoCode: boolean = false;
  isCuotaPago: boolean = false;
  permiteCuotas: boolean = false; // NUEVO: bandera para membresía anual
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
  today: Date = new Date();
  // Confirmation view helpers
  confirmationProductTitle: string = '';
  paymentSuccess: boolean = false;
  paymentError: boolean = false;
  paymentErrorMessage: string = '';
  // Fields similar to PurchaseConfirmationComponent to keep parity
  transactionType: string = '';
  errorMessage: string = '';
  userEmail: string = '';
  userName: string = '';
  isSubscriptionFlag: boolean = false;
  // Propiedades para validación de cupón no aplicado
  showUnappliedPromoWarning: boolean = false;
  ignoreUnappliedPromo: boolean = false;

  constructor() {
    this.initForm();
  }

  goHome(): void {
    this.router.navigate(['/site/home']);
  }

  payPalConfig?: IPayPalConfig;
  ngOnInit(): void {
    this.loadAuthState();
    this.loadCartItems();

    // REFUERZO DE SEGURIDAD: Si hay suscripciones pero el usuario no está autenticado, redirigir fuera.
    const hasSubscription = this.cartItems.some(item => item.isSubscription === true);
    if (hasSubscription && !this.isAuthenticated) {
      this.toastrService.warning('Debes iniciar sesión para adquirir una membresía', 'Autenticación requerida', { duration: 6000 });

      setTimeout(() => {
        this.router.navigate(['/autenticacion/login'], { queryParams: { returnUrl: '/site/checkout' } });
      }, 800);
      return;
    }

    this.calculateTotal();
    this.initPayPalConfig();
    // Update phone hint dynamically when the user types
    try {
      const phoneControl = this.checkoutForm.get('phone');
      if (phoneControl) {
        // Precargar la lib en background apenas exista el control de teléfono.
        this.loadLibPhone().catch(() => {});
        phoneControl.valueChanges.subscribe(async (v: string) => {
          try {
            if (!v) { this.phoneHint = ''; return; }
            const lib = await this.loadLibPhone();
            const parsed = lib.parsePhoneNumberFromString(String(v));
            if (parsed && parsed.isValid()) {
              this.phoneHint = parsed.formatNational ? parsed.formatNational() : parsed.nationalNumber || '';
            } else {
              const aty = new lib.AsYouType();
              aty.input(String(v));
              this.phoneHint = (aty.getNumberValue() as string) || '';
            }
          } catch (e) {
            this.phoneHint = '';
          }
        });
      }
    } catch (e) {
      // ignore lib loading issues
    }

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

    // Escuchar cambios en el código para resetear la advertencia e ignorar
    this.checkoutForm.get('codigo')?.valueChanges.subscribe(() => {
      this.ignoreUnappliedPromo = false;
      this.showUnappliedPromoWarning = false;
    });

    // Ensure Culqi script is loaded before using the global `Culqi` object.
    // If the script is included in index.html with defer, it might not be available
    // at the time ngOnInit runs. Use a loader that resolves when Culqi is ready.
    this.ensureCulqiLoaded().then(() => {
      try {
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

        (window as any)['culqi'] = this.culqiHandler ? this.culqiHandler.bind(this) : this.culqiHandler;
        this.initCulqi();
      } catch (err) {
      }
    }).catch((err) => {
      this.toastrService.danger('Culqi no está disponible. Verifica que el script esté cargado.', 'Pago');
    });
  }

  // Ensure the Culqi checkout script is loaded and available globally.
  private ensureCulqiLoaded(): Promise<void> {
    return this.scriptLoader.load(CULQI_SCRIPT_URL, {
      matchSubstr: 'culqi',
      globalCheck: () => typeof (window as any).Culqi !== 'undefined',
    });
  }

  private initForm(): void {
    // Initialize the checkout form with the controls used across the component
    this.checkoutForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      middleName: [''],
      source: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9+\s()\-]+$')]],
      codigo: [''],
      agreement: [false],
      terms: [false],
      currency: ['PEN'] // Nuevo: control de moneda (PEN = Culqi, USD = PayPal)
    });
  }

  // Normalize phone for backend/gateway: remove formatting and, for common Peru case,
  // strip the country code so backend receives the national number (e.g., 940101228).
  // This is a pragmatic client-side normalization to reduce Culqi rejections.
  private normalizePhoneForBackend(raw: string): string {
    if (!raw) return '';
    const v = String(raw).trim();
    try {
      // Solo intentamos usar libphonenumber si ya está cargada (no bloquea).
      // Si aún no se cargó, caemos al fallback simple más abajo.
      if (this.libPhone) {
        const parsed = this.libPhone.parsePhoneNumberFromString(v);
        if (parsed && parsed.isValid()) {
          return parsed.nationalNumber || parsed.format('NATIONAL') || '';
        }
      }
    } catch (e) {
      // fallthrough to simple normalization
    }
    // Fallback simple normalization (previous behavior)
    let s = v.replace(/[\s\-()]+/g, '');
    if (s.startsWith('+')) s = s.substring(1);
    if (s.startsWith('00') && s.length > 9) s = s.substring(2);
    if (s.startsWith('51') && s.length > 9) s = s.substring(2);
    s = s.replace(/\D+/g, '');
    if (s.length > 15) s = s.slice(-15);
    return s;
  }

  // Apply normalization to the form control and return normalized value
  private applyPhoneNormalization(): string {
    if (!this.checkoutForm) return '';
    const control = this.checkoutForm.get('phone');
    if (!control) return '';
    const raw = control.value || '';
    const normalized = this.normalizePhoneForBackend(raw);
    // update control silently (preserve touched state)
    control.setValue(normalized, { emitEvent: false });
    return normalized;
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

    // NUEVO: Detectar si el carrito contiene una membresía anual que permite cuotas
    // Se asume que el backend/DTO ya propaga permiteCuotas en el producto
    this.permiteCuotas = this.cartItems.some(item => item.permiteCuotas === true);
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
        this.toastrService.danger('Error al verificar el código promocional', 'Error');
      }
    });
  }

  // Centraliza la lógica de toggle para el código promocional
  togglePromoCode(): void {
    this.showPromoCode = !this.showPromoCode;
  }


  // Inicialización de Culqi: se configuran las llaves, estilos y se habilitan múltiples métodos de pago.
  private initCulqi(): void {
    try {
      // Verificar que Culqi esté disponible
      if (typeof Culqi === 'undefined') {
        this.toastrService.danger('Error: Sistema de pagos no disponible', 'Error de configuración');
        return;
      }

      // Verificar que tengamos la clave pública
      if (!environment.CULQI_PUBLIC_KEY) {
        this.toastrService.danger('Error: Configuración de pagos incompleta', 'Error de configuración');
        return;
      }

      (window as any)['culqi'] = this.culqiHandler.bind(this);
      Culqi.publicKey = environment.CULQI_PUBLIC_KEY;

      // Agregar listener para cuando se cierre Culqi manualmente por el usuario
      (window as any)['culqiclose'] = () => {
        // Solo desactivar procesamiento si no hay una orden o token válidos
        // (es decir, si el usuario cancela antes de completar el pago)
        if (this.isProcessing && !Culqi.order && !Culqi.token) {
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
          // normalize phone before passing to Culqi client data
          const normalized = this.applyPhoneNormalization();
          const formValues = this.checkoutForm.value;
          culqiSettings.client = {
            first_name: formValues.firstName,
            last_name: formValues.lastName,
            email: formValues.email,
            phone_number: normalized || formValues.phone
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

    } catch (error) {
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



          // Validamos los métodos de pago disponibles antes de abrir el checkout
          Culqi.validationPaymentMethods();

          // Abrir el checkout de Culqi
          Culqi.open();

        } catch (error) {
          this.toastrService.danger('Error al inicializar el pago. Intenta nuevamente.', 'Error');
        }
      });
    }
  }

  private buildPaymentDTO(): any {
    const normalizedPhone = this.applyPhoneNormalization();
    const subscriptionItem = this.cartItems.find(item => item.isSubscription === true);

    // Detect cuota item (installment) and extract numeric id for backend (`quota-1234` -> `1234`)
    const cuotaItem = this.cartItems.find(item =>
      item.isSubscription === false && (
        (item.title && item.title.toLowerCase().includes('cuota')) ||
        (item.description && item.description.toLowerCase().includes('pago de cuota')) ||
        item.isInstallment ||
        (item.transactionType && item.transactionType === 'installment')
      )
    );

    let idPaymentValue: string = '';
    if (cuotaItem && cuotaItem.id) {
      const rawId = String(cuotaItem.id);
      const m = rawId.match(/(\d+)$/);
      idPaymentValue = m ? m[1] : rawId;
    }

    return {
      userId: this.isAuthenticated ? JSON.parse(localStorage.getItem('currentUser') || '{}').id : null,
      name: (this.checkoutForm.get('firstName')?.value || '') + ' ' + (this.checkoutForm.get('lastName')?.value || ''),
      firstName: this.checkoutForm.get('firstName')?.value || '',
      lastName: this.checkoutForm.get('lastName')?.value || '',
      phone: normalizedPhone,
      amount: this.getAmountInCents(this.total),
      currency: 'PEN',
      description: 'Compra en Carpeta Digital',
      isSubscription: !!subscriptionItem,
      status: '2',
      subscriptionType: '',
      documentIds: this.isCuotaPago ? [] : this.cartItems
        .filter(item => !item.isSubscription)
        .map(item => {
          const raw = String(item.id);
          const m = raw.match(/^(?:quota-)?(\d+)$/);
          return m ? Number(m[1]) : NaN;
        })
        .filter((v): v is number => Number.isFinite(v)),
      guestEmail: !this.isAuthenticated ? this.checkoutForm.get('email')?.value : null,
      email: this.checkoutForm.get('email')?.value,
      codigo: this.checkoutForm.get('codigo')?.value,

      // Campos para validación de descuentos en el backend
      subtotalOriginal: this.totalOriginal,
      totalSituationDiscounts: this.totalSituationDiscounts,
      totalReforzamientoDiscounts: this.totalReforzamientoDiscounts,
      totalPlanLectorDiscounts: this.totalPlanLectorDiscounts,
      totalAutomaticDiscounts: this.totalSituationDiscounts + this.totalReforzamientoDiscounts + this.totalPlanLectorDiscounts,

      // Detalles de suscripción
      unitScheduleId: this.cartItems.find(item => item.isSubscription && item.unitScheduleId)?.unitScheduleId,
      subscriptionDetails: this.cartItems
        .filter(item => item.isSubscription)
        .map(item => ({
          subscriptionTypeId: item.id,
          totalCuotas: item.totalCuotas,
          montoPorCuota: item.montoPorCuota,
          montoTotal: item.montoTotal,
          unitScheduleId: item.unitScheduleId,
          materiasSeleccionadas: item.materiasSeleccionadas?.map((materia: any) => ({
            materiaId: materia.id,
            opcionesIds: materia.opcionesSeleccionadas.map((opcion: any) => opcion.id)
          }))
        })) ,
      // If this is a cuota (installment) payment, include idPayment and transactionType
      idPayment: cuotaItem ? String(idPaymentValue) : '',
      transactionType: cuotaItem ? 'installment' : 'purchase',
    };
  }

  private createOrder(callback: (orderId: string) => void): void {
    const paymentDTO = this.buildPaymentDTO();

    const orderData = {
      amount: paymentDTO.amount,
      firstName: paymentDTO.firstName,
      lastName: paymentDTO.lastName,
      currency_code: 'PEN',
      email: paymentDTO.email,
      confirm: false,
      description: paymentDTO.description,
      phone: paymentDTO.phone,
      metadata: paymentDTO,
    };

    this.isProcessing = true;
    this.processingMessage = 'Iniciando orden de pago...';

    this.paymentService.postOrder(orderData).subscribe({
      next: (response: any) => {
        if (response.data && response.data.orderId) {
          console.debug('[Checkout] createOrder response:', response);
          console.info('[Checkout] received orderId:', response.data.orderId);
          this.isProcessing = false;
          callback(response.data.orderId);
        } else {
          this.isProcessing = false;
          this.toastrService.danger('Error al crear la orden', 'Error');
          this.router.navigate(['/site/cart']);
        }
      },
      error: (error) => {
        console.error('[Checkout] createOrder error:', error);
        this.isProcessing = false;
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
      this.isProcessing = true;
      this.processingMessage = 'Validando tarjeta...';
      Culqi.close();
      this.procesarPago(Culqi.token.id, Culqi.token.email);
    } else if (Culqi.order) {
      // Si se retornó un objeto order, puede ser Yape u otro método
      if (Culqi.order.object === 'order') {
        this.isProcessing = true;
        this.processingMessage = 'Procesando pago con Yape...';
        Culqi.close();
        this.procesarPago(Culqi.order.id, this.checkoutForm.get('email')?.value);
      } else {
        this.toastrService.danger('Tipo de pago no soportado', 'Error de pago');
        this.isProcessing = false;
        Culqi.close();
      }
    } else if (Culqi.error) {
      this.isProcessing = false;
      let displayMessage = 'Error al procesar el pago.';
      try {
        const parsed = JSON.parse(Culqi.error);
        displayMessage = parsed.user_message || parsed.merchant_message || displayMessage;
      } catch (e) {
        displayMessage = Culqi.error;
      }
      this.handlePaymentError(displayMessage);
      Culqi.close();
    } else {
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

    // Normalize phone before sending payment to backend
    const normalizedPhone = this.applyPhoneNormalization();

    // Prepare idPayment: if installment, extract numeric id from item id (e.g. 'quota-1033' -> '1033')
    let idPaymentValue: string | number = '';
    if (isInstallmentPayment && subscriptionItem && subscriptionItem.id) {
      const rawId = String(subscriptionItem.id);
      const m = rawId.match(/(\d+)$/);
      idPaymentValue = m ? m[1] : rawId;
    }

    // Prepare documentIds: convert numeric-like ids or strip 'quota-' entries.
    let documentIdsValue: number[] = [];
    if (!isInstallmentPayment) {
      documentIdsValue = this.cartItems
        .map(item => {
          const raw = String(item.id);
          const m = raw.match(/^(?:quota-)?(\d+)$/);
          return m ? Number(m[1]) : NaN;
        })
        .filter((v): v is number => Number.isFinite(v));
    } else {
      // For installment payments, do not send documentIds derived from quota entries
      documentIdsValue = [];
    }

    const paymentData: PostPayment & { subscriptionDetails?: any } = {
      token: token,
      orderId: this.orderId,
      amount: amountInCents,
      email: email,
      description: 'Compra en Carpeta Digital',
      userId: this.isAuthenticated ? JSON.parse(localStorage.getItem('currentUser') || '{}').id : null,
      name: (this.checkoutForm.get('firstName')?.value || '') + ' ' + (this.checkoutForm.get('lastName')?.value || ''),
      firstName: this.checkoutForm.get('firstName')?.value || '',
      lastName: this.checkoutForm.get('lastName')?.value || '',
      phone: normalizedPhone,
      documentIds: documentIdsValue,
      guestEmail: !this.isAuthenticated ? this.checkoutForm.get('email')?.value : null,
      isSubscription: !!subscriptionItem && subscriptionItem.isSubscription === true, // Solo true para compras nuevas
      status: '2',
      subscriptionType: '',
      transactionType: isInstallmentPayment ? 'installment' : 'purchase',
      idPayment: isInstallmentPayment ? String(idPaymentValue) : '',
      codigo: this.checkoutForm.get('codigo')?.value,
      // Campos para validación de descuentos en el backend
      subtotalOriginal: this.totalOriginal,
      totalSituationDiscounts: this.totalSituationDiscounts,
      totalReforzamientoDiscounts: this.totalReforzamientoDiscounts,
      totalPlanLectorDiscounts: this.totalPlanLectorDiscounts,
      totalAutomaticDiscounts: this.totalSituationDiscounts + this.totalReforzamientoDiscounts + this.totalPlanLectorDiscounts,
      // Agregar unitScheduleId si existe en el carrito de suscripción
      unitScheduleId: subscriptionItem?.unitScheduleId,
      ...(subscriptionItem && subscriptionItem.isSubscription === true && {
        // Solo incluir subscriptionDetails para compras nuevas de suscripción
        subscriptionDetails: {
          subscriptionTypeId: subscriptionItem.id,
          totalCuotas: subscriptionItem.totalCuotas,
          montoPorCuota: subscriptionItem.montoPorCuota,
          montoTotal: subscriptionItem.montoTotal,
          unitScheduleId: subscriptionItem.unitScheduleId, // ID único del UnitSchedule seleccionado
          materiasSeleccionadas: subscriptionItem.materiasSeleccionadas?.map((materia: any) => ({
            materiaId: materia.id,
            opcionesIds: materia.opcionesSeleccionadas.map((opcion: any) => opcion.id)
          }))
        }
      })

    };

    this.isProcessing = true;

    this.paymentService.postCharge(paymentData).subscribe({
      next: (response) => {
        // Backend may return a wrapped ResponseHandler object { result, data }
        // where data is PaymentResponse DTO with paymentId, downloads, etc.
        const wrapped = response && response.data !== undefined ? response : { data: response };
        const payload = wrapped.data as PaymentResponse;

        // If payload contains paymentId (new PaymentResponse), store it for Step 4
        if (payload && typeof payload === 'object' && payload.paymentId) {
          this.paymentResult = payload;
          this.paymentResultDownloads = payload.downloads || [];
          this.handleSuccessPayment();
          Culqi.close();
          return;
        }

        // Fallback to legacy boolean success flag
        if (response && response.result === true) {
          this.handleSuccessPayment();
          Culqi.close();
          return;
        }

        // If we get here, treat as failure - check if response has error data
        const errorMsg = (response && response.data) ? response.data : 'Error procesando el pago';
        this.handlePaymentError(errorMsg);
      },
      error: (error) => {
        let msg = 'Error al procesar el pago';
        let extractedMessage = null;
        
        try {
          // Usar datos del interceptor nativo XMLHttpRequest
          const nativeError = typeof window !== 'undefined' ? (window as any).__LAST_PAYMENT_ERROR_RESPONSE__ : null;
          if (nativeError && nativeError.data) {
            extractedMessage = nativeError.data;
          }
          
          // Limpiar datos después de usarlos
          if (typeof window !== 'undefined' && (window as any).__LAST_PAYMENT_ERROR_RESPONSE__) {
            delete (window as any).__LAST_PAYMENT_ERROR_RESPONSE__;
          }
          
        } catch (e) {
          // Error silencioso en extracción
        }
        
        // Si tenemos un mensaje extraído y es útil, limpiarlo y usarlo
        if (extractedMessage && extractedMessage.length > 3 && 
            extractedMessage !== 'Error al procesar el pago' &&
            !extractedMessage.includes('()=>') &&
            extractedMessage !== '[object Object]') {
          
          msg = this.cleanErrorMessage(extractedMessage);
          
        } else {
          // Fallback: mensaje específico para errores de pago
          msg = 'La compra no ha podido ser procesada. Contácte con la entidad emisora de su tarjeta o intente con otro método de pago.';
        }
        
        this.handlePaymentError(msg);
      }
    });
  }

  private handleSuccessPayment(): void {
    // Guardar detalles visibles para la confirmación antes de limpiar el carrito
    this.confirmationProductTitle = this.cartItems && this.cartItems.length ? this.cartItems[0].title : '';

    // Fill purchase-like fields
    this.transactionType = this.isCuotaPago ? 'installment' : 'purchase';
    this.errorMessage = '';
    this.userEmail = this.checkoutForm.get('email')?.value || '';
    this.userName = `${this.checkoutForm.get('firstName')?.value || ''} ${this.checkoutForm.get('lastName')?.value || ''}`.trim();
    this.isSubscriptionFlag = this.cartItems.some(i => i.isSubscription === true);

    // Limpiar carrito (se hace después de capturar datos para la vista de confirmación)
    this.cartService.clearCart();

    // Marcar éxito y mostrar paso 3 (confirmación) inline en lugar de navegar a otra ruta
    this.paymentSuccess = true;
    this.paymentError = false;
    this.paymentErrorMessage = '';
    this.goToStep(3);

    // Show confetti briefly
    this.showConfetti = true;
    setTimeout(() => this.showConfetti = false, 4500);

    this.toastrService.success('Pago procesado correctamente', 'Éxito');
    this.isProcessing = false;
  }

  /**
   * Aplana la estructura anidada de downloads para obtener todas las URLs
   * Útil para implementar un botón "Descargar todos"
   */
  getAllDownloadUrls(): string[] {
    const urls: string[] = [];

    const extractUrls = (download: DownloadInfo) => {
      // Si tiene URL y no es kit (los kits no tienen URL propia)
      if (download.url && !download.isKit) {
        urls.push(download.url);
      }
      // Si es kit, extraer URLs de documentos anidados
      if (download.isKit && download.documents) {
        download.documents.forEach(doc => extractUrls(doc));
      }
    };

    this.paymentResultDownloads.forEach(d => extractUrls(d));
    return urls;
  }

  /**
   * Cuenta el total de documentos descargables (sin contar kits como documentos)
   */
  getTotalDownloadableDocuments(): number {
    let count = 0;

    const countDocs = (download: DownloadInfo) => {
      if (!download.isKit) {
        count++;
      }
      if (download.isKit && download.documents) {
        download.documents.forEach(doc => countDocs(doc));
      }
    };

    this.paymentResultDownloads.forEach(d => countDocs(d));
    return count;
  }

  private handlePaymentError(message: string): void {
    Culqi.close();

    // Si el mensaje ya es específico y limpio, usarlo directamente
    let displayMessage = message;
    
    if (message.includes('entidad emisora') || message.includes('método de pago')) {
      displayMessage = message;
    } else {
      // Para otros mensajes, aplicar lógica de limpieza
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
          // Si no hay JSON, limpiar el mensaje removiendo [CULQI] y códigos de error
          displayMessage = this.cleanErrorMessage(message);
        }
      } catch (error) {
        displayMessage = this.cleanErrorMessage(message);
      }
    }

    // Mostrar paso 4 (confirmación) con el error en lugar de navegar a otra página
    this.paymentSuccess = false;
    this.paymentError = true;
    this.paymentErrorMessage = displayMessage;
    
    // Ensure any success UI is disabled
    this.showConfetti = false;
    this.paymentResult = null;
    this.paymentResultDownloads = [];
    // Also populate fields similar to purchase page so the inline confirmation matches
    this.transactionType = this.isCuotaPago ? 'installment' : 'purchase';
    this.errorMessage = displayMessage;
    this.userEmail = this.userEmail || this.checkoutForm.get('email')?.value || '';
    this.userName = this.userName || `${this.checkoutForm.get('firstName')?.value || ''} ${this.checkoutForm.get('lastName')?.value || ''}`.trim();
    this.isSubscriptionFlag = this.cartItems.some(i => i.isSubscription === true);
    // keep confirmationProductTitle if available, do not clear cart here so user can retry
    this.goToStep(3);
    this.isProcessing = false;
  }

  private cleanErrorMessage(message: string): string {
    if (!message) {
      return 'Error al procesar el pago';
    }
    
    // Remover [CULQI] al inicio
    let cleaned = message.replace(/^\[CULQI\]\s*/, '');
    
    // Remover códigos de error al final (Error Code: XXX, HTTP: XXX)
    cleaned = cleaned.replace(/\s*\(Error Code:[^)]*\)\s*$/, '');
    
    return cleaned.trim() || 'Error al procesar el pago';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    if (!field) return false;
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    if (!field) return '';
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
    }
  }


  // Función auxiliar para calcular el monto en céntimos de forma segura
  private getAmountInCents(amount: number): number {
    // Asegurar que el monto sea un número válido
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      return 0;
    }

    // Validar que el monto no sea demasiado pequeño
    if (amount < 1) {
      return 0;
    }

    // Validar que el monto no sea demasiado grande (límite de Culqi)
    if (amount > 99999999) { // 999,999.99 PEN
      return 0;
    }

    // Convertir directamente a céntimos usando Math.round (consistente con backend)
    const amountInCents = Math.round(amount * 100);

    // Validar que el resultado sea un entero válido
    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {

      return 0;
    }



    return amountInCents;
  }

  // Método para verificar que Culqi esté disponible y configurado correctamente
  private validateCulqiConfiguration(): boolean {
    // Verificar que Culqi esté disponible globalmente
    if (typeof Culqi === 'undefined') {
      return false;
    }

    // Verificar que tengamos la clave pública
    if (!environment.CULQI_PUBLIC_KEY) {
      return false;
    }

    // Verificar que Culqi tenga la clave pública configurada
    if (!Culqi.publicKey) {
      return false;
    }

    // Verificar que la clave coincida con la del environment
    if (Culqi.publicKey !== environment.CULQI_PUBLIC_KEY) {
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
        return false;
      }
    }

    // Si no es cuota pendiente, podría ser compra nueva de suscripción fraccionada
    // Buscar item de suscripción tradicional (isSubscription: true)
    const subscriptionItem = this.cartItems.find(item => item.isSubscription === true);

    if (!subscriptionItem) {
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
      return false;
    }

    if (montoPorCuota && montoPorCuota <= 0) {
      return false;
    }

    if (montoTotal && montoTotal <= 0) {
      return false;
    }

    // Validar coherencia solo si tenemos todos los datos
    if (totalCuotas && montoPorCuota && montoTotal) {
      const calculatedTotal = montoPorCuota * totalCuotas;
      const tolerance = 0.01; // 1 centavo de tolerancia

      if (Math.abs(calculatedTotal - montoTotal) > tolerance) {
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
    // Permitir inicialización si showPaypalSection o showPaypalModalOverlay están activos
    if (!this.showPaypalSection && !this.showPaypalModalOverlay) {
      this.payPalConfig = undefined;
      return;
    }

    const paypalClientId = environment.PAYPAL_PUBLIC;
    if (!paypalClientId) {
      this.toastrService.warning('Configuración de PayPal incompleta', 'PayPal');
    }

    this.payPalConfig = {
      currency: this.paypalCurrency || 'USD',
      clientId: paypalClientId || '',
      createOrderOnServer: (data: any) => {
        // Show spinner while contacting our server to create the PayPal order
        this.isProcessing = true;
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
          userId: this.isAuthenticated ? JSON.parse(localStorage.getItem('currentUser') || '{}').id : null,
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

          // Agregar unitScheduleId si existe en el carrito de suscripción
          unitScheduleId: this.cartItems.find(item => item.isSubscription && item.unitScheduleId)?.unitScheduleId,

          // Include subscription details only when creating a new subscription
          subscriptionDetails: this.cartItems.filter(item => item.isSubscription).map(item => ({
            subscriptionTypeId: item.id,
            totalCuotas: item.totalCuotas,
            montoPorCuota: item.montoPorCuota,
            montoTotal: item.montoTotal,
            unitScheduleId: item.unitScheduleId, // ID único del UnitSchedule seleccionado
            materiasSeleccionadas: item.materiasSeleccionadas?.map((materia: any) => ({
              materiaId: materia.id,
              opcionesIds: materia.opcionesSeleccionadas.map((opcion: any) => opcion.id)
            }))
          }))
        };

        return firstValueFrom(this.paymentService.postPaypalCreateOrder(dto)).then(resp => {
          if (!resp) throw new Error('Empty response from create-order');
          const payload = resp.data && typeof resp.data === 'object' ? resp.data : resp;
          // payload expected: { orderId, payPalAmount, payPalCurrency, serverAmount }
          const orderId = payload.orderId || payload;
          if (payload.payPalAmount) {
            // store converted USD for UI if backend returned payPalAmount
            this.convertedTotalUSD = Math.round(Number(payload.payPalAmount) * 100) / 100;
          }
          // hide spinner after create-order completed (capture will re-enable it)
          this.isProcessing = false;
          return orderId;
        }).catch(err => {
          // Surface backend error early so user can see reason when PayPal fails
          try {
            const msg = err?.error?.data || err?.error?.message || err?.message || JSON.stringify(err);
            this.toastrService.danger(`Error creando orden PayPal en el servidor: ${msg}`, 'PayPal');
          } catch (e) {
            this.toastrService.danger('Error creando orden PayPal en el servidor', 'PayPal');
          }
          // Ensure processing flag is reset
          this.isProcessing = false;
          return Promise.reject(err);
        });
      },
      onApprove: (data: any, actions: any) => {
        const orderId = data.orderID || data.orderId || data.id;
        if (!orderId) {
          this.onPaypalError(new Error('No orderId received on approve'));
          return Promise.reject('No orderId');
        }
        // Show spinner while we capture the order on our server
        this.isProcessing = true;
        return firstValueFrom(this.paymentService.postPaypalCapture(orderId))
          .then(resp => {
            // server may return PaymentResponse DTO in resp.data
            const wrapped = resp && resp.data !== undefined ? resp : { data: resp };
            const payload = wrapped.data as PaymentResponse;
            if (payload && typeof payload === 'object' && payload.paymentId) {
              this.paymentResult = payload;
              this.paymentResultDownloads = payload.downloads || [];
            }
            this.handleSuccessPayment();
          })
          .catch(err => {
            this.onPaypalError(err);
            return Promise.reject(err);
          });
      },
      onError: (err: any) => {
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
        this.latestExchangeRate = null;
        if (this.paypalCurrency === 'USD') {
          // Fallback: approximate using default 3.50 if backend not available
          const fallbackRate = 3.50;
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

    // Even if the currency is already USD by default, force a refresh of the
    // exchange rate and PayPal config. Previously the method returned early
    // when the currency matched (and `paypalCurrency` is initialized to
    // 'USD'), which prevented the first fetch of the exchange rate.
    const alreadySame = this.paypalCurrency === currency;
    this.paypalCurrency = currency;
    // Force update (fetch exchange rate and re-init config) even if same
    // currency — this ensures the backend request is performed when user
    // selects PayPal.
    this.onPaypalCurrencyChange({ value: currency });
  }


}

