import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface ChangesSummary {
  hasChanges: boolean;
  unidadChange?: {
    old: number;
    new: number;
    oldTitle?: string;
    newTitle?: string;
  };
  dateChanges?: {
    fechaInicio?: {
      old: string;
      new: string;
    };
    fechaFinUnidad?: {
      old: string;
      new: string;
    };
  };
  materiasChanges?: {
    added: string[];
    removed: string[];
    unchanged: string[];
  };
  userName: string;
  subscriptionType: string;
}

@Component({
  selector: 'ngx-confirm-changes-dialog',
  templateUrl: './confirm-changes-dialog.component.html',
  styleUrls: ['./confirm-changes-dialog.component.scss']
})
export class ConfirmChangesDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ConfirmChangesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChangesSummary
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

  hasUnidadChange(): boolean {
    return !!this.data.unidadChange;
  }

  hasDateChanges(): boolean {
    return !!this.data.dateChanges && 
           (!!this.data.dateChanges.fechaInicio || !!this.data.dateChanges.fechaFinUnidad);
  }

  hasMateriasChanges(): boolean {
    return !!this.data.materiasChanges && 
           (this.data.materiasChanges.added.length > 0 || 
            this.data.materiasChanges.removed.length > 0);
  }

  getTotalChangesCount(): number {
    let count = 0;
    if (this.hasUnidadChange()) count++;
    if (this.data.dateChanges?.fechaInicio) count++;
    if (this.data.dateChanges?.fechaFinUnidad) count++;
    if (this.hasMateriasChanges()) count++;
    return count;
  }
}
