// Componente Angular para botón de PayPal
import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';

@Component({
  selector: 'ngx-paypal-button',
  template: `<div id="paypal-button-container"></div>`
})
export class PaypalButtonComponent implements AfterViewInit {
  @Input() amount: number = 0;
  @Output() paymentSuccess = new EventEmitter<any>();
  @Output() paymentError = new EventEmitter<any>();

  ngAfterViewInit() {
    // Cargar el script de PayPal
    if (!(window as any).paypal) {
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID&currency=USD';
      script.onload = () => this.renderButton();
      document.body.appendChild(script);
    } else {
      this.renderButton();
    }
  }

  renderButton() {
    (window as any).paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{ amount: { value: this.amount.toString() } }]
        });
      },
      onApprove: (data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          this.paymentSuccess.emit(details);
        });
      },
      onError: (err: any) => {
        this.paymentError.emit(err);
      }
    }).render('#paypal-button-container');
  }
}
