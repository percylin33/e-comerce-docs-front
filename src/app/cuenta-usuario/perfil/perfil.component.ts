import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { UserDto } from '../../@core/interfaces/users';
import { SharedService } from '../../@auth/components/shared.service';
import { UsersService } from '../../@core/backend/services/users.service';
import { Subscription } from 'rxjs';
import { MatCard } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
    selector: 'ngx-perfil',
    templateUrl: './perfil.component.html',
    styleUrls: ['./perfil.component.scss'],
    standalone: true,
    imports: [MatCard, MatButton, MatIcon, MatFormField, MatLabel, MatInput, FormsModule, MatSuffix]
})
export class PerfilComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private sharedService = inject(SharedService);
  private usersService = inject(UsersService);

  
  user$ = this.sharedService.user$;
  id: number;
  private userSubscription: Subscription;
  
  user: UserDto = {
    id: 0,
    name: '',
    lastname: '',
    email: '',
    roles: [],
    picture: 'https://i.pravatar.cc/150?img=3',
    phone: '', 
  };
  
   constructor() {
    // 🔥 SOLUCIÓN: Inicializar formulario vacío primero
    this.form = this.fb.group({
      nombre: [''],
      email: [''],
      phone: [''],
      avatar: [null]
    });

    // 🔥 MEJORA: Cargar datos del localStorage
    this.loadUserData();
    
    // 🔥 NUEVO: Suscribirse al observable del usuario para cambios en tiempo real
    this.userSubscription = this.sharedService.user$.subscribe(userData => {
      if (userData && Object.keys(userData).length > 0) {
        this.updateUserFromSharedService(userData);
      }
    });
  }

  

  ngOnInit(): void {
    // 🔥 MEJORA: Asegurar que los datos estén cargados y actualizar formulario
    this.loadUserData();
    this.updateFormWithUserData();
    
    // 🔥 NUEVO: Intentar cargar desde SharedService si localStorage está vacío
    setTimeout(() => {
      if (this.isUserEmpty()) {
       
        this.loadUserData();
        this.updateFormWithUserData();
      }
    }, 500); // Dar más tiempo para que se guarden los datos
  }

  ngOnDestroy(): void {
    // 🔥 NUEVO: Limpiar suscripción para evitar memory leaks
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // 🔥 NUEVO: Verificar si el usuario está vacío
  private isUserEmpty(): boolean {
    return !this.user.name && !this.user.email && !this.user.phone;
  }

  // 🔥 NUEVO: Actualizar usuario desde SharedService
  private updateUserFromSharedService(userData: any): void {
    
    this.user.id = userData.id || 0;
    this.user.name = userData.name || '';
    this.user.lastname = userData.lastname || '';
    this.user.email = userData.sub || userData.email || '';
    this.user.roles = userData.roles || [];
    this.user.picture = userData.picture || 'https://i.pravatar.cc/150?img=3';
    this.user.phone = userData.phone || '';
    
    // Actualizar formulario con los nuevos datos
    this.updateFormWithUserData();
  }

  // 🔥 NUEVO: Método para cargar datos del usuario
  private loadUserData(): void {
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        
        this.user.id = userData.id || 0;
        this.user.name = userData.name || '';
        this.user.lastname = userData.lastname || '';
        this.user.email = userData.sub || userData.email || '';
        this.user.roles = userData.roles || [];
        this.user.picture = userData.picture || 'https://i.pravatar.cc/150?img=3';
        this.user.phone = userData.phone || '';
        
      } catch (error) {
        console.error('❌ Error al cargar datos del usuario:', error);
      }
    } else {
      console.warn('⚠️ No se encontraron datos del usuario en localStorage');
    }
  }

  // 🔥 NUEVO: Método para actualizar formulario con datos del usuario
  private updateFormWithUserData(): void {
    if (this.form) {
      this.form.patchValue({
        nombre: this.user.name,
        email: this.user.email,
        phone: this.user.phone
      });
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
    // Actualizar datos locales temporalmente
    this.user.name = this.form.value.nombre || this.user.name;
    this.user.email = this.form.value.email || this.user.email;
    this.user.phone = this.form.value.phone || this.user.phone;
    
    // Crear FormData para enviar al backend
    const formData = new FormData();
    formData.append('id', this.user.id.toString());
    formData.append('name', this.user.name);
    formData.append('email', this.user.email);
    formData.append('phone', this.user.phone || '');
    
    // Si hay una imagen nueva, agregarla
    if (this.form.value.avatar) {
      formData.append('avatar', this.form.value.avatar);
    }
    
    // Llamar al backend para guardar cambios
    this.usersService.postUpdateUser(formData).subscribe({
      next: (response) => {
        if (response && response.result) {
          
          
          // Actualizar localStorage con datos frescos del backend
          this.updateLocalStorageFromBackend(response.data);
          
          // Notificar al SharedService para que otros componentes se actualicen
          this.sharedService.setUser(response.data);
          
          this.editando = false;
          this.historial.unshift({
            fecha: new Date().toISOString().split('T')[0],
            accion: 'Actualizó su perfil'
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al actualizar perfil en el backend:', error);
        // Fallback: actualizar solo localStorage si el backend falla
        this.updateLocalStorage();
        this.editando = false;
      }
    });
  }

  // Método para actualizar localStorage (fallback)
  private updateLocalStorage(): void {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        
        // Actualizar con los nuevos datos
        userData.name = this.user.name;
        userData.email = this.user.email;
        userData.phone = this.user.phone;
        userData.picture = this.user.picture;
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
       
      } catch (error) {
        console.error('❌ Error al actualizar localStorage:', error);
      }
    }
  }

  // Nuevo método para actualizar localStorage con datos del backend
  private updateLocalStorageFromBackend(backendData: any): void {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        
        // Actualizar con datos frescos del backend
        userData.name = backendData.name || userData.name;
        userData.lastname = backendData.lastname || userData.lastname;
        userData.email = backendData.email || backendData.sub || userData.email;
        userData.phone = backendData.phone || userData.phone;
        userData.picture = backendData.picture || userData.picture;
        userData.id = backendData.id || userData.id;
        
        // Mantener datos del token que no cambian
        if (backendData.roles) {
          userData.roles = backendData.roles;
        }
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        
        // Actualizar también los datos locales del componente
        this.user.name = userData.name;
        this.user.lastname = userData.lastname;
        this.user.email = userData.email;
        this.user.phone = userData.phone;
        this.user.picture = userData.picture;
       
      } catch (error) {
        console.error('❌ Error al actualizar localStorage desde backend:', error);
      }
    }
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
    // 🔥 MEJORA: Restaurar valores originales del formulario
    this.updateFormWithUserData();
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
