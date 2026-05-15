import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatHint, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';

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
    styleUrls: ['./confirm-cancel-dialog.component.scss'],
    standalone: true,
    imports: [MatIcon, MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatHint, MatError, MatDialogActions, MatButton, DatePipe]
})
export class ConfirmCancelDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject<MatDialogRef<ConfirmCancelDialogComponent>>(MatDialogRef);
  data = inject<CancelDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;

  constructor() {
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
