import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubscriptionType } from '../../../@core/data/subscription-types';

export interface MateriasManagerDialogData {
  membresia: SubscriptionType;
}

@Component({
  selector: 'ngx-materias-manager-dialog',
  templateUrl: './materias-manager-dialog.component.html',
  styleUrls: ['./materias-manager-dialog.component.scss']
})
export class MateriasManagerDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MateriasManagerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MateriasManagerDialogData
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
