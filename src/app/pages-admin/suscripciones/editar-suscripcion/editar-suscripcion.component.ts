import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Location, DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { 
  SuscripcionesData, 
  EditSubscriptionRequest, 
  SubscriptionDetails, 
  MateriaOption, 
  OpcionByMateria 
} from '../../../@core/interfaces/suscripciones';
import { SuscripcionesApi } from '../../../@core/backend/api/suscripciones.api';
import { MembresiaData } from '../../../@core/interfaces/membresia';
import { Materias, Opciones } from '../../../@core/interfaces/membresia';
import { ConfirmCancelDialogComponent, CancelDialogData } from './confirm-cancel-dialog/confirm-cancel-dialog.component';
import { ConfirmChangesDialogComponent, ChangesSummary } from './confirm-changes-dialog/confirm-changes-dialog.component';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatChip } from '@angular/material/chips';
import { MatFormField, MatLabel, MatHint, MatPrefix } from '@angular/material/form-field';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatCheckbox } from '@angular/material/checkbox';

export interface UnitOption {
  id: number;
  unidadNumero: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  subscriptionTypeId: number;
  anio?: number;
}

@Component({
    selector: 'ngx-editar-suscripcion',
    templateUrl: './editar-suscripcion.component.html',
    styleUrls: ['./editar-suscripcion.component.scss'],
    standalone: true,
    imports: [MatIconButton, MatIcon, MatProgressSpinner, MatChip, MatButton, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatSelect, MatSelectTrigger, MatOption, MatHint, MatInput, MatPrefix, MatCheckbox, DatePipe]
})
export class EditarSuscripcionComponent implements OnInit {
  suscripcionId!: number;
  editForm: FormGroup;
  nextUnits: UnitOption[] = [];
  unitsByYear: { year: number; units: UnitOption[] }[] = [];
  availableYears: number[] = [];
  selectedYear: number | null = null;
  subscriptionDetails: SubscriptionDetails | null = null;
  originalUnitId: number | null = null; // ID único de la unidad original
  materiasArray: string[] = [];
  dualUnitsInfo: any = null;
  loading = false;
  selectedAction: 'EDIT' | 'CANCEL' | null = null;
  
  materiasDisponibles: Materias[] = [];
  materiasOpcionesSeleccionadas: Map<string, string[]> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private suscripcionesService: SuscripcionesData,
    private suscripcionesApi: SuscripcionesApi,
    private snackBar: MatSnackBar,
    private membresiaService: MembresiaData,
    private dialog: MatDialog
  ) {
    this.editForm = this.fb.group({
      unidadNumero: [''], // Ahora guarda unit.id en lugar de unit.unidadNumero
      fechaInicio: ['', Validators.required],
      fechaFinUnidad: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('🔵 EditarSuscripcionComponent - ngOnInit ejecutado');
    console.log('🔵 Route snapshot:', this.route.snapshot);
    
    this.route.params.subscribe(params => {
      console.log('🔵 Params recibidos:', params);
      this.suscripcionId = +params['id'];
      console.log('🔵 Suscripcion ID parseado:', this.suscripcionId);
      
      if (this.suscripcionId) {
        console.log('🔵 Cargando detalles de suscripción...');
        this.loadSubscriptionDetails();
      } else {
        console.error('❌ No se recibió ID válido de suscripción');
      }
    });
  }

  loadSubscriptionDetails(): void {
    this.loading = true;
    this.suscripcionesService.getSubscriptionDetails(this.suscripcionId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.subscriptionDetails = response.data;
          this.procesarMaterias(response.data.materiasOpcionesJson);
          
          // Pre-cargar con fechas de la SUSCRIPCIÓN (no de la unidad)
          this.editForm.patchValue({
            fechaInicio: response.data.fechaInicio,
            fechaFinUnidad: response.data.fechaFin
          });
          
          // Todos los campos son opcionales - se puede editar cualquier combinación
          this.editForm.get('unidadNumero')?.clearValidators();
          this.editForm.get('fechaInicio')?.clearValidators();
          this.editForm.get('fechaFinUnidad')?.clearValidators();
          this.editForm.updateValueAndValidity();
          
          if (this.subscriptionDetails.subscriptionTypeId === 1) {
            this.handleDualUnits();
          }
          
          this.loadNextUnits();
          this.loadMateriasDisponibles();
          this.loadCurrentMateriasSelection();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subscription details:', error);
        this.showMessage('Error al cargar los detalles de la suscripción', 'error');
        this.loading = false;
      }
    });
  }

  private handleDualUnits(): void {
    try {
      if (this.subscriptionDetails?.unidadActualTitulo.startsWith('{')) {
        const unidadesInfo = JSON.parse(this.subscriptionDetails.unidadActualTitulo);
        this.dualUnitsInfo = unidadesInfo;
        
        this.subscriptionDetails.unidadActualTitulo = 
          `Unidad ${this.subscriptionDetails.unidadActual}: ${unidadesInfo.unidad1.titulo} & ${unidadesInfo.unidad2.titulo}`;
      }
    } catch (error) {
      console.warn('Error parsing dual units info:', error);
    }
  }

  procesarMaterias(materiasJson: string): void {
    try {
      const materias = JSON.parse(materiasJson);
      this.materiasArray = [];
      
      for (const nivel in materias) {
        if (materias.hasOwnProperty(nivel)) {
          this.materiasArray.push(nivel);
          if (Array.isArray(materias[nivel])) {
            this.materiasArray.push(...materias[nivel]);
          }
        }
      }
    } catch (error) {
      console.warn('No se pudo parsear las materias:', error);
      this.materiasArray = [];
    }
  }

  loadNextUnits(): void {
    if (!this.subscriptionDetails) return;

    this.suscripcionesService.getNextUnits(this.suscripcionId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.nextUnits = response.data;
          this.buildUnitsByYear();

          // Encontrar la unidad actual (coincidencia por número + año)
          const currentAnio = this.subscriptionDetails!.unidadActualAnio;
          const currentNum = this.subscriptionDetails!.unidadActual;
          const currentUnit = this.nextUnits.find(
            u => u.unidadNumero === currentNum && (currentAnio ? u.anio === currentAnio : true)
          ) || this.nextUnits.find(u => u.unidadNumero === currentNum);

          if (currentUnit) {
            this.originalUnitId = currentUnit.id;
            // Seleccionar el año de la unidad actual para que el select muestre las unidades correctas
            if (currentUnit.anio) { this.selectedYear = currentUnit.anio; }
            console.log('💾 ID de unidad original guardado:', this.originalUnitId, '(unidadNumero:', currentUnit.unidadNumero, ')');
            this.editForm.patchValue({ unidadNumero: currentUnit.id });
          } else {
            console.warn('⚠️ No se encontró la unidad actual en nextUnits');
          }
        }
      },
      error: (error) => {
        console.error('Error loading next units:', error);
        this.showMessage('Error al cargar las unidades disponibles', 'error');
      }
    });
  }

  buildUnitsByYear(): void {
    const map = new Map<number, UnitOption[]>();
    for (const u of this.nextUnits) {
      const y = u.anio ?? 0;
      if (!map.has(y)) { map.set(y, []); }
      map.get(y)!.push(u);
    }
    this.unitsByYear = Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, units]) => ({ year, units: units.sort((a, b) => a.unidadNumero - b.unidadNumero) }));
    this.availableYears = this.unitsByYear.map(g => g.year);

    // Siempre empezar sin año seleccionado — se establece desde loadNextUnits
    // cuando se encuentra la unidad actual (o el usuario hace clic en un botón de año)
    this.selectedYear = null;
  }

  onYearChange(year: number): void {
    this.selectedYear = year;
    this.editForm.patchValue({ unidadNumero: '' });
  }

  getUnitsForSelectedYear(): UnitOption[] {
    if (this.selectedYear === null) { return []; }
    return this.unitsByYear.find(g => g.year === this.selectedYear)?.units ?? [];
  }

  getSelectedUnit(): UnitOption | null {
    const id = this.editForm.get('unidadNumero')?.value;
    if (!id) { return null; }
    for (const group of this.unitsByYear) {
      const found = group.units.find(u => u.id === Number(id));
      if (found) { return found; }
    }
    return null;
  }

  onUnitChange(): void {
    const selectedUnitId = this.editForm.get('unidadNumero')?.value;
    if (!selectedUnitId) { return; }

    const selectedUnit = this.nextUnits.find(u => u.id === Number(selectedUnitId));
    if (!selectedUnit) {
      console.error('❌ No se encontró la unidad con ID:', selectedUnitId);
      return;
    }

    // Smart merge: nunca acortar el acceso existente de la suscripción
    const currentFechaInicio = this.subscriptionDetails!.fechaInicio;
    const currentFechaFin = this.subscriptionDetails!.fechaFin;

    // min(suscripcion, unidad) para inicio — no recortar acceso temprano
    const newFechaInicio = currentFechaInicio < selectedUnit.fechaInicio
      ? currentFechaInicio : selectedUnit.fechaInicio;

    // max(suscripcion, unidad) para fin — no acortar acceso
    const newFechaFin = currentFechaFin > selectedUnit.fechaFin
      ? currentFechaFin : selectedUnit.fechaFin;

    this.editForm.patchValue({
      fechaInicio: newFechaInicio,
      fechaFinUnidad: newFechaFin
    });
    console.log('📝 Fechas actualizadas desde nextUnits:', selectedUnit.fechaInicio, selectedUnit.fechaFin);
  }

  selectAction(action: 'EDIT' | 'CANCEL'): void {
    this.selectedAction = action;
  }

  onConfirm(): void {
    if (this.selectedAction === 'CANCEL') {
      this.openCancelConfirmationDialog();
    } else if (this.selectedAction === 'EDIT') {
      this.openChangesReviewDialog();
    }
  }

  openCancelConfirmationDialog(): void {
    if (!this.subscriptionDetails) return;

    const dialogData: CancelDialogData = {
      userName: this.subscriptionDetails.userName,
      subscriptionType: this.subscriptionDetails.subscriptionType,
      unidadActual: this.subscriptionDetails.unidadActual,
      fechaInicio: this.subscriptionDetails.fechaInicio,
      fechaFinUnidad: this.subscriptionDetails.fechaFinUnidad
    };

    const dialogRef = this.dialog.open(ConfirmCancelDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && typeof result === 'object' && result.confirmed) {
        this.confirmCancel(result.reason);
      }
    });
  }

  openChangesReviewDialog(): void {
    console.log('🔍 Abriendo modal de revisión de cambios');
    console.log('📋 Valores del formulario:', this.editForm.value);
    console.log('📋 Detalles de suscripción actual:', {
      unidadActual: this.subscriptionDetails?.unidadActual,
      fechaInicio: this.subscriptionDetails?.fechaInicio,
      fechaFinUnidad: this.subscriptionDetails?.fechaFinUnidad
    });
    
    const changesSummary = this.buildChangesSummary();
    console.log('📊 Resumen de cambios generado:', changesSummary);

    if (!changesSummary.hasChanges) {
      this.showMessage('No hay cambios para guardar', 'error');
      return;
    }

    const isMobile = window.innerWidth <= 768;

    const dialogRef = this.dialog.open(ConfirmChangesDialogComponent, {
      width: isMobile ? '100vw' : '750px',
      maxWidth: isMobile ? '100vw' : '95vw',
      maxHeight: isMobile ? '92dvh' : '88vh',
      data: changesSummary,
      disableClose: true,
      panelClass: ['custom-dialog-container', 'confirm-dialog-panel'],
    });

    dialogRef.afterClosed().subscribe((result: { confirmed: boolean; reason: string } | false | undefined) => {
      if (result && typeof result === 'object' && result.confirmed) {
        this.confirmEdit(result.reason);
      }
    });
  }

  buildChangesSummary(): ChangesSummary {
    if (!this.subscriptionDetails) {
      return {
        hasChanges: false,
        userName: '',
        subscriptionType: ''
      };
    }

    const formData = this.editForm.value;
    const summary: ChangesSummary = {
      hasChanges: false,
      userName: this.subscriptionDetails.userName,
      subscriptionType: this.subscriptionDetails.subscriptionType
    };

    console.log('🔍 Detectando cambios:', {
      formUnitId: formData.unidadNumero,
      originalUnitId: this.originalUnitId,
      formUnitIdType: typeof formData.unidadNumero,
      originalUnitIdType: typeof this.originalUnitId
    });

    // Detectar cambio de unidad - Comparar IDs únicos
    const newUnitId = formData.unidadNumero != null && formData.unidadNumero !== '' 
      ? Number(formData.unidadNumero) 
      : null;
    const originalUnitIdNum = this.originalUnitId !== null ? Number(this.originalUnitId) : null;
    
    if (newUnitId !== null && originalUnitIdNum !== null && newUnitId !== originalUnitIdNum) {
      const oldUnit = this.nextUnits.find(u => u.id === originalUnitIdNum);
      const newUnit = this.nextUnits.find(u => u.id === newUnitId);
      
      console.log('✅ Cambio de unidad detectado:', { 
        originalId: originalUnitIdNum, 
        newId: newUnitId,
        oldUnitNum: oldUnit?.unidadNumero,
        newUnitNum: newUnit?.unidadNumero
      });
      
      summary.hasChanges = true;
      summary.unidadChange = {
        old: oldUnit?.unidadNumero || this.subscriptionDetails.unidadActual,
        new: newUnit?.unidadNumero || 0,
        oldTitle: this.subscriptionDetails.unidadActualTitulo,
        newTitle: newUnit?.titulo
      };
    } else {
      console.log('❌ No hay cambio de unidad (originalId: ' + originalUnitIdNum + ', newId: ' + newUnitId + ')');
    }

    // Detectar cambios de fechas
    const dateChanges: any = {};
    if (formData.fechaInicio && formData.fechaInicio !== this.subscriptionDetails.fechaInicio) {
      summary.hasChanges = true;
      dateChanges.fechaInicio = {
        old: this.subscriptionDetails.fechaInicio,
        new: formData.fechaInicio
      };
    }

    if (formData.fechaFinUnidad && formData.fechaFinUnidad !== this.subscriptionDetails.fechaFin) {
      summary.hasChanges = true;
      dateChanges.fechaFinUnidad = {
        old: this.subscriptionDetails.fechaFin,
        new: formData.fechaFinUnidad
      };
    }

    if (Object.keys(dateChanges).length > 0) {
      summary.dateChanges = dateChanges;
    }

    // Detectar cambios de materias
    if (this.materiasOpcionesSeleccionadas.size > 0) {
      const currentMaterias = this.getCurrentMateriasSet();
      const newMaterias = this.getNewMateriasSet();
      
      const added: string[] = [];
      const removed: string[] = [];
      const unchanged: string[] = [];

      // Materias agregadas
      newMaterias.forEach(materia => {
        if (!currentMaterias.has(materia)) {
          added.push(materia);
        } else {
          unchanged.push(materia);
        }
      });

      // Materias eliminadas
      currentMaterias.forEach(materia => {
        if (!newMaterias.has(materia)) {
          removed.push(materia);
        }
      });

      if (added.length > 0 || removed.length > 0) {
        summary.hasChanges = true;
        summary.materiasChanges = { added, removed, unchanged };
      }
    }

    return summary;
  }

  getCurrentMateriasSet(): Set<string> {
    const materias = new Set<string>();
    try {
      if (this.subscriptionDetails?.materiasOpcionesJson) {
        const materiasData = JSON.parse(this.subscriptionDetails.materiasOpcionesJson);
        for (const materia in materiasData) {
          if (materiasData.hasOwnProperty(materia)) {
            const opciones = materiasData[materia];
            if (Array.isArray(opciones)) {
              opciones.forEach(opcion => {
                materias.add(`${materia} - ${opcion}`);
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing current materias:', error);
    }
    return materias;
  }

  getNewMateriasSet(): Set<string> {
    const materias = new Set<string>();
    this.materiasOpcionesSeleccionadas.forEach((opciones, materia) => {
      opciones.forEach(opcion => {
        materias.add(`${materia} - ${opcion}`);
      });
    });
    return materias;
  }

  confirmEdit(reason: string = 'Sin motivo especificado'): void {
    this.loading = true;
    const formData = this.editForm.value;
    
    const editData: EditSubscriptionRequest = {
      subscriptionId: this.suscripcionId,
      action: 'EDIT',
      reason
    };

    // Incluir todos los campos del formulario si tienen valores
    let hasChanges = false;

    // Solo enviar unitId si la unidad cambió respecto a la original
    if (formData.unidadNumero != null && formData.unidadNumero !== '') {
      const newUnitId = Number(formData.unidadNumero);
      if (this.originalUnitId !== null && newUnitId !== Number(this.originalUnitId)) {
        editData.unitId = newUnitId;
        console.log('📤 Enviando cambio de unidad - unitId:', editData.unitId, '(original:', this.originalUnitId, ')');
        hasChanges = true;
      } else {
        console.log('📤 Unidad no cambió, no se envía unitId (current:', newUnitId, ', original:', this.originalUnitId, ')');
      }
    }

    if (formData.fechaInicio) {
      editData.fechaInicio = formData.fechaInicio;
      hasChanges = true;
    }

    if (formData.fechaFinUnidad) {
      editData.fechaFinUnidad = formData.fechaFinUnidad;
      hasChanges = true;
    }

    // Agregar materias si fueron modificadas
    if (this.materiasOpcionesSeleccionadas.size > 0) {
      editData.materiasOpcionesJson = this.buildMateriasOpcionesJson();
      hasChanges = true;
    }

    // Validar que hay datos para enviar
    if (!hasChanges) {
      this.showMessage('Debes modificar al menos un campo (unidad, fechas o materias)', 'error');
      this.loading = false;
      return;
    }

    this.suscripcionesService.editSubscription(editData).subscribe({
      next: (response) => {
        if (response.result) {
          this.showMessage('Suscripción actualizada correctamente', 'success');
          this.volver();
        } else {
          this.showMessage('Error al actualizar la suscripción', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error editing subscription:', error);
        
        if (error.status === 403 || error.error?.message?.includes('ADMIN')) {
          this.showMessage('No tienes permisos para editar materias. Solo usuarios ADMIN pueden realizar esta acción.', 'error');
        } else {
          this.showMessage(error.error?.message || 'Error al actualizar la suscripción', 'error');
        }
        this.loading = false;
      }
    });
  }

  confirmCancel(reason: string = 'Sin motivo especificado'): void {
    this.loading = true;
    const cancelData: EditSubscriptionRequest = {
      subscriptionId: this.suscripcionId,
      action: 'CANCEL',
      reason
    };

    this.suscripcionesService.editSubscription(cancelData).subscribe({
      next: (response) => {
        if (response.result) {
          this.showMessage('Suscripción cancelada correctamente', 'success');
          this.volver();
        } else {
          this.showMessage('Error al cancelar la suscripción', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error canceling subscription:', error);
        this.showMessage('Error al cancelar la suscripción', 'error');
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/pages-admin/suscriptores']);
  }

  loadMateriasDisponibles(): void {
    const subscriptionTypeId = this.subscriptionDetails?.subscriptionTypeId;
    
    if (!subscriptionTypeId) {
      console.warn('No subscriptionTypeId available');
      return;
    }
    
    this.loading = true;
    this.membresiaService.getMateriasOpciones(subscriptionTypeId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.materiasDisponibles = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading materias:', error);
        this.showMessage('Error al cargar las materias disponibles', 'error');
        this.loading = false;
      }
    });
  }

  loadCurrentMateriasSelection(): void {
    try {
      if (this.subscriptionDetails?.materiasOpcionesJson) {
        const materiasData = JSON.parse(this.subscriptionDetails.materiasOpcionesJson);
        
        for (const materia in materiasData) {
          if (materiasData.hasOwnProperty(materia)) {
            const opciones = materiasData[materia];
            if (Array.isArray(opciones)) {
              this.materiasOpcionesSeleccionadas.set(materia, opciones);
            } else {
              this.materiasOpcionesSeleccionadas.set(materia, []);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing materias JSON:', error);
    }
  }

  isMateriaSelected(materiaNombre: string): boolean {
    return this.materiasOpcionesSeleccionadas.has(materiaNombre);
  }

  isOpcionSelected(materiaNombre: string, opcionNombre: string): boolean {
    const opciones = this.materiasOpcionesSeleccionadas.get(materiaNombre);
    return opciones ? opciones.includes(opcionNombre) : false;
  }

  getOpcionesForMateria(materiaId: number): Opciones[] {
    const materia = this.materiasDisponibles.find(m => m.id === materiaId);
    return materia?.opciones || [];
  }

  onMateriaChange(materia: Materias, checked: boolean): void {
    if (checked) {
      if (!this.materiasOpcionesSeleccionadas.has(materia.nombre)) {
        this.materiasOpcionesSeleccionadas.set(materia.nombre, []);
      }
    } else {
      this.materiasOpcionesSeleccionadas.delete(materia.nombre);
    }
  }

  onOpcionChange(materia: Materias, opcion: Opciones, checked: boolean): void {
    let opciones = this.materiasOpcionesSeleccionadas.get(materia.nombre) || [];
    
    if (checked) {
      if (!opciones.includes(opcion.nombre)) {
        opciones.push(opcion.nombre);
      }
    } else {
      opciones = opciones.filter(o => o !== opcion.nombre);
    }
    
    this.materiasOpcionesSeleccionadas.set(materia.nombre, opciones);
  }

  hasMateriasSeleccionadas(): boolean {
    return this.materiasOpcionesSeleccionadas.size > 0;
  }

  buildMateriasOpcionesJson(): string {
    const materiasObj: any = {};
    
    this.materiasOpcionesSeleccionadas.forEach((opciones, materia) => {
      materiasObj[materia] = opciones;
    });
    
    return JSON.stringify(materiasObj);
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: type === 'success' ? 3000 : 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }
}
