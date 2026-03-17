import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SuscripcionesData, EditSubscriptionRequest, SubscriptionDetails, MateriaOption, OpcionByMateria } from '../../../@core/interfaces/suscripciones';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuscripcionesApi } from '../../../@core/backend/api/suscripciones.api';

export interface EditSubscriptionData {
  suscripcionId: number;
  subscriptionType: string;
  subscriptionTypeId: number;
  currentUnidad?: number;
  isMobile?: boolean;
}

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
  selector: 'ngx-edit-subscription-dialog',
  templateUrl: './edit-subscription-dialog.component.html',
  styleUrls: ['./edit-subscription-dialog.component.scss']
})
export class EditSubscriptionDialogComponent {
  editForm: FormGroup;
  nextUnits: UnitOption[] = [];
  unitsByYear: { year: number; units: UnitOption[] }[] = [];
  availableYears: number[] = [];
  selectedYear: number | null = null;
  subscriptionDetails: SubscriptionDetails | null = null;
  materiasArray: string[] = [];
  dualUnitsInfo: any = null; // Para manejar las dos unidades del subscriptionType 1
  loading = false;
  selectedAction: 'EDIT' | 'CANCEL' | null = null;
  isMobile = false;
  
  // ✨ Propiedades para edición de materias (validación en backend)
  materiasDisponibles: MateriaOption[] = [];
  opcionesDisponiblesPorMateria: Map<number, OpcionByMateria[]> = new Map();
  materiasOpcionesSeleccionadas: Map<string, string[]> = new Map();

  constructor(
    public dialogRef: MatDialogRef<EditSubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditSubscriptionData,
    private fb: FormBuilder,
    private suscripcionesService: SuscripcionesData,
    private suscripcionesApi: SuscripcionesApi,
    private snackBar: MatSnackBar
  ) {
    this.isMobile = data.isMobile || false;
    
    this.editForm = this.fb.group({
      unidadNumero: [''],
      fechaInicio: ['', Validators.required],
      fechaFinUnidad: ['', Validators.required]
    });
    
    this.loadSubscriptionDetails();
  }

  loadSubscriptionDetails(): void {
    this.loading = true;
    this.suscripcionesService.getSubscriptionDetails(this.data.suscripcionId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.subscriptionDetails = response.data;
          this.procesarMaterias(response.data.materiasOpcionesJson);
          
          // Pre-llenar el formulario con los valores actuales para que sean editables
          this.editForm.patchValue({
            unidadNumero: response.data.unidadActual,
            fechaInicio: response.data.fechaInicio,
            fechaFinUnidad: response.data.fechaFin
          });
          
          // Todos los campos son opcionales - se puede editar cualquier combinación
          // No se requiere unidadNumero explícitamente, pero se recomienda para consistencia
          this.editForm.get('unidadNumero')?.clearValidators();
          this.editForm.get('fechaInicio')?.clearValidators();
          this.editForm.get('fechaFinUnidad')?.clearValidators();
          this.editForm.updateValueAndValidity();
          
          // Si es subscriptionType 1, manejar las dos unidades
          if (this.subscriptionDetails.subscriptionTypeId === 1) {
            this.handleDualUnits();
          }
          
          // Cargar las unidades disponibles
          this.loadNextUnits();
          
          // ✨ Cargar materias disponibles y selección actual al inicio
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
      // Verificar si unidadActualTitulo contiene información de dos unidades (JSON)
      if (this.subscriptionDetails?.unidadActualTitulo.startsWith('{')) {
        const unidadesInfo = JSON.parse(this.subscriptionDetails.unidadActualTitulo);
        this.dualUnitsInfo = unidadesInfo;
        
        // Crear un título descriptivo para mostrar
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
      console.error('Error al procesar materias:', error);
      this.materiasArray = [];
    }
  }

  loadNextUnits(): void {
    this.suscripcionesService.getNextUnits(this.data.suscripcionId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.nextUnits = response.data;
          this.buildUnitsByYear();
          // Pre-select the exact unit by matching numero + anio
          if (this.subscriptionDetails) {
            const details = this.subscriptionDetails;
            const matching = this.nextUnits.find(u =>
              u.unidadNumero === details.unidadActual &&
              (!u.anio || !details.unidadActualAnio || u.anio === details.unidadActualAnio)
            );
            if (matching) {
              this.editForm.patchValue({ unidadNumero: matching.id });
            }
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
      .map(([year, units]) => ({
        year,
        units: units.sort((a, b) => a.unidadNumero - b.unidadNumero)
      }));
    this.availableYears = this.unitsByYear.map(g => g.year);
    // Pre-seleccionar el año de la unidad actual
    const currentAnio = this.subscriptionDetails?.unidadActualAnio;
    if (currentAnio && this.availableYears.includes(currentAnio)) {
      this.selectedYear = currentAnio;
    } else if (this.availableYears.length > 0) {
      this.selectedYear = this.availableYears[0];
    }
  }

  onYearChange(year: number): void {
    this.selectedYear = year;
    // Resetear selección de unidad al cambiar de año
    this.editForm.patchValue({ unidadNumero: '' });
  }

  getUnitsForSelectedYear(): UnitOption[] {
    if (this.selectedYear === null) { return []; }
    return this.unitsByYear.find(g => g.year === this.selectedYear)?.units ?? [];
  }

  getSelectedUnit(): UnitOption | null {
    const id = this.editForm.get('unidadNumero')?.value;
    if (!id) { return null; }
    for (const g of this.unitsByYear) {
      const found = g.units.find(u => u.id === id);
      if (found) { return found; }
    }
    return null;
  }

  onUnitChange(): void {
    const selectedId = this.editForm.get('unidadNumero')?.value;
    if (selectedId) {
      const unit = this.nextUnits.find(u => u.id === selectedId);
      if (unit) {
        this.editForm.patchValue({
          fechaInicio: unit.fechaInicio,
          fechaFinUnidad: unit.fechaFin
        });
      }
    }
  }

  selectAction(action: 'EDIT' | 'CANCEL'): void {
    this.selectedAction = action;
  }

  onConfirm(): void {
    if (this.selectedAction === 'CANCEL') {
      this.confirmCancel();
    } else if (this.selectedAction === 'EDIT') {
      // Siempre permitir guardar - se puede editar cualquier combinación de campos
      this.confirmEdit();
    }
  }

  confirmEdit(): void {
    this.loading = true;
    const formData = this.editForm.value;
    
    const editData: EditSubscriptionRequest = {
      subscriptionId: this.data.suscripcionId,
      action: 'EDIT'
    };

    // Incluir todos los campos del formulario si tienen valores
    // Se pueden editar unidad, fechas y materias independientemente
    let hasChanges = false;

    if (formData.unidadNumero != null && formData.unidadNumero !== '') {
      editData.unitId = formData.unidadNumero;  // formData.unidadNumero ahora almacena el ID exacto del UnitSchedule
      hasChanges = true;
    }

    if (formData.fechaInicio) {
      editData.fechaInicio = formData.fechaInicio;
      hasChanges = true;
    }

    if (formData.fechaFinUnidad) {
      editData.fechaFinUnidad = formData.fechaFinUnidad;
      hasChanges = true;
    }

    // ✨ Si hay materias/opciones seleccionadas, agregarlas al payload
    if (this.materiasOpcionesSeleccionadas.size > 0) {
      editData.materiasOpcionesJson = this.buildMateriasOpcionesJson();
      hasChanges = true;
    }

    // Validar que al menos haya algo que actualizar
    if (!hasChanges) {
      this.showMessage('Debes modificar al menos un campo (unidad, fechas o materias)', 'error');
      this.loading = false;
      return;
    }

    this.suscripcionesService.editSubscription(editData).subscribe({
      next: (response) => {
        if (response.result) {
          this.showMessage('Suscripción editada exitosamente', 'success');
          this.dialogRef.close(true);
        } else {
          this.showMessage('No se pudo editar la suscripción', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error editing subscription:', error);
        
        // Detectar errores de permisos (403 Forbidden)
        if (error.status === 403) {
          this.showMessage('No tienes permisos para editar materias y opciones. Solo usuarios ADMIN.', 'error');
        } 
        // Detectar error de AccessDeniedException del backend
        else if (error.error?.message?.includes('ADMIN')) {
          this.showMessage(error.error.message, 'error');
        }
        // Error genérico
        else {
          this.showMessage('Error al editar la suscripción: ' + (error.error?.message || error.message || 'Error desconocido'), 'error');
        }
        
        this.loading = false;
      }
    });
  }

  confirmCancel(): void {
    this.loading = true;
    
    const editData: EditSubscriptionRequest = {
      subscriptionId: this.data.suscripcionId,
      action: 'CANCEL'
    };

    this.suscripcionesService.editSubscription(editData).subscribe({
      next: (response) => {
        if (response.result) {
          this.showMessage('Suscripción cancelada exitosamente', 'success');
          this.dialogRef.close(true);
        } else {
          this.showMessage('No se pudo cancelar la suscripción', 'error');
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

  // ==================== ✨ MÉTODOS PARA EDICIÓN DE MATERIAS (ADMIN Y SUPADMIN) ====================

  /**
   * Carga las materias disponibles para el tipo de suscripción actual.
   */
  loadMateriasDisponibles(): void {
    // Obtener el subscriptionTypeId correcto (desde data o desde subscriptionDetails)
    const subscriptionTypeId = this.subscriptionDetails?.subscriptionTypeId || this.data.subscriptionTypeId;
    
    console.log('=== DEBUG loadMateriasDisponibles ===');
    console.log('this.data.subscriptionTypeId:', this.data.subscriptionTypeId);
    console.log('this.subscriptionDetails?.subscriptionTypeId:', this.subscriptionDetails?.subscriptionTypeId);
    console.log('subscriptionTypeId usado:', subscriptionTypeId);
    
    this.loading = true;
    this.suscripcionesApi.getMateriasBySubscriptionType(subscriptionTypeId).subscribe({
      next: (response) => {
        console.log('Materias recibidas:', response);
        if (response.result && response.data) {
          this.materiasDisponibles = response.data;
          
          // Cargar las opciones para cada materia
          this.materiasDisponibles.forEach(materia => {
            this.loadOpcionesForMateria(materia.id);
          });
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

  /**
   * Carga las opciones disponibles para una materia específica.
   */
  loadOpcionesForMateria(materiaId: number): void {
    this.suscripcionesApi.getOpcionesByMateria(materiaId).subscribe({
      next: (opciones: any) => {
        // El backend retorna un array directamente
        if (Array.isArray(opciones)) {
          this.opcionesDisponiblesPorMateria.set(materiaId, opciones);
        }
      },
      error: (error) => {
        console.error(`Error loading opciones for materia ${materiaId}:`, error);
      }
    });
  }

  /**
   * Carga la selección actual de materias/opciones desde el JSON.
   */
  loadCurrentMateriasSelection(): void {
    if (!this.subscriptionDetails?.materiasOpcionesJson) {
      return;
    }

    try {
      const materiasJson = JSON.parse(this.subscriptionDetails.materiasOpcionesJson);
      this.materiasOpcionesSeleccionadas.clear();
      
      for (const materia in materiasJson) {
        if (materiasJson.hasOwnProperty(materia)) {
          const opciones = materiasJson[materia];
          if (Array.isArray(opciones)) {
            this.materiasOpcionesSeleccionadas.set(materia, opciones);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing materias JSON:', error);
    }
  }

  /**
   * Maneja el cambio de selección de una materia.
   */
  onMateriaChange(materia: MateriaOption, checked: boolean): void {
    if (checked) {
      // Si se selecciona la materia, inicializar con array vacío
      if (!this.materiasOpcionesSeleccionadas.has(materia.nombre)) {
        this.materiasOpcionesSeleccionadas.set(materia.nombre, []);
      }
    } else {
      // Si se deselecciona, eliminar todas sus opciones
      this.materiasOpcionesSeleccionadas.delete(materia.nombre);
    }
  }

  /**
   * Maneja el cambio de selección de una opción dentro de una materia.
   */
  onOpcionChange(materia: MateriaOption, opcion: OpcionByMateria, checked: boolean): void {
    const materiaKey = materia.nombre;
    let opciones = this.materiasOpcionesSeleccionadas.get(materiaKey) || [];
    
    if (checked) {
      // Agregar la opción si no está
      if (!opciones.includes(opcion.nombre)) {
        opciones.push(opcion.nombre);
      }
    } else {
      // Eliminar la opción
      opciones = opciones.filter(o => o !== opcion.nombre);
    }
    
    this.materiasOpcionesSeleccionadas.set(materiaKey, opciones);
  }

  /**
   * Construye el JSON de materias/opciones seleccionadas.
   */
  buildMateriasOpcionesJson(): string {
    const result: { [key: string]: string[] } = {};
    
    this.materiasOpcionesSeleccionadas.forEach((opciones, materia) => {
      if (opciones.length > 0) {
        result[materia] = opciones;
      }
    });
    
    return JSON.stringify(result);
  }

  /**
   * Verifica si una materia está seleccionada.
   */
  isMateriaSelected(materiaNombre: string): boolean {
    return this.materiasOpcionesSeleccionadas.has(materiaNombre);
  }

  /**
   * Verifica si una opción está seleccionada dentro de una materia.
   */
  isOpcionSelected(materiaNombre: string, opcionNombre: string): boolean {
    const opciones = this.materiasOpcionesSeleccionadas.get(materiaNombre);
    return opciones ? opciones.includes(opcionNombre) : false;
  }

  /**
   * Obtiene las opciones disponibles para una materia.
   */
  getOpcionesForMateria(materiaId: number): OpcionByMateria[] {
    return this.opcionesDisponiblesPorMateria.get(materiaId) || [];
  }

  /**
   * Verifica si hay materias seleccionadas (helper para template).
   */
  hasMateriasSeleccionadas(): boolean {
    return this.materiasOpcionesSeleccionadas.size > 0;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private showMessage(message: string, type: 'success' | 'error' = 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
