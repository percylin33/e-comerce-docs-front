/**
 * COMPONENTE NEUTRALIZADO (S-19 del plan de endurecimiento).
 *
 * El componente original cargaba el SDK de PayPal con `client-id=TU_CLIENT_ID`
 * (placeholder hardcodeado) e implementaba `createOrder` con
 * `actions.order.create({ amount })` totalmente desde el navegador,
 * dejando el monto manipulable por el cliente. Tampoco se usaba en
 * ninguna ruta real (el flujo correcto está en `checkout.component.ts`
 * con `NgxPayPalModule` + endpoint server `paypal/create-order`).
 *
 * Se reemplaza por un stub vacío que mantiene el símbolo para no romper
 * la importación en `site.module.ts`. El template está vacío y no
 * carga ningún script externo. Eliminar el import + esta clase en un
 * PR de limpieza posterior.
 */
import { Component } from '@angular/core';

@Component({
    selector: 'ngx-paypal-button',
    template: '',
    standalone: true
})
export class PaypalButtonComponent {}
