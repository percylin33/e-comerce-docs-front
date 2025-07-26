import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

@Component({
  selector: 'ngx-confirm-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
        <div class="warning-note">
          <mat-icon>info</mat-icon>
          <span>Esta acción no se puede deshacer</span>
        </div>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          {{ data.cancelText }}
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()" cdkFocusInitial class="confirm-btn">
          <mat-icon>check</mat-icon>
          {{ data.confirmText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 400px;
      max-width: 480px;
      padding: 1.5rem;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #f5f5f5;
      margin-bottom: 1.5rem;
      
      .warning-icon {
        color: #ff6b35;
        font-size: 36px;
        width: 36px;
        height: 36px;
        animation: pulse 2s infinite;
      }
      
      h2 {
        margin: 0;
        color: #333;
        font-weight: 600;
        font-size: 1.4rem;
      }
    }
    
    .dialog-content {
      padding: 0;
      margin-bottom: 1.5rem;
      
      p {
        margin: 0 0 1.5rem 0;
        font-size: 1.1rem;
        color: #555;
        line-height: 1.6;
        text-align: center;
      }
    }
    
    .warning-note {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, #fff8e1, #ffecb3);
      border: 1px solid #ffb74d;
      border-radius: 8px;
      color: #e65100;
      font-size: 0.95rem;
      font-weight: 500;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #ff9800;
      }
    }
    
    .dialog-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      padding-top: 1.5rem;
      border-top: 2px solid #f5f5f5;
      
      button {
        min-width: 160px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        border-radius: 8px;
        transition: all 0.3s ease;
        
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
      
      .cancel-btn {
        color: #666;
        border: 2px solid #e0e0e0;
        background-color: white;
        
        &:hover {
          background-color: #f8f9fa;
          border-color: #bbb;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
      }
      
      .confirm-btn {
        background-color: #f44336;
        border: 2px solid #f44336;
        
        &:hover {
          background-color: #d32f2f;
          border-color: #d32f2f;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
        }
      }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    @media (max-width: 600px) {
      .dialog-container {
        min-width: 300px;
        padding: 1.25rem;
      }
      
      .dialog-header {
        .warning-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
        
        h2 {
          font-size: 1.2rem;
        }
      }
      
      .dialog-content p {
        font-size: 1rem;
      }
      
      .dialog-actions {
        flex-direction: column;
        gap: 0.75rem;
        
        button {
          width: 100%;
          min-width: auto;
        }
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
