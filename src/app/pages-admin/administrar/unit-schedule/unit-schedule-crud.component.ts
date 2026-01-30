
 
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UnitScheduleService } from '../../../@core/backend/services/unit-schedule.service';
import { UnitSchedule } from '../../../@core/interfaces/unit-schedule';
import { SubscriptionTypesData, SubscriptionType } from '../../../@core/data/subscription-types';

@Component({
  selector: 'ngx-unit-schedule-crud',
  templateUrl: './unit-schedule-crud.component.html',
  styleUrls: ['./unit-schedule-crud.component.scss']
})
export class UnitScheduleCrudComponent implements OnInit {
  mensaje: string = '';
  mostrarModalEdicion: boolean = false;
  editForm: FormGroup | null = null;
  subscriptionTypes: { id: number; name: string }[] = [];
  collapsedGroups: { [key: number]: boolean } = {};
  private typesLoaded = false;
  private unitsLoaded = false;
  suppressAnimation = true;
  // Mapa de colores por tipo (accent para borde, header para fondo de cabecera)

  
  getSubscriptionTypeName(id: number): string {
    const found = this.subscriptionTypes.find(t => t.id === id);
    return found ? found.name : id.toString();
  }
  unidades: UnitSchedule[] = [];

  trackByUnidad(index: number, unidad: UnitSchedule) {
    return unidad.id;
  }

  selectedYear: string = new Date().getFullYear().toString();

  get availableYears(): string[] {
    const years = this.unidades.map(u => u.anio.toString());
    return Array.from(new Set(years)).sort((a, b) => parseInt(b) - parseInt(a));
  }

  get unidadesFiltradas(): UnitSchedule[] {
    if (!this.selectedYear) return this.unidades;
    return this.unidades.filter(u => u.anio.toString() === this.selectedYear);
  }

  get groupedUnidades() {
    return this.subscriptionTypes.map(type => ({
      type,
      unidades: this.unidadesFiltradas
        .filter(u => u.subscriptionTypeId === type.id)
        .sort((a, b) => a.unidadNumero - b.unidadNumero)
    })).filter(group => group.unidades.length > 0);
  }

  isUnidadActual(unidad: UnitSchedule): boolean {
    const hoy = new Date();
    const inicio = new Date(unidad.fechaInicio);
    const fin = new Date(unidad.fechaFin);
    hoy.setHours(0,0,0,0);
    inicio.setHours(0,0,0,0);
    fin.setHours(0,0,0,0);
    return hoy >= inicio && hoy <= fin;
  }

  // Eliminado getter duplicado groupedUnidades
  editUnidad: UnitSchedule | null = null;
  nuevaUnidad: UnitSchedule = {
    subscriptionTypeId: 0,
    anio: new Date().getFullYear(),
    unidadNumero: 1,
    titulo: '',
    fechaInicio: '',
    fechaFin: ''
  };
  mostrarFormulario: boolean = false;

  constructor(
    private unitScheduleService: UnitScheduleService,
    private fb: FormBuilder,
    private subscriptionService: SubscriptionTypesData,
  ) {}

  /** Devuelve color accent (borde) según subscription type id */
  getAccentColor(typeId: number): string {
    // Try to determine type name for shade decision
    const found = this.subscriptionTypes.find(t => t.id === typeId);
    const name = (found?.name || '').toLowerCase();
    const isAnnual = name.includes('anual');
    // Inicial -> yellow, Primaria -> green, Secundaria -> blue
    if (name.includes('inicial')) {
      return isAnnual ? '#f57c00' : '#ffb300';
    }
    if (name.includes('primaria')) {
      return isAnnual ? '#2e7d32' : '#43a047';
    }
    if (name.includes('secundaria')) {
      return isAnnual ? '#0d47a1' : '#1976d2';
    }
    return isAnnual ? '#546e7a' : '#9e9e9e';
  }

  /** Devuelve color de fondo suave para el header del grupo */
  getHeaderBackground(typeId: number, typeName?: string): string {
    const found = this.subscriptionTypes.find(t => t.id === typeId);
    const name = (typeName || found?.name || '').toLowerCase();
    const isAnnual = name.includes('anual');
    // Lighter backgrounds for mensual, slightly darker for anual
    if (name.includes('inicial')) {
      return isAnnual ? '#fff3e0' : '#fffde7';
    }
    if (name.includes('primaria')) {
      return isAnnual ? '#e8f5e9' : '#f1fbf2';
    }
    if (name.includes('secundaria')) {
      return isAnnual ? '#e1f5fe' : '#f3f9ff';
    }
    return isAnnual ? '#eceff1' : '#f5f7f8';
  }

  toggleGroup(typeId: number): void {
    this.collapsedGroups[typeId] = !this.collapsedGroups[typeId];
    this.saveCollapsedState();
  }

  private saveCollapsedState(): void {
    try {
      localStorage.setItem('unitScheduleCollapsed_v1', JSON.stringify(this.collapsedGroups));
    } catch (e) {
      // ignore
    }
  }

  private loadCollapsedState(): void {
    try {
      const raw = localStorage.getItem('unitScheduleCollapsed_v1');
      if (raw) {
        this.collapsedGroups = JSON.parse(raw);
      }
    } catch (e) {
      // ignore
    }
  }

  ngOnInit() {
    this.loadSubscriptionTypes();
    this.cargarUnidades();
    this.loadCollapsedState();
  }

  private loadSubscriptionTypes(): void {
    this.subscriptionService.getAllActive().subscribe({
      next: (data: SubscriptionType[]) => {
        this.subscriptionTypes = data.map(s => ({ id: s.id, name: s.nombre }));
        // Initialize collapsed state: keep groups collapsed by default to reduce visual noise
        this.subscriptionTypes.forEach(t => {
          if (this.collapsedGroups[t.id] === undefined) {
            this.collapsedGroups[t.id] = true;
          }
        });
        // If there is no persisted state, expand the first group by default
        const anyDefined = Object.keys(this.collapsedGroups).length > 0 && Object.values(this.collapsedGroups).some(v => v === false);
        if (!anyDefined && this.subscriptionTypes.length > 0) {
          this.collapsedGroups[this.subscriptionTypes[0].id] = false;
        }
        this.typesLoaded = true;
        this.checkReady();
      },
      error: (err) => {
        console.error('Error cargando subscription types activos:', err);
        // Fallback: keep empty list or previous defaults if desired
      }
    });
  }

  cargarUnidades() {
    this.unitScheduleService.getAll().subscribe(data => {
      this.unidades = data;
      this.unitsLoaded = true;
      this.checkReady();
    });
  }

  private checkReady(): void {
    if (this.typesLoaded && this.unitsLoaded) {
      // Allow one render cycle without transitions suppressed, then enable animations
      setTimeout(() => this.suppressAnimation = false, 50);
      // update TODO status
      try {
        // no-op to keep parity with expected behavior
      } catch (e) {}
    }
  }

  guardarNuevo() {
    this.unitScheduleService.create(this.nuevaUnidad).subscribe(() => {
      this.cargarUnidades();
      this.nuevaUnidad = {
        subscriptionTypeId: 0,
        anio: new Date().getFullYear(),
        unidadNumero: 1,
        titulo: '',
        fechaInicio: '',
        fechaFin: ''
      };
      this.mostrarFormulario = false;
      this.mensaje = 'Unidad creada exitosamente.';
      setTimeout(() => this.mensaje = '', 2500);
    });
  }

  editarUnidad(unidad: UnitSchedule) {
    this.editUnidad = { ...unidad };
    setTimeout(() => {
      if (!document.querySelector('input[name="editUnidadNumero' + unidad.id + '"]')) {
        console.error('No se renderizó el input de edición para unidad', unidad.id);
      } else {
      }
    }, 200);
  }

  guardarEdicion() {
    if (this.editUnidad && this.editUnidad.id) {
      this.unitScheduleService.update(this.editUnidad.id, this.editUnidad).subscribe(() => {
       
        this.cargarUnidades();
        this.cerrarModalEdicion();
        this.mensaje = 'Unidad actualizada exitosamente.';
        setTimeout(() => this.mensaje = '', 2500);
      }, error => {
        console.error('Error al actualizar unidad:', error);
      });
    } else {
      console.warn('No hay unidad válida para guardar');
    }
  }

  eliminarUnidad(id: number) {
    if (confirm('¿Está seguro que desea eliminar esta unidad? Esta acción no se puede deshacer.')) {
      this.unitScheduleService.delete(id).subscribe(() => {
        this.cargarUnidades();
        this.mensaje = 'Unidad eliminada correctamente.';
        setTimeout(() => this.mensaje = '', 2500);
      });
    }
  }

  cancelarEdicion() {
    this.editUnidad = null;
  }

    abrirModalEdicion(unidad: UnitSchedule) {
      this.editUnidad = { ...unidad };
      this.mostrarModalEdicion = true;
    }

    cerrarModalEdicion() {
      this.editUnidad = null;
      this.mostrarModalEdicion = false;
    }
}
