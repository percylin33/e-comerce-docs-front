import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'ngx-perfil-admin',
    templateUrl: './perfil-admin.component.html',
    styleUrls: ['./perfil-admin.component.scss'],
    standalone: true,
    imports: [FormsModule]
})
export class PerfilAdminComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();

  currentUser: any;
  userName = '';
  userInitials = '';
  
  activeTab: 'personal' | 'pagos' | 'seguridad' = 'personal';

  formPersonal = {
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    dni: '',
    ruc: ''
  };

  formPago = {
    banco: '',
    cuenta: '',
    cuentaCci: ''
  };

  formSeguridad = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  loading = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUser = user;
        this.userName = `${user.name || ''} ${user.lastname || ''}`.trim();
        this.userInitials = this.getInitials(this.userName);
        
        this.formPersonal = {
          firstname: user.name || '',
          lastname: user.lastname || '',
          email: user.email || '',
          phone: user.phone || '',
          dni: user.dni || '',
          ruc: user.ruc || ''
        };

        if (user.picture) {
          this.imagePreview = user.picture;
        }
      } catch (e) {
        console.error('Error loading user:', e);
      }
    }
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  setTab(tab: 'personal' | 'pagos' | 'seguridad'): void {
    this.activeTab = tab;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onSubmitPersonal(): void {
    this.loading = true;
    // Simulación - en producción conectar con tu servicio
    setTimeout(() => {
      alert('Perfil actualizado exitosamente');
      this.loading = false;
    }, 1000);
  }

  onSubmitPago(): void {
    this.loading = true;
    // Simulación - en producción conectar con tu servicio
    setTimeout(() => {
      alert('Método de pago actualizado exitosamente');
      this.loading = false;
    }, 1000);
  }

  onSubmitSeguridad(): void {
    if (this.formSeguridad.newPassword !== this.formSeguridad.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (this.formSeguridad.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!this.formSeguridad.currentPassword) {
      alert('Debes ingresar tu contraseña actual');
      return;
    }

    this.loading = true;
    // Simulación - en producción conectar con tu servicio
    setTimeout(() => {
      alert('Contraseña actualizada exitosamente');
      this.formSeguridad = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.loading = false;
    }, 1000);
  }

  onCloseModal(): void {
    this.closeModal.emit();
  }
}
