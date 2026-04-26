import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NbIconModule } from '@nebular/theme';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { CurrencyPipe } from '@angular/common';


@Component({
    selector: 'ngx-promotor-ventas-modal',
    templateUrl: './promotor-ventas-modal.component.html',
    styleUrls: ['./promotor-ventas-modal.component.scss'],
    standalone: true,
    imports: [NbIconModule, MatIconButton, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatButton, CurrencyPipe]
})
export class PromotorVentasModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<PromotorVentasModalComponent>
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
