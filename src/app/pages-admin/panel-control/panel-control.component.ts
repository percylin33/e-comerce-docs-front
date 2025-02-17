import { Component, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { GraphicsData } from '../../@core/interfaces/graphics';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'ngx-panel-control',
  templateUrl: './panel-control.component.html',
  styleUrls: ['./panel-control.component.scss'],
})
export class PanelControlComponent implements OnInit {
  private destroy$ = new Subject<void>();

  allUsers: number = 0;
  allPayments: number = 0;
  allSales: number = 0;

  constructor(
    private graphicsService: GraphicsData,
    private toastrService: NbToastrService
  ) {}

  ngOnInit(): void {
    this.graphicsService.getGraphics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.allUsers = res.data.allUsers;
          this.allPayments = res.data.allPayments;
          
        },
        error: () => {
          this.toastrService.danger('No se pudo cargar la información', 'Error');
        },
      });
      this.graphicsService.getGraphicsSoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.allSales = res.data.allSales;
        },
        error: () => {
          this.toastrService.danger('No se pudo cargar la información', 'Error');
        },
      });
  }
}
