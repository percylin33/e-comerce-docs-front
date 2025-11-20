
 
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UnitScheduleService } from '../../../@core/backend/services/unit-schedule.service';
import { UnitSchedule } from '../../../@core/interfaces/unit-schedule';

@Component({
  selector: 'ngx-unit-schedule-crud',
  templateUrl: './unit-schedule-crud.component.html',
  styleUrls: ['./unit-schedule-crud.component.scss']
})
export class UnitScheduleCrudComponent implements OnInit {
  mensaje: string = '';
  mostrarModalEdicion: boolean = false;
  editForm: FormGroup | null = null;
  subscriptionTypes = [
    { id: 1, name: 'M - Inicial' },
    { id: 2, name: 'M - Primaria' },
    { id: 3, name: 'M - Secundaria' },
    { id: 4, name: 'A - Secundaria' }
  ];

  
  getSubscriptionTypeName(id: number): string {
    const found = this.subscriptionTypes.find(t => t.id === id);
    return found ? found.name : id.toString();
  }
  unidades: UnitSchedule[] = [];

  trackByUnidad(index: number, unidad: UnitSchedule) {
    return unidad.id;
  }

  selectedYear: string = '';

  get availableYears(): string[] {
    const years = this.unidades.map(u => new Date(u.fechaInicio).getFullYear().toString());
    return Array.from(new Set(years)).sort();
  }

  get unidadesFiltradas(): UnitSchedule[] {
    if (!this.selectedYear) return this.unidades;
    return this.unidades.filter(u => new Date(u.fechaInicio).getFullYear().toString() === this.selectedYear);
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
    unidadNumero: 1,
    titulo: '',
    fechaInicio: '',
    fechaFin: ''
  };
  mostrarFormulario: boolean = false;

  constructor(private unitScheduleService: UnitScheduleService, private fb: FormBuilder) {}

  ngOnInit() {
    this.cargarUnidades();
  }

  cargarUnidades() {
    this.unitScheduleService.getAll().subscribe(data => {
      this.unidades = data;
    });
  }

  guardarNuevo() {
    this.unitScheduleService.create(this.nuevaUnidad).subscribe(() => {
      this.cargarUnidades();
      this.nuevaUnidad = {
        subscriptionTypeId: 0,
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
