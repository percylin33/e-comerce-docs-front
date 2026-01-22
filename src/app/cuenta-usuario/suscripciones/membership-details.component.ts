import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngx-membership-details',
  template: `
    <div class="details-list-v2">
      <h5>Detalles de la Suscripción</h5>
      <div *ngIf="details">
        <div class="detail-row"><span class="label">Membresía:</span> <strong>{{ details.membresiaNombre }}</strong></div>
        <div class="detail-row"><span class="label">Periodo:</span> <strong>{{ details.fechaInicio }} - {{ details.fechaFin }}</strong></div>
        <div *ngIf="details.materiasOpcionesJson">
          <h6 class="materias-title">Materias / Grados Adquiridos:</h6>
          <pre>{{ parseMaterias(details.materiasOpcionesJson) | json }}</pre>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .details-list-v2 { 
      padding: 0;
      color: #1a1a1a;
    }
    h5 { margin-bottom: 1.5rem; font-size: 1.2rem; font-weight: 800; }
    .detail-row { margin-bottom: 1rem; font-size: 1rem; display: flex; gap: 0.5rem; }
    .label { color: #718096; font-weight: 500; }
    .materias-title { margin: 1.5rem 0 0.8rem 0; font-size: 0.95rem; font-weight: 700; color: #4a5568; }
    pre { 
      background: #f8fafc; 
      padding: 1.5rem; 
      border-radius: 14px; 
      font-size: 0.9rem;
      border: 1px solid #edf2f7;
      color: #2d3748;
      overflow-x: auto;
    }
    `
  ]
})
export class MembershipDetailsComponent {
  @Input() details: any = null;

  parseMaterias(jsonStr: string) {
    try { return JSON.parse(jsonStr); } catch { return {}; }
  }
}
