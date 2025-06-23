import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserDto } from '../../@core/interfaces/users';
import { SharedService } from '../../@auth/components/shared.service';

@Component({
  selector: 'ngx-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  
  user$ = this.sharedService.user$;
  id: number;
  user: UserDto= {
    id: 1,
    name: 'Juan Pérez',
    lastname: '',
    email: 'juan@example.com',
    roles: ['Usuario', 'Administrador'],
    picture: 'https://i.pravatar.cc/150?img=3',
    phone: '+51 999 999 999', // Nuevo campo          // Nuevo campo
  };
  
   constructor(
    private fb: FormBuilder,
    private sharedService: SharedService,
  ) {
    this.form = this.fb.group({
      nombre: [this.user.name],
      email: [this.user.email],
      avatar: [null]
    });
  }

  

  ngOnInit(): void {
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser ) {
      
      const userData = JSON.parse(currentUser);
      this.user.id = userData.id;
      this.user.name = userData.name;
      this.user.lastname = userData.lastname || '';
      this.user.email = userData.sub;
      this.user.roles = userData.roles || [];
      this.user.picture = userData.picture  // Asignar un valor por defecto si no existe
      this.user.phone = userData.phone || '+51 999 999 999'; // Asignar un valor por defecto si no existe

    }
    
  }

  historial = [
    { fecha: '2025-05-20', accion: 'Descargó: Documento A.pdf' },
    { fecha: '2025-05-15', accion: 'Actualizó su perfil' },
    { fecha: '2025-05-10', accion: 'Descargó: Contrato_2025.docx' }
  ];

  form: FormGroup;
  editando = false;
  imagenPreview: string | ArrayBuffer | null = null;
  

 


  activarEdicion() {
    this.editando = true;
  }

  guardarCambios() {
    this.user.name = this.form.value.nombre;
    this.user.email = this.form.value.email;
    this.editando = false;
    this.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      accion: 'Actualizó su perfil'
    });
  }

  seleccionarImagen(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = () => {
        this.imagenPreview = lector.result;
        this.user.picture = lector.result as string;
      };
      lector.readAsDataURL(archivo);
    }
  }

  editarPerfil() {
    this.editando = true;
  }

  cancelarEdicion() {
    this.editando = false;
    // Aquí podrías restaurar datos originales si los guardaste antes
  }

  onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.user.picture = e.target.result; // Actualiza el avatar con la imagen seleccionada
    };
    reader.readAsDataURL(file);
  }
}

 
  
}
