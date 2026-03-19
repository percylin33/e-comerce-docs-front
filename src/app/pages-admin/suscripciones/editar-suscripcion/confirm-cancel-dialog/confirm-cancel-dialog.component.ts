import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ConfirmCancelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CancelDialogData
  ) {
    this.form = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({ confirmed: true, reason: this.form.value.reason.trim() });
  }
}
