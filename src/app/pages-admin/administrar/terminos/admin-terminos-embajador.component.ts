import { Component, inject } from '@angular/core';
import { TerminosCondicionesService } from '../../../@core/backend/services/terminos-condiciones.service';
import { TerminosCondiciones } from '../../../@core/interfaces/terminos-condiciones.model';
import { NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'ngx-admin-terminos-embajador',
    templateUrl: './admin-terminos-embajador.component.html',
    styleUrls: ['./admin-terminos-embajador.component.scss'],
    standalone: true,
    imports: [NgStyle, FormsModule]
})
export class AdminTerminosEmbajadorComponent {
  private terminosService = inject(TerminosCondicionesService);

  terminos: TerminosCondiciones[] = [];
  terminosEdit: TerminosCondiciones | null = null;
  modoEdicion: boolean = false;

  constructor() {
    this.cargarTerminos();
  }

  cargarTerminos() {
    this.terminosService.getAll().subscribe(data => {
      this.terminos = data.sort((a, b) => a.id - b.id);
    });
  }

  editarTermino(termino: TerminosCondiciones) {
    this.terminosEdit = { ...termino };
    this.modoEdicion = true;
  }

  nuevoTermino() {
    this.terminosEdit = {
      id: 0,
      titulo: '',
      contenido: '',
      fechaCreacion: '',
      fechaActualizacion: '',
      activo: true,
      vistaPrevia: false
    };
    this.modoEdicion = true;
  }

  guardarTermino() {
    if (this.terminosEdit) {
      if (this.terminosEdit.id) {
        this.terminosService.update(this.terminosEdit.id, this.terminosEdit).subscribe(() => {
          this.cargarTerminos();
          this.cancelar();
        });
      } else {
        this.terminosService.create(this.terminosEdit).subscribe(() => {
          this.cargarTerminos();
          this.cancelar();
        });
      }
    }
  }

  eliminarTermino(id: number) {
    const confirmado = window.confirm('¿Estás seguro de que deseas eliminar este término? Esta acción no se puede deshacer.');
    if (confirmado) {
      this.terminosService.delete(id).subscribe(() => {
        this.cargarTerminos();
      });
    }
  }

  cancelar() {
    this.terminosEdit = null;
    this.modoEdicion = false;
  }
}
