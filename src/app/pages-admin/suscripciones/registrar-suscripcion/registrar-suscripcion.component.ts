import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Location, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { UsersService } from '../../../@core/backend/services/users.service';
import { SubscriptionAdminService } from '../../../@core/backend/services/subscription-admin.service';
import { MembresiaService } from '../../../@core/backend/services/membresia.service';
import { SuscripcionesApi } from '../../../@core/backend/api/suscripciones.api';
import { SubscriptionTypesApi } from '../../../@core/backend/api/subscription-types.api';
import { UnitScheduleService } from '../../../@core/backend/services/unit-schedule.service';
import { CuponService } from '../../../@core/backend/services/cupon.service';
import { User } from '../../../@core/interfaces/users';
import { SubscriptionType } from '../../../@core/data/subscription-types';
import { Materias } from '../../../@core/interfaces/membresia';
import {
  OpcionByMateria,
  AdminManualSubscriptionRequest,
  MateriaSeleccionadaRequest
} from '../../../@core/interfaces/suscripciones';
import { UnitSchedule } from '../../../@core/interfaces/unit-schedule';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
  MatExpansionPanelDescription
} from '@angular/material/expansion';
import { MatCard, MatCardContent } from '@angular/material/card';

interface SelectedUser {
  id: number;
  name: string;
  email: string;
}

interface OpcionConPrecio extends OpcionByMateria {
  ahora?: number;
  antes?: number;
}

interface SelectedOpcionSummary {
  id: number;
  nombre: string;
  precio: number | null;
}

interface SelectedMateriaSummary {
  materiaId: number;
  materiaNombre: string;
  opciones: SelectedOpcionSummary[];
  descuentoCantidadPct: number;
  subtotal: number;
}

@Component({
  selector: 'ngx-registrar-suscripcion',
  templateUrl: './registrar-suscripcion.component.html',
  styleUrls: ['./registrar-suscripcion.component.scss'],
  standalone: true,
  imports: [
    MatIconButton, MatIcon, MatButton, MatProgressSpinner,
    MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatSuffix, MatInput, MatSelect, MatOption,
    MatCheckbox, FormsModule, ReactiveFormsModule,
    MatAutocomplete, MatAutocompleteTrigger,
    MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription,
    MatCard, MatCardContent, RouterLink, DatePipe, DecimalPipe, NgTemplateOutlet
  ]
})
export class RegistrarSuscripcionComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private subscriptionAdminService = inject(SubscriptionAdminService);
  private membresiaService = inject(MembresiaService);
  private suscripcionesApi = inject(SuscripcionesApi);
  private subscriptionTypesApi = inject(SubscriptionTypesApi);
  private unitScheduleService = inject(UnitScheduleService);
  private cuponService = inject(CuponService);
  private snackBar = inject(MatSnackBar);

  userForm: FormGroup;
  membershipForm: FormGroup;
  paymentsForm: FormGroup;
  couponForm: FormGroup;
  confirmForm: FormGroup;

  currentStep = 0;
  loadingTypes = false;
  loadingMaterias = false;
  typesLoadError = false;
  submitting = false;
  validatingCoupon = false;
  isSupAdmin = false;

  readonly wizardSteps = [
    { id: 0, label: 'Usuario', icon: 'person_search' },
    { id: 1, label: 'Membresia', icon: 'card_membership' },
    { id: 2, label: 'Cuotas', icon: 'payments' },
    { id: 3, label: 'Confirmar', icon: 'fact_check' }
  ] as const;

  filteredUsers: User[] = [];
  selectedUser: SelectedUser | null = null;
  private userSearch$ = new Subject<string>();

  subscriptionTypes: SubscriptionType[] = [];
  materiasDisponibles: Materias[] = [];
  opcionesPorMateria = new Map<number, OpcionConPrecio[]>();
  selectedOpcionesByMateria = new Map<number, Set<number>>();
  selectedMateriaIds = new Set<number>();

  availableUnits: UnitSchedule[] = [];
  unitsByYear: { year: number; units: UnitSchedule[] }[] = [];
  selectedYear: number | null = null;

  subtotalBeforeCoupon = 0;
  couponDiscountAmount = 0;
  calculatedTotal = 0;
  installments: { cuotas: number; montoPorCuota: number } = { cuotas: 1, montoPorCuota: 0 };
  selectedCuota: number | null = null;
  cuotasArray: number[] = [1];
  private montoPorCuotaCache: Record<number, number> = {};

  discount = 0;
  discountFixedAmount = 0;
  promoApplied = false;
  appliedCouponCode = '';

  private searchSub = this.userSearch$.pipe(
    debounceTime(400),
    distinctUntilChanged(),
    switchMap(term => {
      if (!term || term.trim().length < 2) {
        return of({ data: [] as User[] });
      }
      return this.usersService.searchUser(term.trim()).pipe(
        catchError(() => of({ data: [] as User[] }))
      );
    })
  ).subscribe(res => {
    this.filteredUsers = res.data || [];
  });

  constructor() {
    this.userForm = this.fb.group({ userDisplay: ['', Validators.required] });
    this.membershipForm = this.fb.group({
      subscriptionTypeId: [null, Validators.required],
      unitScheduleId: [null, Validators.required]
    });
    this.paymentsForm = this.fb.group({
      useManualPayments: [false],
      manualTotalCuotas: [1, [Validators.required, Validators.min(1), Validators.max(24)]],
      manualTotalTarget: [null as number | null, [Validators.min(0.01)]],
      manualMontosCuota: this.fb.array([this.createManualCuotaControl(null)]),
      totalCuotas: [{ value: 1, disabled: true }],
      montoPorCuota: [{ value: 0, disabled: true }],
      markFirstInstallmentPaid: [true]
    });
    this.couponForm = this.fb.group({ codigo: [''] });
    this.confirmForm = this.fb.group({
      adminReason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]]
    });
  }

  ngOnInit(): void {
    this.detectSupAdmin();
    this.loadSubscriptionTypes();
    this.paymentsForm.get('manualTotalCuotas')?.valueChanges.subscribe(() => {
      if (this.useManualPayments) {
        this.rebuildManualCuotasArray();
      }
    });
  }

  get manualMontosCuota(): FormArray {
    return this.paymentsForm.get('manualMontosCuota') as FormArray;
  }

  private createManualCuotaControl(value: number | null) {
    return this.fb.control(value, [Validators.required, Validators.min(0.01)]);
  }

  rebuildManualCuotasArray(prefillAmount?: number | null): void {
    const n = Math.min(24, Math.max(1, Number(this.paymentsForm.get('manualTotalCuotas')?.value) || 1));
    const current = this.getManualMontosList();
    const arr = this.manualMontosCuota;
    while (arr.length > n) {
      arr.removeAt(arr.length - 1);
    }
    while (arr.length < n) {
      const idx = arr.length;
      const prev = current[idx];
      const val = prev != null && prev > 0 ? prev : (prefillAmount != null && prefillAmount > 0 ? prefillAmount : null);
      arr.push(this.createManualCuotaControl(val));
    }
    if (prefillAmount != null && prefillAmount > 0) {
      for (let i = 0; i < arr.length; i++) {
        const c = arr.at(i);
        if (c.value == null || Number(c.value) <= 0) {
          c.setValue(prefillAmount);
        }
      }
    }
  }

  getManualMontosList(): number[] {
    return this.manualMontosCuota.controls.map(c => {
      const v = Number(c.value);
      return Math.round(v * 100) / 100;
    });
  }

  getManualCuotasTotal(): number {
    const sum = this.manualMontosCuota.controls.reduce((acc, c) => {
      const v = Number(c.value);
      return acc + (v > 0 && !Number.isNaN(v) ? v : 0);
    }, 0);
    return Math.round(sum * 100) / 100;
  }

  distributeManualCuotasEqually(): void {
    const n = Math.min(24, Math.max(1, Number(this.paymentsForm.get('manualTotalCuotas')?.value) || 1));
    const targetRaw = Number(this.paymentsForm.get('manualTotalTarget')?.value);
    const total = targetRaw > 0 ? targetRaw : (this.calculatedTotal > 0 ? this.calculatedTotal : 0);
    if (total <= 0) {
      this.showMessage('Indique un total a repartir o calcule precios en membresia', 'error');
      return;
    }
    this.rebuildManualCuotasArray();
    const base = Math.floor((total / n) * 100) / 100;
    let remainder = Math.round((total - base * n) * 100) / 100;
    for (let i = 0; i < n; i++) {
      let amount = base;
      if (i === n - 1) {
        amount = Math.round((base + remainder) * 100) / 100;
      } else if (remainder >= 0.01) {
        amount = Math.round((base + 0.01) * 100) / 100;
        remainder = Math.round((remainder - 0.01) * 100) / 100;
      }
      this.manualMontosCuota.at(i).setValue(amount);
    }
  }

  ngOnDestroy(): void {
    this.searchSub.unsubscribe();
    this.userSearch$.complete();
  }

  private detectSupAdmin(): void {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const user = JSON.parse(raw);
        this.isSupAdmin = Array.isArray(user.roles) && user.roles.includes('SUPADMIN');
      }
    } catch {
      this.isSupAdmin = false;
    }
  }

  loadSubscriptionTypes(): void {
    this.loadingTypes = true;
    this.typesLoadError = false;
    this.subscriptionTypesApi.getAllActive().subscribe({
      next: types => {
        this.subscriptionTypes = types || [];
        this.loadingTypes = false;
        if (this.subscriptionTypes.length === 0) {
          this.typesLoadError = true;
        }
      },
      error: () => {
        this.showMessage('Error al cargar tipos de membresia', 'error');
        this.loadingTypes = false;
        this.typesLoadError = true;
      }
    });
  }

  getStepStatus(stepId: number): 'done' | 'current' | 'upcoming' {
    if (this.currentStep > stepId) {
      return 'done';
    }
    if (this.currentStep === stepId) {
      return 'current';
    }
    return 'upcoming';
  }

  canNavigateToStep(stepId: number): boolean {
    return stepId <= this.currentStep;
  }

  navigateToStep(stepId: number): void {
    if (this.canNavigateToStep(stepId)) {
      this.currentStep = stepId;
    }
  }

  goNextFromUser(): void {
    if (!this.selectedUser) {
      this.showMessage('Seleccione un usuario de la lista', 'error');
      return;
    }
    this.currentStep = 1;
  }

  goNextFromMembership(): void {
    if (!this.membershipForm.get('subscriptionTypeId')?.value) {
      this.showMessage('Seleccione un tipo de membresia', 'error');
      return;
    }
    if (!this.membershipForm.get('unitScheduleId')?.value) {
      this.showMessage('Seleccione una unidad del cronograma', 'error');
      return;
    }
    if (this.buildMateriasSeleccionadas().length === 0) {
      this.showMessage('Seleccione al menos una materia con opciones', 'error');
      return;
    }
    this.calculatePricingTotals();
    this.paymentsForm.patchValue({ useManualPayments: false });
    this.selectedCuota = this.calculatedTotal > 0 && this.installments.cuotas === 1 ? 1 : null;
    if (this.selectedCuota === 1) {
      this.syncPaymentsFormFromCuota(1);
    }
    this.prefillManualPaymentsFromSuggested();
    this.currentStep = 2;
  }

  goNextFromPayments(): void {
    if (!this.paymentsStepValid()) {
      if (this.useManualPayments) {
        this.paymentsForm.markAllAsTouched();
        this.showMessage('Complete cuotas y montos manuales', 'error');
      } else if (this.calculatedTotal <= 0) {
        this.showMessage('Use montos sugeridos o active ingreso manual', 'error');
      } else {
        this.showMessage('Seleccione una opcion de cuotas o use ingreso manual', 'error');
      }
      return;
    }
    this.currentStep = 3;
  }

  get useManualPayments(): boolean {
    return !!this.paymentsForm.get('useManualPayments')?.value;
  }

  onManualPaymentsToggle(enabled: boolean): void {
    if (enabled) {
      this.selectedCuota = null;
      this.prefillManualPaymentsFromSuggested();
    } else {
      this.paymentsForm.patchValue({
        manualTotalCuotas: 1,
        manualTotalTarget: null
      });
      this.rebuildManualCuotasArray();
      if (this.calculatedTotal > 0 && this.installments.cuotas === 1) {
        this.selectCuota(1);
      }
    }
  }

  private prefillManualPaymentsFromSuggested(): void {
    const cuotas = this.selectedCuota ?? (this.calculatedTotal > 0 ? this.installments.cuotas : 1);
    const perCuota = this.selectedCuota
      ? this.getMontoPorCuota(this.selectedCuota)
      : (this.calculatedTotal > 0 ? this.getMontoPorCuota(cuotas) : null);
    this.paymentsForm.patchValue({
      manualTotalCuotas: cuotas,
      manualTotalTarget: this.calculatedTotal > 0 ? this.calculatedTotal : null
    });
    this.rebuildManualCuotasArray(perCuota ?? undefined);
    if (this.calculatedTotal > 0 && perCuota != null && perCuota > 0) {
      this.distributeManualCuotasEqually();
    }
  }

  getEffectiveTotal(): number {
    if (this.useManualPayments) {
      return this.getManualCuotasTotal();
    }
    return this.calculatedTotal;
  }

  getResolvedPayment(): {
    totalCuotas: number;
    montoPorCuota: number;
    montoTotal: number;
    montosPorCuota?: number[];
  } {
    if (this.useManualPayments) {
      const totalCuotas = Number(this.paymentsForm.get('manualTotalCuotas')?.value);
      const montosPorCuota = this.getManualMontosList();
      const montoTotal = this.getManualCuotasTotal();
      const montoPorCuota = totalCuotas > 0
        ? Math.round((montoTotal / totalCuotas) * 100) / 100
        : 0;
      return { totalCuotas, montoPorCuota, montoTotal, montosPorCuota };
    }
    const totalCuotas = this.selectedCuota!;
    const montoPorCuota = this.getMontoPorCuota(totalCuotas);
    return {
      totalCuotas,
      montoPorCuota,
      montoTotal: this.calculatedTotal
    };
  }

  onUserSearchInput(value: string): void {
    if (this.selectedUser && value !== this.formatUserLabel(this.selectedUser)) {
      this.selectedUser = null;
    }
    this.userSearch$.next(value);
  }

  formatUserLabel(u: SelectedUser | User): string {
    const name = 'name' in u ? u.name : (u as User).email;
    const email = u.email;
    return `${name} (${email}) - ID ${u.id}`;
  }

  selectUser(user: User): void {
    this.selectedUser = {
      id: Number(user.id),
      name: user.name || user.email,
      email: user.email
    };
    this.userForm.patchValue({ userDisplay: this.formatUserLabel(this.selectedUser) });
    this.filteredUsers = [];
  }

  onSubscriptionTypeChange(typeId: number): void {
    this.materiasDisponibles = [];
    this.opcionesPorMateria.clear();
    this.selectedOpcionesByMateria.clear();
    this.selectedMateriaIds.clear();
    this.availableUnits = [];
    this.unitsByYear = [];
    this.resetPricing();
    this.membershipForm.patchValue({ unitScheduleId: null });

    if (!typeId) return;

    this.loadingMaterias = true;
    this.membresiaService.getMateriasOpciones(typeId).subscribe({
      next: res => {
        this.materiasDisponibles = res.result && res.data ? res.data : [];
        this.materiasDisponibles.forEach(m => this.loadOpcionesForMateria(m.id));
        this.loadingMaterias = false;
      },
      error: () => {
        this.showMessage('Error al cargar materias', 'error');
        this.loadingMaterias = false;
      }
    });

    this.unitScheduleService.getBySubscriptionType(typeId).subscribe({
      next: units => {
        this.availableUnits = units || [];
        this.buildUnitsByYear();
      },
      error: () => this.showMessage('Error al cargar unidades del cronograma', 'error')
    });
  }

  private loadOpcionesForMateria(materiaId: number): void {
    const materia = this.materiasDisponibles.find(m => m.id === materiaId);
    this.suscripcionesApi.getOpcionesByMateria(materiaId).subscribe({
      next: (raw: OpcionByMateria[] | Record<string, OpcionByMateria[]>) => {
        let list: OpcionByMateria[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && typeof raw === 'object') {
          list = ([] as OpcionByMateria[]).concat(...Object.values(raw));
        }
        const enriched: OpcionConPrecio[] = list.map(op => {
          const match = materia?.opciones?.find(o => o.nombre === op.nombre);
          return {
            ...op,
            ahora: match?.ahora,
            antes: match?.antes
          };
        });
        this.opcionesPorMateria.set(materiaId, enriched);
      }
    });
  }

  private buildUnitsByYear(): void {
    const map = new Map<number, UnitSchedule[]>();
    for (const u of this.availableUnits) {
      const y = u.anio ?? 0;
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(u);
    }
    this.unitsByYear = Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, units]) => ({
        year,
        units: units.sort((a, b) => a.unidadNumero - b.unidadNumero)
      }));
    if (this.unitsByYear.length === 1) {
      this.selectedYear = this.unitsByYear[0].year;
    }
  }

  onYearSelect(year: number): void {
    this.selectedYear = year;
    this.membershipForm.patchValue({ unitScheduleId: null });
  }

  getUnitsForSelectedYear(): UnitSchedule[] {
    if (this.selectedYear === null) return [];
    return this.unitsByYear.find(g => g.year === this.selectedYear)?.units ?? [];
  }

  getSelectedUnit(): UnitSchedule | undefined {
    const id = this.membershipForm.get('unitScheduleId')?.value;
    return this.availableUnits.find(u => u.id === Number(id));
  }

  isMateriaChecked(materiaId: number): boolean {
    return this.selectedMateriaIds.has(materiaId);
  }

  onMateriaToggle(materiaId: number, checked: boolean): void {
    if (checked) {
      this.selectedMateriaIds.add(materiaId);
      if (!this.selectedOpcionesByMateria.has(materiaId)) {
        this.selectedOpcionesByMateria.set(materiaId, new Set());
      }
    } else {
      this.selectedMateriaIds.delete(materiaId);
      this.selectedOpcionesByMateria.delete(materiaId);
    }
    this.calculatePricingTotals();
  }

  isOpcionChecked(materiaId: number, opcionId: number): boolean {
    return this.selectedOpcionesByMateria.get(materiaId)?.has(opcionId) ?? false;
  }

  onOpcionToggle(materiaId: number, opcionId: number, checked: boolean): void {
    if (!this.selectedMateriaIds.has(materiaId)) {
      this.selectedMateriaIds.add(materiaId);
    }
    let set = this.selectedOpcionesByMateria.get(materiaId);
    if (!set) {
      set = new Set();
      this.selectedOpcionesByMateria.set(materiaId, set);
    }
    if (checked) {
      set.add(opcionId);
    } else {
      set.delete(opcionId);
    }
    this.calculatePricingTotals();
  }

  getOpcionesForMateria(materiaId: number): OpcionConPrecio[] {
    return this.opcionesPorMateria.get(materiaId) ?? [];
  }

  formatOpcionLabel(op: OpcionConPrecio): string {
    if (op.ahora != null && op.ahora > 0) {
      return `${op.nombre} — S/ ${op.ahora.toFixed(2)}`;
    }
    return op.nombre;
  }

  /** Resumen de materias/opciones para pasos Cuotas y Confirmar. */
  getSelectedMateriasSummary(): SelectedMateriaSummary[] {
    const result: SelectedMateriaSummary[] = [];
    for (const materiaId of this.selectedMateriaIds) {
      const opcionIds = this.selectedOpcionesByMateria.get(materiaId);
      if (!opcionIds?.size) {
        continue;
      }
      const materia = this.materiasDisponibles.find(m => m.id === materiaId);
      const opciones: SelectedOpcionSummary[] = [];
      const prices: number[] = [];
      for (const opId of opcionIds) {
        const op = this.getOpcionById(materiaId, opId);
        if (!op) {
          continue;
        }
        const precio = op.ahora != null && op.ahora > 0 ? op.ahora : null;
        opciones.push({ id: op.id, nombre: op.nombre, precio });
        if (precio != null) {
          prices.push(precio);
        }
      }
      if (opciones.length === 0) {
        continue;
      }
      const descuentoCantidadPct = this.getDiscountPercentageByQuantity(prices.length);
      let subtotal = 0;
      if (prices.length > 0) {
        const bruto = prices.reduce((acc, p) => acc + p, 0);
        subtotal = Math.round(bruto * (1 - descuentoCantidadPct / 100) * 100) / 100;
      }
      result.push({
        materiaId,
        materiaNombre: materia?.nombre ?? `Materia #${materiaId}`,
        opciones,
        descuentoCantidadPct,
        subtotal
      });
    }
    return result;
  }

  membershipStepValid(): boolean {
    const typeOk = this.membershipForm.get('subscriptionTypeId')?.valid;
    const unitOk = this.membershipForm.get('unitScheduleId')?.valid;
    const materiasOk = this.buildMateriasSeleccionadas().length > 0;
    return !!(typeOk && unitOk && materiasOk);
  }

  private buildMateriasSeleccionadas(): MateriaSeleccionadaRequest[] {
    const result: MateriaSeleccionadaRequest[] = [];
    for (const materiaId of this.selectedMateriaIds) {
      const opciones = this.selectedOpcionesByMateria.get(materiaId);
      if (opciones && opciones.size > 0) {
        result.push({ materiaId, opcionesIds: Array.from(opciones) });
      }
    }
    return result;
  }

  getSelectedTypeName(): string {
    const id = this.membershipForm.get('subscriptionTypeId')?.value;
    return this.subscriptionTypes.find(t => t.id === id)?.nombre ?? '';
  }

  /** Total a registrar (sugerido o manual). */
  getTotalAmount(): number {
    return this.getEffectiveTotal();
  }

  getMontoPorCuota(cuota: number): number {
    return this.montoPorCuotaCache[cuota] ?? (this.calculatedTotal > 0 ? this.calculatedTotal / cuota : 0);
  }

  getCuotasArray(): number[] {
    return this.cuotasArray;
  }

  selectCuota(cuota: number): void {
    if (this.useManualPayments) {
      return;
    }
    this.selectedCuota = cuota;
    this.installments.montoPorCuota = this.getMontoPorCuota(cuota);
    this.syncPaymentsFormFromCuota(cuota);
    this.prefillManualPaymentsFromSuggested();
  }

  private syncPaymentsFormFromCuota(cuota: number): void {
    const monto = Math.round(this.getMontoPorCuota(cuota) * 100) / 100;
    this.paymentsForm.patchValue({
      totalCuotas: cuota,
      montoPorCuota: monto
    });
  }

  paymentsStepValid(): boolean {
    if (this.useManualPayments) {
      const cuotas = Number(this.paymentsForm.get('manualTotalCuotas')?.value);
      if (cuotas < 1 || cuotas > 24) {
        return false;
      }
      if (this.manualMontosCuota.length !== cuotas) {
        return false;
      }
      const allValid = this.manualMontosCuota.controls.every(c => {
        const v = Number(c.value);
        return v > 0 && !Number.isNaN(v);
      });
      return allValid && this.getManualCuotasTotal() > 0;
    }
    return this.calculatedTotal > 0 && this.selectedCuota !== null;
  }

  applyCoupon(): void {
    const code = (this.couponForm.get('codigo')?.value as string)?.trim();
    if (!code) {
      this.showMessage('Ingrese un codigo de cupon', 'error');
      return;
    }
    if (this.calculatedTotal <= 0 && !this.promoApplied) {
      this.calculatePricingTotals();
    }
    if (this.subtotalBeforeCoupon <= 0) {
      this.showMessage('Seleccione opciones antes de aplicar el cupon', 'error');
      return;
    }

    this.validatingCoupon = true;
    this.cuponService.getValidar(code).subscribe({
      next: resp => {
        this.validatingCoupon = false;
        if (resp?.result && resp.data) {
          const data = resp.data;
          if (data.descuento && data.descuento > 0) {
            this.discount = Number(data.descuento);
            this.discountFixedAmount = 0;
          } else if (data.abono && data.abono > 0) {
            this.discountFixedAmount = Number(data.abono);
            this.discount = 0;
          } else {
            this.showMessage('Cupon valido pero sin valor de descuento', 'error');
            return;
          }
          this.promoApplied = true;
          this.appliedCouponCode = code;
          this.calculatePricingTotals();
          if (this.selectedCuota !== null) {
            this.syncPaymentsFormFromCuota(this.selectedCuota);
          }
          this.showMessage('Cupon aplicado correctamente', 'success');
        } else {
          this.showMessage('Codigo de cupon invalido o expirado', 'error');
        }
      },
      error: () => {
        this.validatingCoupon = false;
        this.showMessage('Error al validar el cupon', 'error');
      }
    });
  }

  clearCoupon(): void {
    this.promoApplied = false;
    this.appliedCouponCode = '';
    this.discount = 0;
    this.discountFixedAmount = 0;
    this.couponDiscountAmount = 0;
    this.couponForm.patchValue({ codigo: '' });
    this.calculatePricingTotals();
    if (this.selectedCuota !== null) {
      this.syncPaymentsFormFromCuota(this.selectedCuota);
    }
  }

  private resetPricing(): void {
    this.subtotalBeforeCoupon = 0;
    this.couponDiscountAmount = 0;
    this.calculatedTotal = 0;
    this.selectedCuota = null;
    this.installments = { cuotas: 1, montoPorCuota: 0 };
    this.cuotasArray = [1];
    this.montoPorCuotaCache = {};
    this.clearCoupon();
  }

  private getDiscountPercentageByQuantity(quantity: number): number {
    switch (quantity) {
      case 2: return 10;
      case 3: return 16;
      case 4: return 20;
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10: return 29;
      default: return 0;
    }
  }

  private getOpcionById(materiaId: number, opcionId: number): OpcionConPrecio | undefined {
    return this.opcionesPorMateria.get(materiaId)?.find(o => o.id === opcionId);
  }

  calculatePricingTotals(): void {
    let subtotal = 0;
    for (const materiaId of this.selectedMateriaIds) {
      const opciones = this.selectedOpcionesByMateria.get(materiaId);
      if (!opciones || opciones.size === 0) continue;

      const prices: number[] = [];
      for (const opId of opciones) {
        const op = this.getOpcionById(materiaId, opId);
        if (op?.ahora != null && op.ahora > 0) {
          prices.push(op.ahora);
        }
      }
      if (prices.length === 0) continue;

      const precioSinDescuento = prices.reduce((acc, p) => acc + p, 0);
      const discountPct = this.getDiscountPercentageByQuantity(prices.length);
      subtotal += precioSinDescuento * (1 - discountPct / 100);
    }

    this.subtotalBeforeCoupon = Math.round(subtotal * 100) / 100;

    let couponDiscount = 0;
    if (this.promoApplied) {
      if (this.discountFixedAmount > 0) {
        couponDiscount = Math.min(this.discountFixedAmount, this.subtotalBeforeCoupon);
      } else if (this.discount > 0) {
        couponDiscount = this.subtotalBeforeCoupon * (this.discount / 100);
      }
    }
    this.couponDiscountAmount = Math.round(couponDiscount * 100) / 100;
    this.calculatedTotal = Math.round((this.subtotalBeforeCoupon - this.couponDiscountAmount) * 100) / 100;

    this.installments = this.calculateInstallments(this.calculatedTotal);
    this.updateCuotaCaches();

    if (this.selectedCuota !== null && this.selectedCuota > this.installments.cuotas) {
      this.selectedCuota = this.installments.cuotas === 1 ? 1 : null;
    }
    if (this.selectedCuota !== null) {
      this.syncPaymentsFormFromCuota(this.selectedCuota);
    }
  }

  private calculateInstallments(total: number): { cuotas: number; montoPorCuota: number } {
    let cuotas = 1;
    if (total > 600) {
      cuotas = 4;
    } else if (total > 400) {
      cuotas = 3;
    } else if (total > 179) {
      cuotas = 2;
    }
    return { cuotas, montoPorCuota: total > 0 ? total / cuotas : 0 };
  }

  private updateCuotaCaches(): void {
    this.cuotasArray = Array.from({ length: this.installments.cuotas }, (_, i) => i + 1);
    this.montoPorCuotaCache = {};
    for (let i = 1; i <= this.installments.cuotas; i++) {
      this.montoPorCuotaCache[i] = this.calculatedTotal > 0
        ? Math.round((this.calculatedTotal / i) * 100) / 100
        : 0;
    }
  }

  volver(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/pages-admin/suscriptores']);
    }
  }

  submit(): void {
    if (!this.selectedUser || this.confirmForm.invalid || !this.membershipStepValid() || !this.paymentsStepValid()) {
      this.confirmForm.markAllAsTouched();
      this.showMessage('Complete todos los pasos antes de confirmar', 'error');
      return;
    }

    const payment = this.getResolvedPayment();

    const subscriptionDetails: AdminManualSubscriptionRequest['subscriptionDetails'] = {
      subscriptionTypeId: Number(this.membershipForm.get('subscriptionTypeId')?.value),
      totalCuotas: payment.totalCuotas,
      montoPorCuota: payment.montoPorCuota,
      montoTotal: payment.montoTotal,
      unitScheduleId: Number(this.membershipForm.get('unitScheduleId')?.value),
      materiasSeleccionadas: this.buildMateriasSeleccionadas()
    };
    if (payment.montosPorCuota?.length) {
      subscriptionDetails.montosPorCuota = payment.montosPorCuota;
    }

    const payload: AdminManualSubscriptionRequest = {
      userId: this.selectedUser.id,
      adminReason: this.confirmForm.get('adminReason')?.value.trim(),
      markFirstInstallmentPaid: this.paymentsForm.get('markFirstInstallmentPaid')?.value ?? true,
      codigo: this.promoApplied && this.appliedCouponCode ? this.appliedCouponCode : undefined,
      subscriptionDetails
    };

    this.submitting = true;
    this.subscriptionAdminService.createManualSubscription(payload).subscribe({
      next: result => {
        this.submitting = false;
        if (result?.subscriptionId) {
          this.showMessage(`Suscripcion #${result.subscriptionId} registrada correctamente`, 'success');
          this.router.navigate(['/pages-admin/suscriptores/editar', result.subscriptionId]);
        } else {
          this.showMessage('No se pudo registrar la suscripcion', 'error');
        }
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.data || err?.error?.message || err?.message || 'Error al registrar la suscripcion';
        this.showMessage(typeof msg === 'string' ? msg : 'Error al registrar la suscripcion', 'error');
      }
    });
  }

  private showMessage(message: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: [`snackbar-${tipo}`],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
