import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../@auth/components/shared.service';
import { PromotorProfileService } from '../../@core/backend/services/promotor-profile.service';

@Component({
  selector: 'ngx-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  // Usuario actual
  currentUser: any;
  userInitials = '';
  userName = '';
  
  // Active tab for the profile page
  activeTab: 'personal' | 'pagos' | 'seguridad' = 'personal';

  // Formulario información personal
  formPersonal = {
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    dni: '',
    ruc: '',
    image: ''
  };

  // Formulario método de pago
  formPago = {
    banco: '',
    cuenta: '',
    cuentaCci: ''
  };

  // Formulario seguridad
  formSeguridad = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  loading = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private sharedService: SharedService,
    private profileService: PromotorProfileService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.sharedService.getCurrentUser();
    if (this.currentUser) {
      this.loadUserData();
    }
  }

  private loadUserData(): void {
    this.profileService.getProfile(this.currentUser.id).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          const profile = response.data;
          
          this.userName = `${profile.firstname || ''} ${profile.lastname || ''}`.trim();
          this.userInitials = this.getInitials(this.userName);
          
          // Cargar datos en formularios
          this.formPersonal = {
            firstname: profile.firstname || '',
            lastname: profile.lastname || '',
            email: profile.email || '',
            phone: profile.phone || '',
            dni: profile.dni || '',
            ruc: profile.ruc || '',
            image: profile.image || ''
          };

          this.formPago = {
            banco: profile.banco || '',
            cuenta: profile.cuenta || '',
            cuentaCci: profile.cuentaCci || ''
          };

          if (profile.image) {
            this.imagePreview = profile.image;
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar datos del usuario:', err);
        alert('Error al cargar el perfil. Por favor recarga la página.');
      }
    });
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
      
      // Preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.selectedFile = null;
    this.imagePreview = this.formPersonal.image || null;
  }

  onSubmitPersonal(): void {
    if (!this.currentUser) return;

    this.loading = true;

    this.profileService.updatePersonalInfo(this.currentUser.id, this.formPersonal, this.selectedFile || undefined).subscribe({
      next: (response) => {
        if (response.result) {
          alert('Perfil actualizado exitosamente');
          this.loadUserData();
          this.selectedFile = null;
        } else {
          alert('Error al actualizar el perfil: ' + response.message);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        alert('Error al actualizar el perfil. Por favor intenta nuevamente.');
        this.loading = false;
      }
    });
  }

  onSubmitPago(): void {
    if (!this.currentUser) return;

    this.loading = true;

    this.profileService.updateBankingInfo(this.currentUser.id, this.formPago).subscribe({
      next: (response) => {
        if (response.result) {
          alert('Método de pago actualizado exitosamente');
          this.loadUserData();
        } else {
          alert('Error al actualizar método de pago: ' + response.message);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al actualizar método de pago:', err);
        alert('Error al actualizar método de pago. Por favor intenta nuevamente.');
        this.loading = false;
      }
    });
  }

  onSubmitSeguridad(): void {
    if (!this.currentUser) return;

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

    this.profileService.changePassword(
      this.currentUser.id, 
      this.formSeguridad.currentPassword, 
      this.formSeguridad.newPassword
    ).subscribe({
      next: (response) => {
        if (response.result) {
          alert('Contraseña actualizada exitosamente');
          // Limpiar el formulario
          this.formSeguridad = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
        } else {
          alert('Error al actualizar la contraseña: ' + response.message);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al actualizar contraseña:', err);
        const errorMessage = err.error?.message || 'Error al actualizar la contraseña. Por favor intenta nuevamente.';
        alert(errorMessage);
        this.loading = false;
      }
    });
  }

  onDeletePromotor(): void {
    if (!this.currentUser) return;

    if (confirm('¿Estás seguro de que deseas renunciar al programa de embajadores? Se eliminará tu rol de promotor y tu cupón de descuento.')) {
      if (confirm('ÚLTIMA ADVERTENCIA: Esta acción es permanente. Perderás acceso al panel de promotor y todas tus estadísticas. ¿Continuar?')) {
        this.loading = true;
        
        this.profileService.deletePromotorRole(this.currentUser.id).subscribe({
          next: (response) => {
            if (response.result) {
              alert('Has renunciado al programa de embajadores exitosamente. Serás redirigido a la página principal.');
              // Redirigir al usuario a la página principal o login
              window.location.href = '/';
            } else {
              alert('Error al renunciar: ' + response.message);
              this.loading = false;
            }
          },
          error: (err) => {
            console.error('Error al renunciar al programa:', err);
            alert('Error al procesar la solicitud. Por favor intenta nuevamente.');
            this.loading = false;
          }
        });
      }
    }
  }
}
