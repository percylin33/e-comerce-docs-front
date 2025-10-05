import { Component, OnInit } from '@angular/core';
import { ComentarioCliente } from '../../../@core/interfaces/comentario-cliente';
import { ComentarioClienteService } from '../../../@core/backend/services/comentario-cliente.service';

@Component({
  selector: 'ngx-comentario-crud',
  templateUrl: './comentario-crud.component.html',
  styleUrls: ['./comentario-crud.component.scss']
})
export class ComentarioCrudComponent implements OnInit {
  mensaje: string = '';
    comentarios: ComentarioCliente[] = [];
      editComentario: ComentarioCliente | null = null;
      nuevoComentario: ComentarioCliente = {
        nombre: '',
        avatar: '',
        ubicacion: '',
        texto: ''
      };
      isEditing: boolean = false;
      mostrarFormulario: boolean = false;
    
      constructor(private comentarioService: ComentarioClienteService) {}
    
      ngOnInit() {
        this.cargarComentarios();
      }
    
      cargarComentarios() {
        this.comentarioService.getAll().subscribe(data => {
          this.comentarios = data;
        });
      }
    
      guardarNuevo() {
        this.comentarioService.create(this.nuevoComentario).subscribe(() => {
          this.cargarComentarios();
          this.nuevoComentario = { nombre: '', avatar: '', ubicacion: '', texto: '' };
          this.mostrarFormulario = false;
          this.mensaje = 'Comentario creado exitosamente.';
          setTimeout(() => this.mensaje = '', 2500);
        });
      }
    
      editarComentario(comentario: ComentarioCliente) {
        this.editComentario = { ...comentario };
        this.isEditing = true;
      }
    
      guardarEdicion() {
        if (this.editComentario && this.editComentario.id) {
          this.comentarioService.update(this.editComentario.id, this.editComentario).subscribe(() => {
            this.cargarComentarios();
            this.cancelarEdicion();
            this.mensaje = 'Comentario actualizado exitosamente.';
            setTimeout(() => this.mensaje = '', 2500);
          });
        }
      }
    
      eliminarComentario(id: number) {
        if (confirm('¿Está seguro que desea eliminar este comentario? Esta acción no se puede deshacer.')) {
          this.comentarioService.delete(id).subscribe(() => {
            this.cargarComentarios();
            this.mensaje = 'Comentario eliminado correctamente.';
            setTimeout(() => this.mensaje = '', 2500);
          });
        }
      }
    
      cancelarEdicion() {
        this.editComentario = null;
        this.isEditing = false;
      }
}
