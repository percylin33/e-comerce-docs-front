import { Component, OnInit } from '@angular/core';
import { HistoriaService } from '../../../@core/backend/services/historia.service';
import { Historia } from '../../../@core/interfaces/historia';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'ngx-historia-crud',
    templateUrl: './historia-crud.component.html',
    styleUrls: ['./historia-crud.component.scss'],
    standalone: true,
    imports: [FormsModule]
})
export class HistoriaCrudComponent implements OnInit {
  mensaje: string = '';
  historias: Historia[] = [];
  editHistoria: Historia | null = null;
  nuevoHistoria: Historia = {
    year: '',
    img: '',
    title: '',
    text: ''
  };
  isEditing: boolean = false;
  mostrarFormulario: boolean = false;

  constructor(private historiaService: HistoriaService) {}

  ngOnInit() {
    this.cargarHistorias();
  }

  cargarHistorias() {
    this.historiaService.getAll().subscribe(data => {
      this.historias = data;
    });
  }

  guardarNuevo() {
    this.historiaService.create(this.nuevoHistoria).subscribe(() => {
      this.cargarHistorias();
      this.nuevoHistoria = { year: '', img: '', title: '', text: '' };
      this.mostrarFormulario = false;
      this.mensaje = 'Historia creada exitosamente.';
      setTimeout(() => this.mensaje = '', 2500);
    });
  }

  editarHistoria(historia: Historia) {
    this.editHistoria = { ...historia };
    this.isEditing = true;
  }

  guardarEdicion() {
    if (this.editHistoria && this.editHistoria.id) {
      this.historiaService.update(this.editHistoria.id, this.editHistoria).subscribe(() => {
        this.cargarHistorias();
        this.cancelarEdicion();
        this.mensaje = 'Historia actualizada exitosamente.';
        setTimeout(() => this.mensaje = '', 2500);
      });
    }
  }

  eliminarHistoria(id: number) {
    if (confirm('¿Está seguro que desea eliminar esta historia? Esta acción no se puede deshacer.')) {
      this.historiaService.delete(id).subscribe(() => {
        this.cargarHistorias();
        this.mensaje = 'Historia eliminada correctamente.';
        setTimeout(() => this.mensaje = '', 2500);
      });
    }
  }

  cancelarEdicion() {
    this.editHistoria = null;
    this.isEditing = false;
  }
}
