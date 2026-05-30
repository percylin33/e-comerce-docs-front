import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubscriptionType } from '../../../@core/data/subscription-types';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MateriasManagerComponent } from '../materias-manager/materias-manager.component';

export interface MateriasManagerDialogData {
  membresia: SubscriptionType;
}

@Component({
    selector: 'ngx-materias-manager-dialog',
    templateUrl: './materias-manager-dialog.component.html',
    styleUrls: ['./materias-manager-dialog.component.scss'],
    standalone: true,
    imports: [MatToolbar, MatIconButton, MatIcon, MateriasManagerComponent]
})
export class MateriasManagerDialogComponent {
  dialogRef = inject<MatDialogRef<MateriasManagerDialogComponent>>(MatDialogRef);
  data = inject<MateriasManagerDialogData>(MAT_DIALOG_DATA);


  onClose() {
    this.dialogRef.close();
  }
}
