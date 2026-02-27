import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface CancelDialogData {
  userName: string;
  subscriptionType: string;
  unidadActual: number;
  fechaInicio: string;
  fechaFinUnidad: string;
}

@Component({
  selector: 'ngx-confirm-cancel-dialog',
  templateUrl: './confirm-cancel-dialog.component.html',
  styleUrls: ['./confirm-cancel-dialog.component.scss']
})
export class ConfirmCancelDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmCancelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CancelDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
