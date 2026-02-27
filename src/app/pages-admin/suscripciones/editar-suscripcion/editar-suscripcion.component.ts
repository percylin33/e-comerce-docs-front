import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
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

export interface UnitOption {
  id: number;
  unidadNumero: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  subscriptionTypeId: number;
}

@Component({
  selector: 'ngx-editar-suscripcion',
  templateUrl: './editar-suscripcion.component.html',
  styleUrls: ['./editar-suscripcion.component.scss']
})
export class EditarSuscripcionComponent implements OnInit {
  suscripcionId!: number;
  editForm: FormGroup;
  nextUnits: UnitOption[] = [];
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
          
          // NO inicializar el formulario aún, esperar a cargar nextUnits
          this.editForm.patchValue({
            fechaInicio: response.data.fechaInicio,
            fechaFinUnidad: response.data.fechaFinUnidad
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
          
          // Ahora que tenemos nextUnits, encontrar el ID de la unidad actual
          const currentUnit = this.nextUnits.find(
            u => u.unidadNumero === this.subscriptionDetails!.unidadActual
          );
          
          if (currentUnit) {
            this.originalUnitId = currentUnit.id;
            console.log('💾 ID de unidad original guardado:', this.originalUnitId, '(unidadNumero:', currentUnit.unidadNumero, ')');
            
            // Inicializar el formulario con el ID de la unidad actual
            this.editForm.patchValue({
              unidadNumero: currentUnit.id
            });
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

  onUnitChange(): void {
    const selectedUnitId = this.editForm.get('unidadNumero')?.value;
    console.log('🔄 onUnitChange llamado, unit ID seleccionado:', selectedUnitId);
    
    if (selectedUnitId && this.subscriptionDetails) {
      // Buscar la unidad completa por ID
      const selectedUnit = this.nextUnits.find(u => u.id === Number(selectedUnitId));
      
      if (!selectedUnit) {
        console.error('❌ No se encontró la unidad con ID:', selectedUnitId);
        return;
      }
      
      console.log('📥 Cargando detalles de unidad:', {
        unitId: selectedUnit.id,
        unidadNumero: selectedUnit.unidadNumero,
        subscriptionTypeId: this.subscriptionDetails.subscriptionTypeId
      });
      
      this.suscripcionesService.getUnitDetails(this.subscriptionDetails.subscriptionTypeId, selectedUnit.unidadNumero).subscribe({
        next: (response) => {
          if (response.result && response.data) {
            const unitData = response.data;
            console.log('✅ Detalles de unidad cargados:', unitData);
            this.editForm.patchValue({
              fechaInicio: unitData.fechaInicio,
              fechaFinUnidad: unitData.fechaFin
            });
            console.log('📝 Formulario actualizado con fechas de la unidad');
          }
        },
        error: (error) => {
          console.error('❌ Error loading unit details:', error);
          this.showMessage('Error al cargar los detalles de la unidad', 'error');
        }
      });
    }
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
      if (result === true) {
        this.confirmCancel();
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

    const dialogRef = this.dialog.open(ConfirmChangesDialogComponent, {
      width: '750px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: changesSummary,
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.confirmEdit();
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

    if (formData.fechaFinUnidad && formData.fechaFinUnidad !== this.subscriptionDetails.fechaFinUnidad) {
      summary.hasChanges = true;
      dateChanges.fechaFinUnidad = {
        old: this.subscriptionDetails.fechaFinUnidad,
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

  confirmEdit(): void {
    this.loading = true;
    const formData = this.editForm.value;
    
    const editData: EditSubscriptionRequest = {
      subscriptionId: this.suscripcionId,
      action: 'EDIT'
    };

    // Incluir todos los campos del formulario si tienen valores
    let hasChanges = false;

    if (formData.unidadNumero != null && formData.unidadNumero !== '') {
      // formData.unidadNumero ahora contiene el unit.id
      editData.unitId = Number(formData.unidadNumero);
      console.log('📤 Enviando cambio de unidad - unitId:', editData.unitId);
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

  confirmCancel(): void {
    this.loading = true;
    const cancelData: EditSubscriptionRequest = {
      subscriptionId: this.suscripcionId,
      action: 'CANCEL'
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
