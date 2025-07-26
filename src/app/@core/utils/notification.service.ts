import { Injectable } from '@angular/core';
import { NbToastrService, NbGlobalPosition } from '@nebular/theme';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private toastrService: NbToastrService) {}

  showError(message: string, title: string = 'Error'): void {
    // Asegurar que el toast aparezca en la posición correcta
    this.addCustomStyles();
    
    setTimeout(() => {
      this.toastrService.danger(message, title, {
        duration: 6000,
        destroyByClick: true,
        preventDuplicates: true,
        hasIcon: true
      });
    }, 300);
  }

  showSuccess(message: string, title: string = 'Éxito'): void {
    this.addCustomStyles();
    
    setTimeout(() => {
      this.toastrService.success(message, title, {
        duration: 4000,
        destroyByClick: true,
        preventDuplicates: true,
        hasIcon: true
      });
    }, 300);
  }

  showWarning(message: string, title: string = 'Advertencia'): void {
    this.addCustomStyles();
    
    setTimeout(() => {
      this.toastrService.warning(message, title, {
        duration: 5000,
        destroyByClick: true,
        preventDuplicates: true,
        hasIcon: true
      });
    }, 300);
  }

  showInfo(message: string, title: string = 'Información'): void {
    this.addCustomStyles();
    
    setTimeout(() => {
      this.toastrService.info(message, title, {
        duration: 4000,
        destroyByClick: true,
        preventDuplicates: true,
        hasIcon: true
      });
    }, 300);
  }

  private addCustomStyles(): void {
    // Agregar estilos dinámicamente para asegurar posicionamiento correcto
    if (!document.getElementById('custom-toastr-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'custom-toastr-styles';
      styleElement.innerHTML = `
        nb-toastr-container {
          position: fixed !important;
          top: 100px !important;
          right: 20px !important;
          z-index: 99999 !important;
          max-width: 400px !important;
        }
        
        @media (max-width: 768px) {
          nb-toastr-container {
            top: 90px !important;
            right: 15px !important;
            left: 15px !important;
            max-width: calc(100% - 30px) !important;
          }
        }
        
        @media (max-width: 480px) {
          nb-toastr-container {
            top: 85px !important;
            right: 10px !important;
            left: 10px !important;
            max-width: calc(100% - 20px) !important;
          }
        }
        
        nb-toast {
          margin-bottom: 10px !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
          border-radius: 8px !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        nb-toast .title {
          font-weight: 600 !important;
          font-size: 14px !important;
        }
        
        nb-toast .message {
          font-size: 13px !important;
          line-height: 1.4 !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
  }
}
