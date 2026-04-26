import { Component, OnInit } from '@angular/core';
import { AliadoService } from '../../../@core/backend/services/aliado.service';
import { Aliado } from '../../../@core/interfaces/aliado';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'ngx-aliado-crud',
    templateUrl: './aliado-crud.component.html',
    styleUrls: ['./aliado-crud.component.scss'],
    standalone: true,
    imports: [FormsModule]
})
export class AliadoCrudComponent implements OnInit {
  mensaje: string = '';
  aliados: Aliado[] = [];
  editAliado: Aliado | null = null;
  nuevoAliado: Aliado = {
    name: '',
    img: '',
    location: '',
    link: ''
  };
  isEditing: boolean = false;
  mostrarFormulario: boolean = false;

  constructor(private aliadoService: AliadoService) {}

  ngOnInit() {
    this.cargarAliados();
  }

  cargarAliados() {
    this.aliadoService.getAll().subscribe(data => {
      this.aliados = data;
    });
  }

  guardarNuevo() {
    this.aliadoService.create(this.nuevoAliado).subscribe(() => {
      this.cargarAliados();
      this.nuevoAliado = { name: '', img: '', location: '', link: '' };
      this.mostrarFormulario = false;
      this.mensaje = 'Aliado creado exitosamente.';
      setTimeout(() => this.mensaje = '', 2500);
    });
  }

  editarAliado(aliado: Aliado) {
    this.editAliado = { ...aliado };
    this.isEditing = true;
  }

  guardarEdicion() {
    if (this.editAliado && this.editAliado.id) {
      this.aliadoService.update(this.editAliado.id, this.editAliado).subscribe(() => {
        this.cargarAliados();
        this.cancelarEdicion();
        this.mensaje = 'Aliado actualizado exitosamente.';
        setTimeout(() => this.mensaje = '', 2500);
      });
    }
  }

  eliminarAliado(id: number) {
    if (confirm('¿Está seguro que desea eliminar este aliado? Esta acción no se puede deshacer.')) {
      this.aliadoService.delete(id).subscribe(() => {
        this.cargarAliados();
        this.mensaje = 'Aliado eliminado correctamente.';
        setTimeout(() => this.mensaje = '', 2500);
      });
    }
  }

  cancelarEdicion() {
    this.editAliado = null;
    this.isEditing = false;
  }
}
