import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { NbLayoutScrollService } from '@nebular/theme';
import { CommonModule, DecimalPipe, LowerCasePipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { Subject, of } from 'rxjs';
import {
  catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil,
} from 'rxjs/operators';

import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  MatAutocomplete, MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatOption } from '@angular/material/core';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { UsersService } from '../../@core/backend/services/users.service';
import { DocumentsService } from '../../@core/backend/services/documents.service';
import { PaymentService } from '../../@core/backend/services/payment.service';
import { CuponService } from '../../@core/backend/services/cupon.service';

import { User } from '../../@core/interfaces/users';
import {
  ManualPaymentMethod, ManualPaymentRequest,
} from '../../@core/interfaces/payments';

import {
  CatalogExplorerComponent,
  CatalogExplorerItem,
} from './catalog-explorer/catalog-explorer.component';
import { CartSidePanelComponent } from './cart-side-panel/cart-side-panel.component';
import {
  PaymentMethodPickerComponent,
  PaymentMethodOption,
} from './payment-method-picker/payment-method-picker.component';
import {
  PaymentSummaryPanelComponent,
} from './payment-summary-panel/payment-summary-panel.component';
import {
  ConfirmAmountOverrideDialogComponent,
  ConfirmOverrideData,
} from './dialogs/confirm-amount-override-dialog.component';
import {
  EmailPreviewDialogComponent,
  EmailPreviewData,
} from './dialogs/email-preview-dialog.component';

/** Documento seleccionado por el admin en el wizard. */
interface SelectedDocument {
  id: number;
  title: string;
  price: number;
  category?: string;
  materia?: string;
  nivel?: string;
  thumbUrl?: string;
  isKit?: boolean;
}

/** Usuario seleccionado en el paso 0 (cliente registrado). */
interface SelectedClientUser {
  userId: number;
  displayName: string;
  email: string;
}

interface WizardStep {
  id: number;
  label: string;
  icon: string;
}

/**
 * Registro de ventas manuales por administradores. Permite al admin/supadmin
 * vender documentos o kits a clientes registrados o invitados sin pasar por
 * la pasarela. Reutiliza el endpoint /api/v1/document/filtros (con `title`)
 * y la jerarquia Categoria -> Nivel -> Materia -> Grado para localizar
 * productos. Puede precargar la venta desde un PaymentIntent (carrito
 * abandonado) cuando se llega con ?fromIntent=<orderId>.
 */
@Component({
  selector: 'ngx-registrar-venta-manual',
  templateUrl: './registrar-venta-manual.component.html',
  styleUrls: ['./registrar-venta-manual.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatButton, MatIconButton, MatCard, MatCardContent, MatIcon,
    MatProgressSpinner, MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatSuffix,
    MatInput, MatAutocomplete, MatAutocompleteTrigger, MatOption,
    MatRadioButton, MatRadioGroup, MatSlideToggle, MatCheckbox,
    DecimalPipe, LowerCasePipe,
    CatalogExplorerComponent,
    CartSidePanelComponent,
    PaymentMethodPickerComponent,
    PaymentSummaryPanelComponent,
  ],
})
export class RegistrarVentaManualComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private host = inject(ElementRef<HTMLElement>);
  private nbScroll = inject(NbLayoutScrollService);

  private usersService = inject(UsersService);
  private documentsService = inject(DocumentsService);
  private paymentService = inject(PaymentService);
  private cuponService = inject(CuponService);

  private destroy$ = new Subject<void>();
  private userSearch$ = new Subject<string>();

  // ===== Acceso por roles =====
  canCreateManualSale = false;

  // ===== Stepper =====
  currentStep = 0;
  readonly wizardSteps: WizardStep[] = [
    { id: 0, label: 'Cliente', icon: 'person' },
    { id: 1, label: 'Productos', icon: 'shopping_bag' },
    { id: 2, label: 'Pago', icon: 'payments' },
    { id: 3, label: 'Confirmar', icon: 'fact_check' },
  ];

  // ===== Forms =====
  customerForm!: FormGroup;
  paymentForm!: FormGroup;
  confirmForm!: FormGroup;

  // ===== Cliente =====
  filteredUsers: User[] = [];
  selectedUser: SelectedClientUser | null = null;

  // ===== Productos =====
  /** Carrito actual; se sincroniza desde el explorador de catalogo inline. */
  selectedDocs: SelectedDocument[] = [];

  // ===== Pago =====
  readonly methodOptions: PaymentMethodOption[] = [
    { value: 'MANUAL_CASH',     label: 'Efectivo',         icon: 'payments',         hint: 'En tienda' },
    { value: 'MANUAL_YAPE',     label: 'Yape',             icon: 'qr_code_2',        hint: 'Codigo de operacion' },
    { value: 'MANUAL_PLIN',     label: 'Plin',             icon: 'qr_code_2',        hint: 'Codigo de operacion' },
    { value: 'MANUAL_TRANSFER', label: 'Transferencia',    icon: 'account_balance',  hint: 'N. operacion' },
    { value: 'MANUAL_DEPOSIT',  label: 'Deposito agente',  icon: 'local_atm',        hint: 'Voucher fisico' },
    { value: 'MANUAL_OTHER',    label: 'Otro',             icon: 'more_horiz',       hint: 'Detallar en motivo' },
  ];

  /**
   * Threshold (S/) absoluto a partir del cual el override exige confirmacion
   * via dialog. Tambien se aplica un 1% del computedTotal como threshold
   * relativo.
   */
  private readonly OVERRIDE_ABS_THRESHOLD = 1;
  /** Cap maximo relativo del override: +/- 50% del computado. */
  private readonly OVERRIDE_MAX_RELATIVE = 0.5;
  /** Cap absoluto extra para evitar typos cuando el computed es 0/bajo. */
  private readonly OVERRIDE_MAX_ABSOLUTE = 999999;

  subtotal = 0;
  appliedCouponCode = '';
  couponPct = 0;
  couponDiscount = 0;
  computedTotal = 0;
  finalAmount = 0;
  overrideDelta = 0;
  validatingCoupon = false;

  // ===== Banner cuando viene desde un PaymentIntent abandonado =====
  sourceIntentOrderId: string | null = null;
  intentBannerVisible = false;
  intentCreatedAt: string | null = null;

  submitting = false;

  // ===== Lifecycle =====
  constructor() {
    this.customerForm = this.fb.group({
      customerType: ['registered', Validators.required],
      userDisplay: [''],
      guestEmail: [''],
      firstName: [''],
      lastName: [''],
      phone: [''],
    });

    this.paymentForm = this.fb.group({
      paymentMethod: ['', Validators.required],
      paymentReference: ['', [Validators.maxLength(120)]],
      codigo: [''],
      useOverride: [false],
      amountOverride: [null as number | null],
    });

    this.confirmForm = this.fb.group({
      adminReason: ['',
        [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
      ],
      confirmed: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    this.detectRoles();
    if (!this.canCreateManualSale) {
      this.snackBar.open(
        'No tiene permisos para registrar ventas manuales.',
        'Cerrar', { duration: 4000 },
      );
      this.router.navigate(['/pages-admin/ventas']);
      return;
    }

    this.setupCustomerTypeReactivity();
    this.setupSearchPipelines();
    this.setupPaymentRecalc();
    this.setupPaymentMethodReactivity();
    this.setupCouponReactivity();

    // Precarga desde carrito abandonado o desde Payment existente si viene
    // en queryParams. Prioridad: fromPayment > fromIntent.
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(qp => {
      const paymentIdRaw = qp.get('fromPayment');
      if (paymentIdRaw) {
        const pid = Number(paymentIdRaw);
        if (Number.isFinite(pid) && pid > 0) {
          this.prefillFromPayment(pid);
          return;
        }
      }
      const orderId = qp.get('fromIntent');
      if (orderId) {
        this.prefillFromIntent(orderId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.userSearch$.complete();
  }

  // ===== Roles =====
  private detectRoles(): void {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) { this.canCreateManualSale = false; return; }
      const u = JSON.parse(raw);
      const roles: string[] = Array.isArray(u?.roles) ? u.roles : [];
      this.canCreateManualSale =
        roles.includes('ADMIN') || roles.includes('SUPADMIN');
    } catch {
      this.canCreateManualSale = false;
    }
  }

  // ===== Stepper =====
  getStepStatus(stepId: number): 'done' | 'current' | 'future' {
    if (stepId < this.currentStep) return 'done';
    if (stepId === this.currentStep) return 'current';
    return 'future';
  }

  canNavigateToStep(stepId: number): boolean {
    if (stepId <= this.currentStep) return true;
    for (let i = this.currentStep; i < stepId; i++) {
      if (!this.isStepValid(i)) return false;
    }
    return true;
  }

  navigateToStep(stepId: number): void {
    if (!this.canNavigateToStep(stepId)) return;
    if (this.currentStep === stepId) return;
    this.currentStep = stepId;
    this.scrollStepIntoView();
  }

  async nextStep(): Promise<void> {
    if (!this.isStepValid(this.currentStep)) {
      this.markStepTouched(this.currentStep);
      this.snackBar.open(
        'Complete los campos del paso actual antes de continuar.',
        'Cerrar', { duration: 3500 },
      );
      return;
    }
    // Gate de override: si estamos saliendo del Paso 2 y hay override
    // significativo, exigimos confirmacion antes de avanzar.
    if (this.currentStep === 2 && this.paymentForm.get('useOverride')?.value) {
      const confirmed = await this.confirmOverride();
      if (!confirmed) return;
    }
    if (this.currentStep < this.wizardSteps.length - 1) {
      this.currentStep += 1;
      this.scrollStepIntoView();
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep -= 1;
      this.scrollStepIntoView();
    }
  }

  /**
   * Lleva el scroll al inicio absoluto al cambiar de paso del wizard.
   * El viewport scrollable en Nebular NO es `window`: vive dentro de
   * `nb-layout.window-mode.with-scroll .scrollable-container`. El header
   * de Nebular es `[fixed]`, asi que queda sobre el viewport sin formar
   * parte del scroll; por eso aqui buscamos el contenedor scrollable
   * real y lo llevamos a `scrollTop = 0` (con smooth si se puede).
   * Respeta `prefers-reduced-motion` y usa varios fallbacks.
   */
  private scrollStepIntoView(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';

    // Doble RAF: el primer RAF garantiza que Angular aplico el DOM del
    // nuevo paso; el segundo, que el layout es estable.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const root = this.host?.nativeElement as HTMLElement | undefined;
      const anchor =
        root?.querySelector<HTMLElement>('.wizard-card') ||
        root?.querySelector<HTMLElement>('.venta-manual-page') ||
        root;

      const scrollEl = anchor ? this.findScrollableAncestor(anchor) : null;

      if (scrollEl) {
        let smoothFailed = false;
        try {
          scrollEl.scrollTo({ top: 0, left: 0, behavior });
        } catch {
          smoothFailed = true;
        }
        // Red de seguridad: algunos contenedores ignoran `behavior:smooth`
        // o el `scrollTo` programatico; forzamos la asignacion directa
        // si despues de la animacion no quedo arriba.
        setTimeout(() => {
          if (smoothFailed || scrollEl.scrollTop > 1) {
            scrollEl.scrollTop = 0;
          }
        }, reduced ? 0 : 450);
        return;
      }

      // Fallback: API oficial de Nebular (cubre el modo donde el scroll
      // vive en `window`/body en lugar de un contenedor interno).
      try {
        this.nbScroll.scrollTo(0, 0);
      } catch {
        window.scrollTo({ top: 0, behavior });
      }
    }));
  }

  /**
   * Sube por el DOM desde `el` hasta encontrar el primer ancestro con
   * `overflow-y` igual a `auto`/`scroll`/`overlay` y `scrollHeight`
   * mayor que su `clientHeight`. En Nebular suele resolver al
   * `<div class="scrollable-container">` dentro de `<nb-layout>`.
   */
  private findScrollableAncestor(el: HTMLElement): HTMLElement | null {
    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY;
      const isScrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
      if (isScrollable && node.scrollHeight > node.clientHeight + 1) {
        return node;
      }
      node = node.parentElement;
    }
    // Fallback explicito al contenedor Nebular si por algun motivo el
    // walk no lo detecto (p.ej. computed style aun no listo).
    return document.querySelector<HTMLElement>('nb-layout .scrollable-container');
  }

  goBack(): void {
    this.location.back();
  }

  private isStepValid(stepId: number): boolean {
    switch (stepId) {
      case 0: return this.isCustomerStepValid();
      case 1: return this.selectedDocs.length > 0;
      case 2: return this.isPaymentStepValid();
      case 3: return this.confirmForm.valid;
      default: return true;
    }
  }

  private markStepTouched(stepId: number): void {
    switch (stepId) {
      case 0: this.customerForm.markAllAsTouched(); break;
      case 2: this.paymentForm.markAllAsTouched(); break;
      case 3: this.confirmForm.markAllAsTouched(); break;
    }
  }

  // ===== Paso 0: Cliente =====
  private setupCustomerTypeReactivity(): void {
    this.customerForm.get('customerType')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tipo: string) => {
        if (tipo === 'guest') {
          this.customerForm.get('guestEmail')!
            .setValidators([Validators.required, Validators.email, Validators.maxLength(120)]);
          this.customerForm.get('firstName')!
            .setValidators([Validators.required, Validators.maxLength(80)]);
          this.customerForm.get('userDisplay')!.clearValidators();
          this.selectedUser = null;
          this.customerForm.patchValue({ userDisplay: '' }, { emitEvent: false });
        } else {
          this.customerForm.get('userDisplay')!.setValidators([Validators.required]);
          this.customerForm.get('guestEmail')!.clearValidators();
          this.customerForm.get('firstName')!.clearValidators();
        }
        this.customerForm.get('guestEmail')!.updateValueAndValidity({ emitEvent: false });
        this.customerForm.get('firstName')!.updateValueAndValidity({ emitEvent: false });
        this.customerForm.get('userDisplay')!.updateValueAndValidity({ emitEvent: false });
      });
  }

  onUserSearchInput(value: string): void {
    if (this.selectedUser && value !== this.formatUserLabel(this.selectedUser)) {
      this.selectedUser = null;
    }
    this.userSearch$.next(value);
  }

  displayUser = (u: User | null): string => {
    if (!u) return '';
    return `${u.name || u.email} (${u.email})`;
  };

  formatUserLabel(u: SelectedClientUser): string {
    return `${u.displayName} (${u.email}) - ID ${u.userId}`;
  }

  selectUser(user: User): void {
    if (!user || !user.id) return;
    this.selectedUser = {
      userId: Number(user.id),
      displayName: user.name || user.email,
      email: user.email,
    };
    this.customerForm.patchValue(
      { userDisplay: this.formatUserLabel(this.selectedUser) },
      { emitEvent: false },
    );
    this.filteredUsers = [];
  }

  clearUserSelection(): void {
    this.selectedUser = null;
    this.customerForm.patchValue({ userDisplay: '' });
  }

  private isCustomerStepValid(): boolean {
    const type = this.customerForm.get('customerType')!.value;
    if (type === 'registered') {
      return !!this.selectedUser;
    }
    return this.customerForm.get('guestEmail')!.valid
        && this.customerForm.get('firstName')!.valid;
  }

  // ===== Paso 1: Productos =====
  removeDocument(id: number): void {
    this.selectedDocs = this.selectedDocs.filter(d => d.id !== id);
    this.recalcSubtotal();
  }

  /**
   * Live-sync con el explorador de catalogo: cada vez que el usuario
   * marca/desmarca un checkbox, el explorador emite la lista completa
   * y el carrito del wizard se reemplaza inmediatamente.
   */
  onCatalogSelectionChange(items: CatalogExplorerItem[]): void {
    this.selectedDocs = (items || []).map((it: CatalogExplorerItem) => ({
      id: it.id,
      title: it.title,
      price: Number(it.price || 0),
      category: it.category,
      materia: it.materia,
      nivel: it.nivel,
      thumbUrl: it.thumbUrl,
      isKit: it.isKit,
    }));
    this.recalcSubtotal();
  }

  /**
   * Vacia el carrito desde el panel lateral. Soft-delete: ofrece un
   * snackbar "Deshacer" durante 4.5s antes de aplicarse de forma definitiva.
   */
  onClearCart(): void {
    if (this.selectedDocs.length === 0) return;
    const snapshot = [...this.selectedDocs];
    this.selectedDocs = [];
    this.recalcSubtotal();
    this.snackBar.open('Carrito vaciado', 'Deshacer', { duration: 4500 })
      .onAction().subscribe(() => {
        this.selectedDocs = snapshot;
        this.recalcSubtotal();
      });
  }

  // ===== Paso 2: Pago =====
  /**
   * Hint visible en el placeholder del campo de referencia/voucher segun
   * el metodo elegido. Sirve para guiar al admin sobre que dato pegar.
   */
  voucherHintForMethod(method: string | null): string {
    switch (method) {
      case 'MANUAL_YAPE':
      case 'MANUAL_PLIN':
        return 'Codigo de operacion de 6 digitos (ej: 123456)';
      case 'MANUAL_TRANSFER':
        return 'N. de operacion bancaria (ej: 9876543210)';
      case 'MANUAL_DEPOSIT':
        return 'N. de voucher de deposito en agente';
      case 'MANUAL_OTHER':
        return 'Identifica brevemente como llego el pago';
      default:
        return 'Identificador del pago';
    }
  }

  /**
   * Indica si el campo de referencia debe ocultarse para el metodo dado.
   * Cuando el cliente paga en efectivo no hay numero de operacion.
   */
  isVoucherHidden(method: string | null): boolean {
    return method === 'MANUAL_CASH';
  }

  /**
   * Reacciona a cambios de metodo de pago: si el metodo no admite voucher
   * (efectivo), limpia el campo. La referencia siempre es OPCIONAL para
   * todos los demas metodos: solo se aplica maxLength como restriccion.
   */
  private setupPaymentMethodReactivity(): void {
    this.paymentForm.get('paymentMethod')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((method: string | null) => {
        const ref = this.paymentForm.get('paymentReference')!;
        if (this.isVoucherHidden(method)) {
          ref.setValue('', { emitEvent: false });
        }
        ref.setValidators([Validators.maxLength(120)]);
        ref.updateValueAndValidity({ emitEvent: false });
      });
  }

  /**
   * Reactividad del cupon: si el admin cambia el texto despues de validar,
   * eliminamos el descuento aplicado para no dejar un estado inconsistente.
   */
  private setupCouponReactivity(): void {
    this.paymentForm.get('codigo')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        const v = (value || '').trim();
        if (this.appliedCouponCode && v !== this.appliedCouponCode) {
          this.appliedCouponCode = '';
          this.couponPct = 0;
          this.couponDiscount = 0;
          this.recomputeTotals();
        }
      });
  }

  private setupPaymentRecalc(): void {
    this.paymentForm.get('useOverride')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((use: boolean) => {
        const ctrl = this.paymentForm.get('amountOverride')!;
        if (use) {
          ctrl.setValidators([
            Validators.required,
            Validators.min(0.01),
            Validators.max(this.OVERRIDE_MAX_ABSOLUTE),
          ]);
          if (ctrl.value == null || ctrl.value === '') {
            ctrl.setValue(this.computedTotal, { emitEvent: false });
          }
        } else {
          ctrl.clearValidators();
          ctrl.setValue(null, { emitEvent: false });
        }
        ctrl.updateValueAndValidity({ emitEvent: false });
        this.recomputeFinalAmount();
      });

    this.paymentForm.get('amountOverride')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recomputeFinalAmount());
  }

  private recalcSubtotal(): void {
    const sum = this.selectedDocs.reduce((acc, it) => acc + Number(it.price || 0), 0);
    this.subtotal = Math.round(sum * 100) / 100;
    this.recomputeTotals();
  }

  private recomputeTotals(): void {
    const pct = Number(this.couponPct || 0);
    this.couponDiscount = Math.round((this.subtotal * pct / 100) * 100) / 100;
    this.computedTotal = Math.max(0, Math.round((this.subtotal - this.couponDiscount) * 100) / 100);
    this.recomputeFinalAmount();
  }

  private recomputeFinalAmount(): void {
    if (this.paymentForm.get('useOverride')!.value) {
      const o = Number(this.paymentForm.get('amountOverride')!.value || 0);
      this.finalAmount = Math.round(o * 100) / 100;
    } else {
      this.finalAmount = this.computedTotal;
    }
    this.overrideDelta = Math.round((this.finalAmount - this.computedTotal) * 100) / 100;
  }

  validateCoupon(): void {
    const code = ((this.paymentForm.get('codigo')?.value as string) || '').trim();
    if (!code) {
      this.snackBar.open('Ingrese un codigo de cupon.', 'Cerrar', { duration: 2500 });
      return;
    }
    if (this.subtotal <= 0) {
      this.snackBar.open('Agregue productos antes de aplicar el cupon.', 'Cerrar', { duration: 3000 });
      return;
    }
    this.validatingCoupon = true;
    this.cuponService.getValidar(code).subscribe({
      next: (resp: any) => {
        this.validatingCoupon = false;
        if (resp?.result && resp.data && Number(resp.data.descuento || 0) > 0) {
          this.couponPct = Number(resp.data.descuento);
          this.appliedCouponCode = code;
          this.recomputeTotals();
          this.snackBar.open(`Cupon aplicado: -${this.couponPct}%`, 'Cerrar', { duration: 2500 });
        } else {
          this.snackBar.open('Cupon invalido o sin descuento porcentual.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.validatingCoupon = false;
        this.snackBar.open('Error validando el cupon.', 'Cerrar', { duration: 3000 });
      },
    });
  }

  clearCoupon(): void {
    this.appliedCouponCode = '';
    this.couponPct = 0;
    this.couponDiscount = 0;
    this.paymentForm.patchValue({ codigo: '' });
    this.recomputeTotals();
  }

  /**
   * Dispara el dialog de confirmacion del override si el delta supera
   * el threshold. Devuelve true si el override fue confirmado (o no
   * requeria confirmacion) y false si el admin lo rechazo o cancelo.
   * Se invoca tanto en (blur) del input como en `nextStep()` para gating.
   */
  confirmOverride(): Promise<boolean> {
    if (!this.paymentForm.get('useOverride')!.value) {
      return Promise.resolve(true);
    }
    const delta = this.overrideDelta;
    const threshold = Math.max(this.OVERRIDE_ABS_THRESHOLD, this.computedTotal * 0.01);
    if (Math.abs(delta) < threshold) {
      return Promise.resolve(true);
    }

    // Cap relativo: no permitimos +/- 50% del computado sin dejar
    // expresamente el monto en el limite
    if (this.computedTotal > 0) {
      const maxAbs = this.computedTotal * this.OVERRIDE_MAX_RELATIVE;
      if (Math.abs(delta) > maxAbs) {
        this.snackBar.open(
          `El monto manual no puede diferir mas de ${Math.round(this.OVERRIDE_MAX_RELATIVE * 100)}% (S/ ${maxAbs.toFixed(2)}) del calculado.`,
          'Cerrar', { duration: 4500 },
        );
        return Promise.resolve(false);
      }
    }

    const data: ConfirmOverrideData = {
      computedTotal: this.computedTotal,
      finalAmount: this.finalAmount,
      delta,
    };
    return new Promise<boolean>(resolve => {
      this.dialog.open<
        ConfirmAmountOverrideDialogComponent, ConfirmOverrideData, boolean
      >(ConfirmAmountOverrideDialogComponent, { data, width: '440px', autoFocus: false })
        .afterClosed().subscribe(confirmed => {
          if (confirmed === false) {
            this.paymentForm.patchValue({ amountOverride: this.computedTotal });
            resolve(false);
            return;
          }
          resolve(confirmed === true);
        });
    });
  }

  /** Restaura el monto manual al calculado y apaga el toggle. */
  restoreComputedAmount(): void {
    this.paymentForm.patchValue(
      { useOverride: false, amountOverride: null },
      { emitEvent: true },
    );
    this.snackBar.open('Monto restaurado al calculado', 'Cerrar', { duration: 2500 });
  }

  /** Sugerencias rapidas de motivo administrativo segun metodo de pago. */
  getReasonSuggestions(): string[] {
    const method = this.paymentForm.get('paymentMethod')?.value;
    const ref = (this.paymentForm.get('paymentReference')?.value || '').trim();
    const refPart = ref ? ` (operacion ${ref})` : '';
    switch (method) {
      case 'MANUAL_CASH':
        return [
          'Pago en efectivo recibido en tienda, confirmado en caja.',
          'Pago en efectivo verificado por el equipo administrativo.',
        ];
      case 'MANUAL_YAPE':
        return [
          `Yape verificado${refPart}, captura recibida por whatsapp.`,
          `Pago Yape confirmado${refPart} en cuenta del negocio.`,
        ];
      case 'MANUAL_PLIN':
        return [
          `Plin verificado${refPart}, captura recibida por whatsapp.`,
          `Pago Plin confirmado${refPart} en cuenta del negocio.`,
        ];
      case 'MANUAL_TRANSFER':
        return [
          `Transferencia bancaria confirmada${refPart} en cuenta del negocio.`,
          `Transferencia BCP/Interbank verificada${refPart} con voucher.`,
        ];
      case 'MANUAL_DEPOSIT':
        return [
          `Deposito en agente verificado${refPart} con voucher fisico.`,
          `Deposito recibido en cuenta del negocio${refPart}.`,
        ];
      case 'MANUAL_OTHER':
        return [
          'Pago confirmado por canal alterno. Adjuntar detalle aqui.',
        ];
      default:
        return [];
    }
  }

  /** Aplica una sugerencia al textarea de motivo administrativo. */
  applyReasonSuggestion(text: string): void {
    if (!text) return;
    this.confirmForm.patchValue({ adminReason: text });
    this.confirmForm.get('adminReason')?.markAsDirty();
    this.confirmForm.get('adminReason')?.markAsTouched();
  }

  /**
   * Abre la vista previa del email que recibira el cliente. Se nutre del
   * estado actual del wizard (cliente + productos + totales + metodo).
   */
  openEmailPreview(): void {
    const isGuest = this.customerForm.get('customerType')!.value === 'guest';
    const clientName = isGuest
      ? `${this.customerForm.get('firstName')?.value || ''} ${this.customerForm.get('lastName')?.value || ''}`.trim()
        || 'Cliente'
      : (this.selectedUser?.displayName || 'Cliente');
    const clientEmail = isGuest
      ? (this.customerForm.get('guestEmail')?.value || '')
      : (this.selectedUser?.email || '');

    const data: EmailPreviewData = {
      clientName,
      clientEmail,
      isGuest,
      items: this.selectedDocs.map(d => ({
        id: d.id, title: d.title, price: d.price, isKit: d.isKit,
      })),
      subtotal: this.subtotal,
      couponCode: this.appliedCouponCode,
      couponPct: this.couponPct,
      couponDiscount: this.couponDiscount,
      total: this.finalAmount,
      paymentMethodLabel: this.paymentMethodLabel(this.paymentForm.get('paymentMethod')?.value),
      paymentMethod: this.paymentForm.get('paymentMethod')?.value || '',
      paymentReference: this.paymentForm.get('paymentReference')?.value || '',
    };

    this.dialog.open(EmailPreviewDialogComponent, {
      data,
      width: '720px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'epd-dialog-panel',
    });
  }

  private isPaymentStepValid(): boolean {
    if (!this.paymentForm.get('paymentMethod')!.valid) return false;
    if (this.paymentForm.get('useOverride')!.value) {
      return this.paymentForm.get('amountOverride')!.valid && this.finalAmount > 0;
    }
    return this.computedTotal > 0;
  }

  paymentMethodLabel(value: string | null | undefined): string {
    if (!value) return '-';
    const found = this.methodOptions.find(o => o.value === value);
    return found ? found.label : value;
  }

  /** Icono Material que representa al metodo de pago seleccionado. */
  paymentMethodIcon(value: string | null | undefined): string {
    if (!value) return 'payments';
    const found = this.methodOptions.find(o => o.value === value);
    return found ? found.icon : 'payments';
  }

  // ===== Pipelines de busqueda =====
  private setupSearchPipelines(): void {
    // Busqueda de usuarios (autocomplete del Paso 0)
    this.userSearch$.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.trim().length < 2) {
          return of({ data: [] as User[] });
        }
        return this.usersService.searchUser(term.trim())
          .pipe(catchError(() => of({ data: [] as User[] } as any)));
      }),
    ).subscribe((res: any) => {
      this.filteredUsers = (res?.data || []) as User[];
    });
  }

  // ===== Precarga desde PaymentIntent abandonado =====
  private prefillFromIntent(orderId: string): void {
    this.paymentService.getAbandonedCartPrefill(orderId).subscribe({
      next: (resp) => {
        const data: ManualPaymentRequest | undefined = resp?.data as any;
        if (!resp?.result || !data) {
          this.snackBar.open(
            'No se pudo precargar el carrito abandonado. Continue manualmente.',
            'Cerrar', { duration: 4000 },
          );
          return;
        }
        this.sourceIntentOrderId = orderId;
        this.intentBannerVisible = true;

        // Cliente
        if (data.userId) {
          this.customerForm.patchValue({ customerType: 'registered' });
          // Buscamos al usuario para mostrar su display correctamente
          this.usersService.searchUser(data.guestEmail || String(data.userId))
            .pipe(catchError(() => of({ data: [] as User[] } as any)))
            .subscribe((res: any) => {
              const list: User[] = (res?.data || []) as User[];
              const u = list.find(x => Number(x.id) === Number(data.userId));
              if (u) this.selectUser(u);
            });
        } else {
          this.customerForm.patchValue({
            customerType: 'guest',
            guestEmail: data.guestEmail || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
          });
        }

        // Productos: traemos titulos/precios desde el backend
        const ids = (data.documentIds || []).filter(id => Number(id) > 0);
        if (ids.length > 0) {
          // Pedimos cada uno usando el filtro por id no es estandar, asi que
          // usamos searchDocuments por ids individuales solo si es necesario;
          // en la practica el endpoint /api/v1/document/{id} ya devuelve la
          // info detallada.
          this.preloadIntentDocuments(ids);
        }

        // Pago
        if (data.paymentMethod) {
          this.paymentForm.patchValue({ paymentMethod: data.paymentMethod });
        }
        if (data.codigo) {
          this.paymentForm.patchValue({ codigo: data.codigo });
        }

        this.snackBar.open(
          `Carrito ${orderId} precargado. Revise los datos antes de confirmar.`,
          'Cerrar', { duration: 4500 },
        );
      },
      error: () => {
        this.snackBar.open(
          'No se pudo precargar el carrito. Continue manualmente.',
          'Cerrar', { duration: 4000 },
        );
      },
    });
  }

  // ===== Precarga desde Payment existente (re-procesar pago fallido) =====
  private prefillFromPayment(paymentId: number): void {
    this.paymentService.getManualPrefillFromPayment(paymentId).subscribe({
      next: (resp) => {
        const data: ManualPaymentRequest | undefined = resp?.data as any;
        if (!resp?.result || !data) {
          this.snackBar.open(
            'No se pudo precargar el payment. Continue manualmente.',
            'Cerrar', { duration: 4000 },
          );
          return;
        }
        // No marcamos sourceIntentOrderId aqui: el origen es un Payment ya
        // existente, no un PaymentIntent abandonado. El motivo administrativo
        // ya viene precargado desde el backend ("Re-procesar payment #X").

        if (data.adminReason) {
          this.paymentForm.patchValue({ adminReason: data.adminReason });
        }

        // Cliente
        if (data.userId) {
          this.customerForm.patchValue({ customerType: 'registered' });
          this.usersService.searchUser(data.guestEmail || String(data.userId))
            .pipe(catchError(() => of({ data: [] as User[] } as any)))
            .subscribe((res: any) => {
              const list: User[] = (res?.data || []) as User[];
              const u = list.find(x => Number(x.id) === Number(data.userId));
              if (u) this.selectUser(u);
            });
        } else if (data.guestEmail) {
          this.customerForm.patchValue({
            customerType: 'guest',
            guestEmail: data.guestEmail || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
          });
        }

        const ids = (data.documentIds || []).filter(id => Number(id) > 0);
        if (ids.length > 0) {
          this.preloadIntentDocuments(ids);
        }

        if (data.paymentMethod) {
          this.paymentForm.patchValue({ paymentMethod: data.paymentMethod });
        }
        if (data.codigo) {
          this.paymentForm.patchValue({ codigo: data.codigo });
        }

        this.snackBar.open(
          `Payment #${paymentId} cargado. Verifique los datos antes de confirmar.`,
          'Cerrar', { duration: 4500 },
        );
      },
      error: (err) => {
        const msg = err?.status === 404
          ? `Payment #${paymentId} no encontrado.`
          : 'No se pudo precargar el payment. Continue manualmente.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  private preloadIntentDocuments(ids: number[]): void {
    // Resolver titulos/precios de cada id. Hacemos llamadas en paralelo.
    const calls = ids.map(id => this.documentsService.getDocument(String(id))
      .pipe(catchError(() => of(null as any))));
    // Combinamos secuencialmente (no necesitamos verdadero combine, son pocos)
    Promise.all(calls.map(o => o.toPromise())).then(results => {
      const docs: SelectedDocument[] = [];
      for (const r of results) {
        const d = (r as any)?.data;
        if (!d || !d.id) continue;
        docs.push({
          id: Number(d.id),
          title: d.title,
          price: Number(d.price || 0),
          category: d.category,
          materia: d.materia,
          nivel: d.nivel,
          thumbUrl: d.imagenThumbUrlPublic || d.imagenUrlPublic,
          isKit: !!d.esKitPlanificacion,
        });
      }
      this.selectedDocs = docs;
      this.recalcSubtotal();
    });
  }

  // ===== Submit =====
  submit(): void {
    if (this.submitting) return;
    if (!this.isStepValid(0) || !this.isStepValid(1) ||
        !this.isStepValid(2) || !this.isStepValid(3)) {
      this.snackBar.open(
        'Revise los pasos anteriores antes de registrar la venta.',
        'Cerrar', { duration: 3500 },
      );
      return;
    }

    const customerType = this.customerForm.get('customerType')!.value as string;
    const documentIds = this.selectedDocs.map(d => d.id);

    const payload: ManualPaymentRequest = {
      userId: customerType === 'registered'
        ? (this.selectedUser?.userId ?? null)
        : null,
      guestEmail: customerType === 'guest'
        ? (this.customerForm.get('guestEmail')?.value || undefined)
        : undefined,
      firstName: customerType === 'guest'
        ? (this.customerForm.get('firstName')?.value || undefined)
        : undefined,
      lastName: customerType === 'guest'
        ? (this.customerForm.get('lastName')?.value || undefined)
        : undefined,
      phone: customerType === 'guest'
        ? (this.customerForm.get('phone')?.value || undefined)
        : undefined,
      documentIds,
      codigo: (this.paymentForm.get('codigo')?.value || '').trim() || undefined,
      paymentMethod: this.paymentForm.get('paymentMethod')!.value as ManualPaymentMethod,
      paymentReference: (this.paymentForm.get('paymentReference')?.value || '').trim() || undefined,
      amountOverride: this.paymentForm.get('useOverride')!.value
        ? Number(this.paymentForm.get('amountOverride')!.value)
        : null,
      adminReason: (this.confirmForm.get('adminReason')!.value || '').trim(),
      sourceIntentOrderId: this.sourceIntentOrderId || undefined,
    };

    this.submitting = true;
    this.paymentService.createManualPayment(payload).subscribe({
      next: (resp) => {
        this.submitting = false;
        if (resp?.result && resp.data) {
          this.snackBar.open(
            `Venta registrada (ID ${resp.data.paymentId}). Email enviado a ${resp.data.userEmail}.`,
            'Cerrar', { duration: 5000 },
          );
          this.router.navigate(['/pages-admin/ventas']);
        } else {
          this.snackBar.open(
            'No se pudo registrar la venta. Revise los datos e intente nuevamente.',
            'Cerrar', { duration: 4500 },
          );
        }
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message
          || err?.message
          || 'Error registrando la venta manual.';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      },
    });
  }
}
