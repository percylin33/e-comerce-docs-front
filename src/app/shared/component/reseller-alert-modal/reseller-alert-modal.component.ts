import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ngx-reseller-alert-modal',
  template: `
    <div class="reseller-alert-modal">
      <div class="modal-header" [class.conflict-header]="data.isConflict">
        <h3 class="modal-title">
          <span *ngIf="data.isConflict">🚫 Conflicto de Suscripción</span>
          <span *ngIf="!data.isConflict">⚠️ Alerta de Revendedor</span>
        </h3>
        <button class="close-btn" (click)="onClose()" aria-label="Cerrar modal">
          <span>×</span>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="alert-content">
          <div class="alert-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="alert-message">
            <p class="main-message" *ngIf="data.isConflict">
              <strong>{{ data.conflictMessage }}</strong>
            </p>
            <p class="main-message" *ngIf="!data.isConflict">
              Se ha detectado que ya posees contenido relacionado con la materia: <strong>{{ data.materiaNombre }}</strong>
            </p>
            
            <p class="sub-message" *ngIf="data.isConflict">
              Por políticas de la plataforma, no es posible suscribirse a ambas materias simultáneamente. 
              Debes elegir una de las dos opciones o contactar con soporte si necesitas más información.
            </p>
            <p class="sub-message" *ngIf="!data.isConflict">
              Para evitar duplicaciones y optimizar tu experiencia de aprendizaje, te recomendamos contactar con nuestro equipo de soporte antes de realizar esta compra.
            </p>
            
            <div class="info-box" *ngIf="data.isConflict">
              <p><strong>� Restricción de suscripción:</strong></p>
              <ul>
                <li>Solo puedes suscribirte a <strong>una materia</strong> entre Comunicación y Matemática</li>
                <li>Esta restricción se aplica por <strong>políticas de la plataforma</strong></li>
                <li>Si necesitas ambas materias, contacta con soporte para opciones especiales</li>
              </ul>
            </div>
            
            <div class="info-box" *ngIf="!data.isConflict">
              <p><strong>�💡 Información importante:</strong></p>
              <ul>
                <li>Solo se valida la compra de materias de <strong>Comunicación</strong> y <strong>Matemática</strong></li>
                <li>No puedes seleccionar ambas materias al mismo tiempo</li>
                <li>Si ya posees contenido similar, podrías estar duplicando tu inversión</li>
              </ul>
            </div>
            
            <div class="selected-options" *ngIf="data.selectedOptions && data.selectedOptions.length > 0">
              <h4>Opciones seleccionadas:</h4>
              <ul>
                <li *ngFor="let option of data.selectedOptions">
                  {{ option.nombre }} - S/. {{ option.ahora }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="contact-info">
          <h4>📞 Información de contacto:</h4>
          <div class="contact-item">
            <i class="fas fa-envelope"></i>
            <span>soporte&#64;empresa.com</span>
          </div>
          <div class="contact-item">
            <i class="fas fa-phone"></i>
            <span>+51 999 999 999</span>
          </div>
          <div class="contact-item">
            <i class="fas fa-clock"></i>
            <span>Lunes a Viernes: 9:00 AM - 6:00 PM</span>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-primary" (click)="onContactSupport()">
          <i class="fas fa-comments"></i>
          Contactar Soporte
        </button>
        <button class="btn btn-secondary" (click)="onClose()">
          <i class="fas fa-times"></i>
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reseller-alert-modal {
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
      border-radius: 12px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      color: white;
      border-radius: 12px 12px 0 0;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      flex-shrink: 0;
    }

    .modal-header.conflict-header {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    }

    .modal-title {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 50%;
      transition: background-color 0.3s ease;
    }

    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .modal-body {
      padding: 2rem;
      flex: 1;
      overflow-y: auto;
      max-height: calc(90vh - 180px);
    }

    .alert-content {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .alert-icon {
      flex-shrink: 0;
    }

    .alert-icon i {
      font-size: 2rem;
      color: #ff6b6b;
    }

    .alert-message {
      flex: 1;
    }

    .main-message {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .sub-message {
      color: #7f8c8d;
      line-height: 1.5;
      margin: 0 0 1rem 0;
    }

    .selected-options {
      margin-top: 1rem;
      padding: 1rem;
      background: #fff3cd;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }

    .selected-options h4 {
      margin: 0 0 0.5rem 0;
      color: #856404;
      font-size: 1rem;
    }

    .selected-options ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .selected-options li {
      color: #856404;
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .info-box {
      margin-top: 1rem;
      padding: 1rem;
      background: #e8f4fd;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .info-box p {
      margin: 0 0 0.5rem 0;
      color: #1565c0;
      font-weight: 600;
    }

    .info-box ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .info-box li {
      color: #1976d2;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    .contact-info {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid #3498db;
    }

    .contact-info h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      color: #2c3e50;
    }

    .contact-item:last-child {
      margin-bottom: 0;
    }

    .contact-item i {
      color: #3498db;
      width: 16px;
      text-align: center;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 0 0 12px 12px;
      flex-shrink: 0;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background: #7f8c8d;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
    }

    @media (max-width: 480px) {
      .reseller-alert-modal {
        max-height: 95vh;
      }
      
      .modal-body {
        max-height: calc(95vh - 160px);
        padding: 1rem;
      }
      
      .modal-header, .modal-footer {
        padding: 1rem;
      }

      .modal-footer {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .alert-content {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }
    
    @media (max-height: 600px) {
      .reseller-alert-modal {
        max-height: 95vh;
      }
      
      .modal-body {
        max-height: calc(95vh - 160px);
        padding: 1rem;
      }
      
      .modal-header, .modal-footer {
        padding: 1rem;
      }
    }
    
    @media (max-height: 500px) {
      .reseller-alert-modal {
        max-height: 98vh;
      }
      
      .modal-body {
        max-height: calc(98vh - 140px);
        padding: 0.75rem;
      }
      
      .modal-header, .modal-footer {
        padding: 0.75rem;
      }
      
      .modal-title {
        font-size: 1.1rem;
      }
    }
  `]
})
export class ResellerAlertModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ResellerAlertModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onClose(): void {
    this.dialogRef.close(false);
  }

  onContactSupport(): void {
    // Aquí puedes implementar la lógica para contactar soporte
    // Por ejemplo, abrir un enlace de WhatsApp, email, etc.
    
    // Crear mensaje personalizado según el tipo de alerta
    let message = '';
    if (this.data.isConflict) {
      message = encodeURIComponent('Hola, tengo una consulta sobre la restricción de suscripción a Matemática y Comunicación simultáneamente.');
    } else {
      message = encodeURIComponent(`Hola, necesito ayuda con la compra de ${this.data.materiaNombre} que ya poseo.`);
    }
    
    // Ejemplo: abrir WhatsApp
    const phoneNumber = '+51 978 768 681'; // Reemplaza con el número real
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    
    this.dialogRef.close(true);
  }
}
