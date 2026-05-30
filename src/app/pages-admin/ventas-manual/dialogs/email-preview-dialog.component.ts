import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { ManualPaymentMethod } from '../../../@core/interfaces/payments';

export interface EmailPreviewItem {
  id: number;
  title: string;
  price: number;
  isKit?: boolean;
}

export interface EmailPreviewData {
  clientName: string;
  clientEmail: string;
  isGuest: boolean;
  items: EmailPreviewItem[];
  subtotal: number;
  couponCode: string;
  couponPct: number;
  couponDiscount: number;
  total: number;
  paymentMethodLabel: string;
  paymentMethod: ManualPaymentMethod | string;
  paymentReference: string;
}

/**
 * Dialog que previsualiza el email que recibira el cliente al registrarse
 * la venta manual. Es read-only: refleja datos del wizard al momento de
 * abrirlo. Estilos en SCSS aparte (styleUrls) para soportar anidamiento.
 */
@Component({
  selector: 'ngx-email-preview-dialog',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, DatePipe,
    MatDialogTitle, MatDialogContent, MatDialogActions,
    MatButton, MatIcon, MatTooltip,
  ],
  styleUrls: ['./email-preview-dialog.component.scss'],
  template: `
    <header class="epd__title-bar">
      <h2 mat-dialog-title class="epd__title">
        <mat-icon>mark_email_read</mat-icon>
        <span>Vista previa del email al cliente</span>
      </h2>
      <span class="epd__title-badge">PREVIEW</span>
    </header>

    <div mat-dialog-content class="epd__content">

      <!-- Bandeja: cabecera tipo cliente de correo -->
      <section class="epd__inbox" aria-label="Cabecera del email">
        <div class="epd__inbox-row">
          <span class="epd__inbox-label">De</span>
          <span class="epd__inbox-value">
            <strong>Carpeta Digital</strong>
            &lt;ventas&#64;carpetadigital.net&gt;
          </span>
        </div>
        <div class="epd__inbox-row">
          <span class="epd__inbox-label">Para</span>
          <span class="epd__inbox-value epd__inbox-value--to">
            <strong>{{ data.clientName }}</strong>
            &lt;{{ data.clientEmail || 'sin-email' }}&gt;
          </span>
        </div>
        <div class="epd__inbox-row">
          <span class="epd__inbox-label">Asunto</span>
          <span class="epd__inbox-value epd__inbox-value--subject">
            Confirmacion de tu compra en Carpeta Digital
          </span>
        </div>
        <div class="epd__inbox-row epd__inbox-row--meta">
          <span class="epd__inbox-label">Recibido</span>
          <span class="epd__inbox-value epd__inbox-value--meta">
            {{ now | date:'EEEE, d MMM y, HH:mm':'-0500' }}
            <span class="epd__inbox-dot">&middot;</span>
            <span class="epd__inbox-tag">
              <mat-icon>shield</mat-icon>
              SPF / DKIM OK
            </span>
          </span>
        </div>
      </section>

      <!-- Cuerpo: render del email -->
      <article class="epd__mail" aria-label="Cuerpo simulado del email">
        <header class="epd__mail-header">
          <div class="epd__mail-brand-row">
            <span class="epd__mail-logo">CD</span>
            <span class="epd__mail-brand">Carpeta Digital</span>
          </div>
          <h3 class="epd__mail-subject">Tu compra esta confirmada</h3>
          <p class="epd__mail-tagline">
            Te enviamos el detalle y proximamente recibiras los enlaces de descarga.
          </p>
        </header>

        <section class="epd__mail-body">
          <p class="epd__greeting">
            Hola <strong>{{ data.clientName }}</strong>,
          </p>
          <p class="epd__lead">
            Hemos recibido tu pago. Este es el detalle de tu compra:
          </p>

          <!-- Lista de productos -->
          <ul class="epd__items" role="list">
            @for (it of data.items; track it.id) {
              <li class="epd__item">
                <span class="epd__item-icon" aria-hidden="true">
                  @if (it.isKit) {
                    <mat-icon>inventory_2</mat-icon>
                  } @else {
                    <mat-icon>description</mat-icon>
                  }
                </span>
                <div class="epd__item-body">
                  <span class="epd__item-title">
                    @if (it.isKit) {
                      <span class="epd__kit-badge">KIT</span>
                    }
                    {{ it.title }}
                  </span>
                  @if (it.isKit) {
                    <span class="epd__item-meta">Se expande automaticamente al descargar.</span>
                  }
                </div>
                <span class="epd__item-price">
                  S/ {{ it.price | number:'1.2-2' }}
                </span>
              </li>
            }
            @if (data.items.length === 0) {
              <li class="epd__items-empty">Sin productos</li>
            }
          </ul>

          <!-- Totales -->
          <dl class="epd__totals" aria-label="Totales de la compra">
            <div class="epd__totals-row">
              <dt>Subtotal</dt>
              <dd>S/ {{ data.subtotal | number:'1.2-2' }}</dd>
            </div>
            @if (data.couponDiscount > 0) {
              <div class="epd__totals-row epd__totals-row--discount">
                <dt>
                  <mat-icon>local_offer</mat-icon>
                  Cupon <code>{{ data.couponCode }}</code> ({{ data.couponPct }}%)
                </dt>
                <dd>- S/ {{ data.couponDiscount | number:'1.2-2' }}</dd>
              </div>
            }
            <div class="epd__totals-row epd__totals-row--grand">
              <dt>Total pagado</dt>
              <dd>S/ {{ data.total | number:'1.2-2' }}</dd>
            </div>
          </dl>

          <!-- Metodo de pago -->
          <div class="epd__payment">
            <span class="epd__payment-icon" aria-hidden="true">
              <mat-icon>{{ paymentIcon }}</mat-icon>
            </span>
            <div class="epd__payment-body">
              <span class="epd__payment-label">Metodo de pago</span>
              <strong class="epd__payment-value">{{ data.paymentMethodLabel }}</strong>
              @if (data.paymentReference) {
                <span class="epd__payment-ref">
                  Referencia: <code>{{ data.paymentReference }}</code>
                </span>
              }
            </div>
          </div>

          <!-- CTA simulado -->
          <a class="epd__cta" href="#" (click)="$event.preventDefault()" tabindex="-1" aria-disabled="true">
            <mat-icon>cloud_download</mat-icon>
            <span>Ir a Mis descargas</span>
          </a>

          <!-- Nota explicativa segun tipo de cliente -->
          <div class="epd__note" role="note">
            <mat-icon>info</mat-icon>
            <div>
              @if (data.isGuest) {
                Recibiras los enlaces de descarga en un correo aparte enviado a
                <strong>{{ data.clientEmail }}</strong>.
              } @else {
                Tus descargas estan disponibles en el area
                <strong>"Mis descargas"</strong> de tu cuenta.
              }
            </div>
          </div>

          <p class="epd__signature">
            Gracias por confiar en nosotros.<br/>
            <strong>Equipo Carpeta Digital</strong>
          </p>
        </section>

        <footer class="epd__mail-footer">
          <span>Carpeta Digital &middot; Av. Ejemplo 123, Lima - Peru</span>
          <a href="#" tabindex="-1" (click)="$event.preventDefault()">Centro de ayuda</a>
        </footer>
      </article>

      <!-- Nota interna fuera del email -->
      <p class="epd__internal-note">
        <mat-icon>visibility</mat-icon>
        Esta vista es una previsualizacion. La plantilla final del mailer
        puede tener variaciones de estilo, pero el contenido coincide.
      </p>
    </div>

    <div mat-dialog-actions align="end" class="epd__actions">
      <button mat-stroked-button type="button" (click)="copySummary()" matTooltip="Copiar resumen al portapapeles">
        <mat-icon>content_copy</mat-icon>
        Copiar resumen
      </button>
      <button mat-flat-button color="primary" type="button" (click)="close()">
        <mat-icon>check</mat-icon>
        Cerrar
      </button>
    </div>
  `,
})
export class EmailPreviewDialogComponent {
  private ref = inject<MatDialogRef<EmailPreviewDialogComponent>>(MatDialogRef);
  data = inject<EmailPreviewData>(MAT_DIALOG_DATA);
  readonly now = new Date();

  /** Icono Material que representa al metodo de pago. */
  get paymentIcon(): string {
    switch (this.data.paymentMethod) {
      case 'MANUAL_CASH':     return 'payments';
      case 'MANUAL_YAPE':
      case 'MANUAL_PLIN':     return 'qr_code_2';
      case 'MANUAL_TRANSFER': return 'account_balance';
      case 'MANUAL_DEPOSIT':  return 'local_atm';
      default:                return 'credit_card';
    }
  }

  close(): void { this.ref.close(); }

  /** Copia un resumen plano al portapapeles. */
  copySummary(): void {
    const lines: string[] = [
      `Para: ${this.data.clientName} <${this.data.clientEmail}>`,
      `Asunto: Confirmacion de tu compra en Carpeta Digital`,
      '',
      'Productos:',
      ...this.data.items.map(i => `  - ${i.isKit ? '[KIT] ' : ''}${i.title}  S/ ${i.price.toFixed(2)}`),
      '',
      `Subtotal: S/ ${this.data.subtotal.toFixed(2)}`,
    ];
    if (this.data.couponDiscount > 0) {
      lines.push(`Cupon ${this.data.couponCode} (${this.data.couponPct}%): -S/ ${this.data.couponDiscount.toFixed(2)}`);
    }
    lines.push(`Total: S/ ${this.data.total.toFixed(2)}`);
    lines.push(`Metodo: ${this.data.paymentMethodLabel}${this.data.paymentReference ? ` (ref ${this.data.paymentReference})` : ''}`);

    const text = lines.join('\n');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }
}
