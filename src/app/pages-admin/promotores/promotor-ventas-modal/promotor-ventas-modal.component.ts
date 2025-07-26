import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'ngx-promotor-ventas-modal',
  templateUrl: './promotor-ventas-modal.component.html',
  styleUrls: ['./promotor-ventas-modal.component.scss']
})
export class PromotorVentasModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
