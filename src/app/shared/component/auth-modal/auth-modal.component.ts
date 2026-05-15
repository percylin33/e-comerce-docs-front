import { Component, OnInit, HostListener, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxLoginComponent } from '../../../@auth/components/login/login.component';
import { RegisterComponent } from '../../../@auth/components/register/register.component';

@Component({
    selector: 'ngx-auth-modal',
    templateUrl: './auth-modal.component.html',
    styleUrls: ['./auth-modal.component.scss'],
    standalone: true,
    imports: [NgxLoginComponent, RegisterComponent]
})
export class AuthModalComponent implements OnInit {
  dialogRef = inject<MatDialogRef<AuthModalComponent>>(MatDialogRef);
  data = inject(MAT_DIALOG_DATA);

  authPanel: 'login' | 'register' = 'login';

  isMobile: boolean = false;
  isSmallHeight: boolean = false;
  isSmallWidth: boolean = false;
  isVerySmallHeight: boolean = false;

  ngOnInit() {
    this.checkScreenSize();
    // No configurar posición automáticamente en ngOnInit
    // Solo ajustar si realmente es necesario
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
    // Solo ajustar en resize si es móvil con altura pequeña
    if (this.isMobile && this.isVerySmallHeight) {
      this.adjustModalForDevice();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    this.isSmallHeight = window.innerHeight <= 600;
    this.isSmallWidth = window.innerWidth <= 380;
    this.isVerySmallHeight = window.innerHeight <= 500;
  }

  private adjustModalForDevice() {
    // Solo ajustar para casos extremos Y solo en móviles
    if (this.isVerySmallHeight && this.isMobile) {
      this.dialogRef.updatePosition({ top: '10px' });
      
      setTimeout(() => {
        const dialogElement = document.querySelector('.mat-dialog-container') as HTMLElement;
        if (dialogElement) {
          dialogElement.style.maxHeight = 'calc(100vh - 20px)';
          dialogElement.style.overflowY = 'auto';
        }
      }, 100);
    }
    // Para desktop, NUNCA aplicar restricciones incluso si la altura es pequeña
  }

  showLoginPanel(): void {
    this.authPanel = 'login';
  }

  showRegisterPanel(): void {
    this.authPanel = 'register';
  }

  closeModal() {
    this.dialogRef.close();
  }
}
