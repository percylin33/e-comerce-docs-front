import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CuponService } from '../../@core/backend/services/cupon.service';
import { CuponAdminDto, CuponLimitadoCreate, CuponLimitadoResponse, CuponUpdatePayload } from '../../@core/interfaces/cupon';
import { NbCardModule, NbIconModule, NbInputModule, NbButtonModule } from '@nebular/theme';

@Component({
    selector: 'ngx-crear-cupon-limitado',
    templateUrl: './crear-cupon-limitado.component.html',
    styleUrls: ['./crear-cupon-limitado.component.scss'],
    standalone: true,
    imports: [NbCardModule, NbIconModule, FormsModule, ReactiveFormsModule, NbInputModule, NbButtonModule]
})
export class CrearCuponLimitadoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cuponService = inject(CuponService);


  // ── Crear cupón ────────────────────────────────────────────────────────
  crearForm: FormGroup;
  creando = false;
  nuevoResultado: CuponLimitadoResponse | null = null;
  errorCrear: string | null = null;
  copiado = false;

  // ── Lista cupones ──────────────────────────────────────────────────────
  cupones: CuponAdminDto[] = [];
  cargandoLista = false;
  errorLista: string | null = null;

  // ── Edición inline ────────────────────────────────────────────────────
  editandoId: number | null = null;
  editForm: FormGroup;
  guardando = false;
  errorEditar: string | null = null;

  // ── Toggle ─────────────────────────────────────────────────────────────
  toggleandoId: number | null = null;
  toggleErrors: { [id: number]: string } = {};

  ngOnInit(): void {
    this.crearForm = this.fb.group({
      code: ['', [Validators.maxLength(20), Validators.pattern('^[A-Za-z0-9\\-]*$')]],
      discountValue: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
      maxUses: [null, [Validators.required, Validators.min(1)]]
    });

    this.editForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(20), Validators.pattern('^[A-Za-z0-9\\-]*$')]],
      discountValue: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
      maxUses: [null, [Validators.required, Validators.min(1)]],
      active: [true]
    });

    this.cargarCupones();
  }

  // ── Crear ──────────────────────────────────────────────────────────────

  crear(): void {
    if (this.crearForm.invalid) { this.crearForm.markAllAsTouched(); return; }

    this.creando = true;
    this.errorCrear = null;
    this.nuevoResultado = null;

    const { code, discountValue, maxUses } = this.crearForm.value;
    const payload: CuponLimitadoCreate = {
      discountValue: Number(discountValue),
      couponType: 'LIMITED_USE',
      maxUses: Number(maxUses),
      userId: null,
      ...(code?.trim() ? { code: code.trim().toUpperCase() } : {})
    };

    this.cuponService.crearCuponLimitado(payload).subscribe({
      next: (res) => {
        this.nuevoResultado = res.data;
        this.creando = false;
        this.cargarCupones();
      },
      error: (err) => {
        this.creando = false;
        this.errorCrear = this.parseError(err);
      }
    });
  }

  copiarCodigo(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copiado = true;
      setTimeout(() => this.copiado = false, 2000);
    });
  }

  crearOtro(): void {
    this.nuevoResultado = null;
    this.errorCrear = null;
    this.crearForm.reset();
  }

  // ── Lista ──────────────────────────────────────────────────────────────

  cargarCupones(): void {
    this.cargandoLista = true;
    this.errorLista = null;
    this.cuponService.listLimitedCoupons().subscribe({
      next: (res) => {
        this.cupones = res.data;
        this.cargandoLista = false;
      },
      error: () => {
        this.errorLista = 'No se pudo cargar la lista de cupones.';
        this.cargandoLista = false;
      }
    });
  }

  // ── Toggle ─────────────────────────────────────────────────────────────

  toggleActivo(cupon: CuponAdminDto): void {
    this.toggleandoId = cupon.id;
    delete this.toggleErrors[cupon.id];
    this.cuponService.toggleCoupon(cupon.id).subscribe({
      next: (res) => {
        const idx = this.cupones.findIndex(c => c.id === cupon.id);
        if (idx !== -1) this.cupones[idx] = res.data;
        this.toggleandoId = null;
      },
      error: (err) => {
        this.toggleandoId = null;
        this.toggleErrors[cupon.id] = this.parseError(err);
        // Auto-clear after 5 seconds
        setTimeout(() => delete this.toggleErrors[cupon.id], 5000);
      }
    });
  }

  // ── Edición inline ────────────────────────────────────────────────────

  startEdit(cupon: CuponAdminDto): void {
    this.editandoId = cupon.id;
    this.errorEditar = null;
    this.editForm.patchValue({
      code: cupon.code,
      discountValue: cupon.discountValue,
      maxUses: cupon.maxUses,
      active: cupon.active
    });
  }

  cancelEdit(): void {
    this.editandoId = null;
    this.errorEditar = null;
    this.editForm.reset();
  }

  guardarEdicion(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }

    this.guardando = true;
    this.errorEditar = null;

    const { code, discountValue, maxUses, active } = this.editForm.value;
    const payload: CuponUpdatePayload = {
      code: (code as string).trim().toUpperCase(),
      discountValue: Number(discountValue),
      maxUses: Number(maxUses),
      active: Boolean(active)
    };

    this.cuponService.updateLimitedCoupon(this.editandoId, payload).subscribe({
      next: (res) => {
        const idx = this.cupones.findIndex(c => c.id === this.editandoId);
        if (idx !== -1) this.cupones[idx] = res.data;
        this.guardando = false;
        this.cancelEdit();
      },
      error: (err) => {
        this.guardando = false;
        this.errorEditar = this.parseError(err);
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private parseError(err: any): string {
    if (err.status === 403) return 'No tienes permisos de administrador.';
    if (err.status === 400 && err.error?.message) return err.error.message;
    if (err.status === 409) return 'Ya existe un cupón con ese código.';
    if (err.error?.message) return err.error.message;
    return 'Ocurrió un error. Inténtalo de nuevo.';
  }

  get fc() { return this.crearForm.controls; }
  get fe() { return this.editForm.controls; }

  progressPercent(c: CuponAdminDto): number {
    if (!c.maxUses) return 0;
    return Math.round((c.usesCount / c.maxUses) * 100);
  }
}
