import { Component, OnInit, inject } from '@angular/core';
import { EquipoService } from '../../../@core/backend/services/equipo.service';
import { Equipo } from '../../../@core/interfaces/equipo';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'ngx-equipo-crud',
    templateUrl: './equipo-crud.component.html',
    styleUrls: ['./equipo-crud.component.scss'],
    standalone: true,
    imports: [FormsModule]
})
export class EquipoCrudComponent implements OnInit {
  private equipoService = inject(EquipoService);

  mensaje: string = '';
  equipos: Equipo[] = [];
  equiposFiltrados: Equipo[] = [];
  tipoSeleccionado: string = 'todos';
  tipos: string[] = ['todos', 'equipo', 'equipoDocentes', 'equipoDireccion', 'equipoAtencion'];
  tipoLabels: { [key: string]: string } = {
    todos: 'Todos',
    equipo: 'CEO',
    equipoDocentes: 'Área Pedagógica',
    equipoDireccion: 'Área de Dirección',
    equipoAtencion: 'Área de Venta'
  };
  editEquipo: Equipo | null = null;
  nuevoEquipo: Equipo = {
    img: '',
    name: '',
    role: '',
    title: '',
    especialidades: [],
    detalle: '',
    tipo: 'equipo'
  };
  isEditing: boolean = false;
  mostrarFormulario: boolean = false;

  ngOnInit() {
    this.cargarEquipos();
  }

  cargarEquipos() {
    this.equipoService.getAll().subscribe(data => {
      this.equipos = data;
      this.filtrarEquipos();
    });
  }

  filtrarEquipos() {
    if (this.tipoSeleccionado === 'todos') {
      this.equiposFiltrados = this.equipos;
    } else {
      this.equiposFiltrados = this.equipos.filter(e => e.tipo === this.tipoSeleccionado);
    }
  }

  onTipoChange() {
    this.filtrarEquipos();
  }

  guardarNuevo() {
    this.equipoService.create(this.nuevoEquipo).subscribe(() => {
      this.cargarEquipos();
      this.nuevoEquipo = {
        img: '', name: '', role: '', title: '', especialidades: [], detalle: '', tipo: 'equipo'
      };
      this.mensaje = 'Equipo creado exitosamente.';
      setTimeout(() => this.mensaje = '', 2500);
    });
  }

  editarEquipo(equipo: Equipo) {
    this.editEquipo = { ...equipo };
    this.isEditing = true;
  }

  guardarEdicion() {
    if (this.editEquipo && this.editEquipo.id) {
      this.equipoService.update(this.editEquipo.id, this.editEquipo).subscribe(() => {
        this.cargarEquipos();
        this.cancelarEdicion();
        this.mensaje = 'Equipo actualizado exitosamente.';
        setTimeout(() => this.mensaje = '', 2500);
      });
    }
  }

  eliminarEquipo(id: number) {
    if (confirm('¿Está seguro que desea eliminar este equipo? Esta acción no se puede deshacer.')) {
      this.equipoService.delete(id).subscribe(() => {
        this.cargarEquipos();
        this.mensaje = 'Equipo eliminado correctamente.';
        setTimeout(() => this.mensaje = '', 2500);
      });
    }
  }

  cancelarEdicion() {
    this.editEquipo = null;
    this.isEditing = false;
  }
}
