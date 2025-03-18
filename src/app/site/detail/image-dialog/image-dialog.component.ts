import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'ngx-image-dialog',
  templateUrl: './image-dialog.component.html',
  styleUrls: ['./image-dialog.component.scss']
})
export class ImageDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string },
    private dialogRef: MatDialogRef<ImageDialogComponent>
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}