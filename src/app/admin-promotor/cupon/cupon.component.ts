import { Component, OnInit } from '@angular/core';
import { CuponService } from '../../@core/backend/services/cupon.service';
import { CuponCreate } from '../../@core/interfaces/cupon';

@Component({
  selector: 'ngx-cupon',
  templateUrl: './cupon.component.html',
  styleUrls: ['./cupon.component.scss']
})
export class CuponComponent implements OnInit {
  cupon: { code: string ,discountValue: Number, abonoValue: Number } | null = null;
  loading: boolean = false;
  error: string | null = null;
  id: number = 0;
  codigo: string = '';
  descuento: number = 0;
  abono: number = 0;

  constructor(
    private cuponService: CuponService
  ) {}
  ngOnInit(): void {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      this.id = userData.id;
      console.log(this.id);
      
    }
    this.cuponService.getCupont(this.id).subscribe(
      (response) => {
        
        this.codigo = response.data.codigo;
        this.descuento = response.data.descuento;
        this.abono = response.data.abono;
      },
      (error) => {
        this.error = error.message;
      }
    );
  }

  generateCupon() {
    this.loading = true;
    this.error = null;

  

    this.cuponService.postGenerar(this.id).subscribe(
      (response) => {
        this.cupon = {
          code: response.data.code,
          discountValue: response.data.discountValue,
          abonoValue: response.data.abonoValue
        };
        this.codigo = response.data.code;
        this.loading = false;
      },
      (error) => {
        this.error = error.message;
        this.loading = false;
      }
    );
  }
}
