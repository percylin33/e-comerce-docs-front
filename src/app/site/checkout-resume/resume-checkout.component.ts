import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { environment } from '../../../environments/environment';
import { CartService } from '../../@core/backend/services/cart.service';
import { DocumentsService } from '../../@core/backend/services/documents.service';
import { CartItem } from '../../@core/interfaces/cartItem';

/**
 * Pagina publica para reanudar un checkout abandonado. Se accede desde el
 * email de recordatorio: GET /checkout/resume?orderId=XYZ
 *
 * Pasos:
 *   1) Consulta el endpoint publico GET /api/v1/payment/intent/{orderId}/public
 *      que devuelve {documentIds, amount, currency, email enmascarado, ...}.
 *   2) Hidrata cada documentId con GET /api/v1/document/{id} para construir
 *      objetos CartItem completos.
 *   3) Reemplaza el carrito actual (CartService) con esos items.
 *   4) Redirige al checkout normal /site/checkout para que el cliente complete
 *      el pago.
 *
 * Si algo falla (intent inexistente, todos los items invalidos, etc.) muestra
 * un mensaje de error con CTA para volver al home o pedir ayuda.
 */
@Component({
  selector: 'ngx-resume-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="resume-container">
      <div class="resume-card">
        @if (loading) {
          <mat-spinner diameter="56"></mat-spinner>
          <h2>Recuperando tu carrito...</h2>
          <p>Estamos preparando tu compra para que puedas completarla.</p>
        }
        @if (!loading && errorMsg) {
          <mat-icon color="warn" class="big-icon">error_outline</mat-icon>
          <h2>No pudimos recuperar tu carrito</h2>
          <p class="error-msg">{{ errorMsg }}</p>
          <div class="actions">
            <a mat-flat-button color="primary" routerLink="/site/home">
              Ir al inicio
            </a>
            <a mat-stroked-button href="mailto:ventas&#64;carpetadigital.net?subject=Necesito ayuda con mi compra">
              Contactar soporte
            </a>
          </div>
        }
        @if (!loading && !errorMsg && successPrepared) {
          <mat-icon color="primary" class="big-icon">check_circle</mat-icon>
          <h2>Carrito listo</h2>
          <p>Redirigiendo al checkout en un momento...</p>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .resume-container {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      background: linear-gradient(180deg, #f4f6f9 0%, #fff 70%);
    }
    .resume-card {
      max-width: 520px;
      width: 100%;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 14px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      padding: 36px 28px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    h2 { margin: 6px 0 0; font-size: 20px; color: #1f2937; }
    p { margin: 4px 0; color: rgba(0, 0, 0, 0.65); font-size: 14px; }
    .big-icon { font-size: 56px; width: 56px; height: 56px; }
    .error-msg { color: #b71c1c; font-weight: 500; }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 16px;
    }
  `],
})
export class ResumeCheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private documentsService = inject(DocumentsService);
  private cartService = inject(CartService);

  loading = true;
  errorMsg = '';
  successPrepared = false;

  ngOnInit(): void {
    const orderId = this.route.snapshot.queryParamMap.get('orderId');
    if (!orderId) {
      this.loading = false;
      this.errorMsg = 'Falta el codigo de pedido en el enlace.';
      return;
    }
    this.loadIntentAndHydrate(orderId);
  }

  private loadIntentAndHydrate(orderId: string): void {
    const publicUrl = `${environment.apiUrl}/api/v1/payment/intent/${encodeURIComponent(orderId)}/public`;
    this.http.get<any>(publicUrl).pipe(
      catchError(err => {
        const status = err?.status;
        if (status === 404) {
          this.errorMsg = 'No encontramos este carrito. Es posible que el enlace haya expirado.';
        } else if (status === 429) {
          this.errorMsg = 'Demasiados intentos. Intenta nuevamente en un minuto.';
        } else if (status === 400) {
          this.errorMsg = 'El enlace no es valido.';
        } else {
          this.errorMsg = 'No pudimos cargar tu carrito en este momento.';
        }
        return of(null);
      }),
      switchMap(env => {
        if (!env) return of(null);
        const data = env.data || env;
        const ids: number[] = Array.isArray(data.documentIds) ? data.documentIds : [];
        if (ids.length === 0) {
          this.errorMsg = 'Este carrito no contiene productos validos.';
          return of(null);
        }
        // Hidratar cada document por id (paralelo). Si alguno falla, lo descartamos.
        const calls = ids.map(id =>
          this.documentsService.getDocument(String(id)).pipe(catchError(() => of(null as any))),
        );
        return forkJoin(calls);
      }),
    ).subscribe(results => {
      this.loading = false;
      if (this.errorMsg) return;
      if (!results) return;
      const docs = (results as any[]).filter(r => r && r.data).map(r => r.data);
      if (docs.length === 0) {
        this.errorMsg = 'Los productos de este carrito ya no estan disponibles.';
        return;
      }
      const items: CartItem[] = docs.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description || '',
        price: Number(d.price || 0),
        imagenUrlPublic: d.imagenUrlPublic,
        imagenThumbUrlPublic: d.imagenThumbUrlPublic,
        isSubscription: false,
        documentoLibre: !!d.documentoLibre,
        situacion: d.situacion,
        nivel: d.nivel,
        materia: d.materia,
        category: d.category,
      }));
      this.cartService.updateCartItems(items);
      this.successPrepared = true;
      // Pequeno delay para que el usuario vea la confirmacion antes de redirigir
      setTimeout(() => this.router.navigate(['/site/checkout']), 800);
    });
  }
}
