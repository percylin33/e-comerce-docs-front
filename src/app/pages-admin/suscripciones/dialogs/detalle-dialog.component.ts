import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DetalleDialogData {
  suscripcion: any;  // datos de la fila procesada por procesarSuscripcionesPaginadas
  details: any;      // SubscriptionDetailsDto del backend (puede ser null si el endpoint falla)
}

@Component({
  selector: 'ngx-detalle-dialog',
  template: `
    <div class="dialog-container">

      <!-- HEADER -->
      <div class="dialog-header" [class.header-activa]="isActiva" [class.header-inactiva]="!isActiva">
        <div class="header-info">
          <mat-icon class="header-icon">account_circle</mat-icon>
          <div>
            <h2 mat-dialog-title>{{ data.suscripcion.usuario }}</h2>
            <span class="subscription-type">{{ data.suscripcion.nombre }}</span>
          </div>
        </div>
        <div class="header-right">
          <span class="estado-badge">
            <mat-icon>{{ isActiva ? 'check_circle' : 'cancel' }}</mat-icon>
            {{ data.suscripcion.status || data.details?.estado }}
          </span>
          <button mat-icon-button class="close-btn" (click)="cerrar()" aria-label="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- CONTENT -->
      <div mat-dialog-content class="detalle-content">

        <!-- No details fallback -->
        <div *ngIf="!data.details" class="no-details-msg">
          <mat-icon>info</mat-icon>
          <p>No se pudo cargar el detalle completo. Mostrando datos básicos.</p>
        </div>

        <!-- FECHAS -->
        <div class="section">
          <h3 class="section-title">
            <mat-icon>calendar_today</mat-icon> Fechas
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Inicio</span>
              <span class="info-value">{{ data.suscripcion.fechaInicio | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fin</span>
              <span class="info-value">{{ data.suscripcion.fechaFin | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="info-item" *ngIf="data.details?.fechaFinUnidad">
              <span class="info-label">Fin de Unidad</span>
              <span class="info-value">{{ data.details.fechaFinUnidad | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>
        </div>

        <!-- UNIDAD ACTUAL -->
        <div class="section" *ngIf="unidades.length > 0">
          <h3 class="section-title">
            <mat-icon>menu_book</mat-icon> {{ unidades.length > 1 ? 'Unidades Actuales' : 'Unidad Actual' }}
          </h3>
          <div class="unidades-grid">
            <div class="unidad-card" *ngFor="let u of unidades">
              <div class="unidad-numero">Unidad {{ u.numero }}</div>
              <div class="unidad-anio" *ngIf="u.anio">{{ u.anio }}</div>
              <div class="unidad-titulo">{{ u.titulo }}</div>
            </div>
          </div>

          <!-- Botón toggle unidades accesibles -->
          <button mat-button class="toggle-unidades-btn"
                  *ngIf="unidadesAccesibles.length > 0"
                  (click)="showUnidades = !showUnidades">
            <mat-icon>{{ showUnidades ? 'expand_less' : 'layers' }}</mat-icon>
            {{ showUnidades ? 'Ocultar unidades' : 'Ver ' + unidadesAccesibles.length + ' unidades con acceso' }}
          </button>

          <!-- Panel expandible de todas las unidades accesibles -->
          <div class="unidades-panel" *ngIf="showUnidades">
            <div class="unidades-acceso-grid">
              <div class="unidad-acceso-card" *ngFor="let u of unidadesAccesibles"
                   [class.unidad-acceso-actual]="isUnidadActual(u)">
                <div class="unidad-acceso-header">
                  <span class="unidad-acceso-numero">Unidad {{ u.numero }}</span>
                  <span class="unidad-acceso-anio">{{ u.anio }}</span>
                  <span class="unidad-actual-badge" *ngIf="isUnidadActual(u)">● Actual</span>
                </div>
                <div class="unidad-acceso-titulo">{{ u.titulo }}</div>
                <div class="unidad-acceso-fechas" *ngIf="u.fechaInicio">
                  {{ u.fechaInicio | date:'dd/MM/yy' }} – {{ u.fechaFin | date:'dd/MM/yy' }}
                </div>
                <div class="unidad-acceso-entitlements" *ngIf="u.entitlements?.length > 0">
                  <span class="entitlement-chip" *ngFor="let ent of u.entitlements">
                    {{ ent.materiaNombre }}<span *ngIf="ent.opcionNombre"> · {{ ent.opcionNombre }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MATERIAS Y OPCIONES -->
        <div class="section" *ngIf="materias.length > 0">
          <h3 class="section-title">
            <mat-icon>school</mat-icon> Materias y Opciones
          </h3>
          <div class="materias-list">
            <div class="materia-item" *ngFor="let m of materias">
              <div class="materia-nombre">{{ m.nombre }}</div>
              <div class="opciones-chips">
                <span class="opcion-chip" *ngFor="let o of m.opciones">{{ o }}</span>
                <span *ngIf="m.opciones.length === 0" class="opcion-chip opcion-empty">Sin opciones</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ESTADÍSTICAS -->
        <div class="section">
          <h3 class="section-title">
            <mat-icon>analytics</mat-icon> Estadísticas
          </h3>
          <div class="stats-grid">
            <div class="stat-card">
              <mat-icon class="stat-icon">payment</mat-icon>
              <span class="stat-value">{{ data.suscripcion.counts?.totalPayments || 0 }}</span>
              <span class="stat-label">Pagos totales</span>
            </div>
            <div class="stat-card stat-warning" *ngIf="data.suscripcion.counts?.pendingPayments > 0">
              <mat-icon class="stat-icon">schedule</mat-icon>
              <span class="stat-value">{{ data.suscripcion.counts.pendingPayments }}</span>
              <span class="stat-label">Pendientes</span>
            </div>
            <div class="stat-card stat-danger" *ngIf="data.suscripcion.counts?.overduePayments > 0">
              <mat-icon class="stat-icon">warning</mat-icon>
              <span class="stat-value">{{ data.suscripcion.counts.overduePayments }}</span>
              <span class="stat-label">Vencidos</span>
            </div>
            <div class="stat-card stat-info">
              <mat-icon class="stat-icon">description</mat-icon>
              <span class="stat-value">{{ data.suscripcion.counts?.totalDocuments || 0 }}</span>
              <span class="stat-label">Documentos</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ACTIONS -->
      <div mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button color="accent" (click)="verPagos()">
          <mat-icon>payment</mat-icon>
          Ver Pagos
        </button>
        <button mat-stroked-button color="warn" (click)="verDocumentos()">
          <mat-icon>description</mat-icon>
          Ver Documentos
        </button>
        <span class="spacer"></span>
        <button mat-raised-button color="primary" (click)="cerrar()">
          Cerrar
        </button>
      </div>

    </div>
  `,
  styleUrls: ['./detalle-dialog.component.scss']
})
export class DetalleDialogComponent {

  materias: { nombre: string; opciones: string[] }[] = [];
  unidades: { numero: number; titulo: string; anio?: number }[] = [];
  unidadesAccesibles: { id: number; anio: number; numero: number; titulo: string; fechaInicio: string; fechaFin: string; entitlements: { materiaId: number; materiaNombre: string; opcionId: number; opcionNombre: string }[] }[] = [];
  showUnidades = false;

  constructor(
    public dialogRef: MatDialogRef<DetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetalleDialogData
  ) {
    this.parseMaterias();
    this.parseUnidades();
    this.parseUnidadesAccesibles();
  }

  get isActiva(): boolean {
    const status = this.data.suscripcion?.status || this.data.details?.estado || '';
    return status.toUpperCase() === 'ACTIVA';
  }

  private parseUnidades(): void {
    if (!this.data.details?.unidadActual) return;

    const titulo = this.data.details?.unidadActualTitulo || '';

    // Detect JSON dual-unit case (subscriptionTypeId = 1)
    // Expected shape: { "unidad1": { "id": 1, "anio": 2025, "titulo": "..." }, "unidad2": { ... } }
    if (titulo.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(titulo);
        const keys = Object.keys(parsed).sort();
        keys.forEach(key => {
          const item = parsed[key];
          const numMatch = key.match(/\d+/);
          const numero = numMatch ? parseInt(numMatch[0], 10) : this.data.details.unidadActual;
          this.unidades.push({
            numero,
            titulo: item?.titulo || String(item),
            anio: item?.anio ?? undefined
          });
        });
        return;
      } catch {
        // fall through to single-unit
      }
    }

    // Plain string — single unit
    this.unidades.push({
      numero: this.data.details.unidadActual,
      titulo,
      anio: this.data.details.unidadActualAnio || undefined
    });
  }

  private parseUnidadesAccesibles(): void {
    const json = this.data.details?.unidadesAccesibles || '';
    if (!json || json === '[]' || json.trim() === '') return;
    try {
      this.unidadesAccesibles = JSON.parse(json) || [];
    } catch {
      this.unidadesAccesibles = [];
    }
  }

  isUnidadActual(u: any): boolean {
    const sameNumero = u.numero === this.data.details?.unidadActual;
    const anioActual = this.data.details?.unidadActualAnio;
    const sameAnio = !u.anio || !anioActual || u.anio === anioActual;
    return sameNumero && sameAnio;
  }

  private parseMaterias(): void {
    const json = this.data.details?.materiasOpcionesJson
      || this.data.suscripcion?.materiasOpcionesJson
      || '';

    if (!json || json === 'null' || json === 'undefined' || json.trim() === '') return;

    try {
      const parsed = JSON.parse(json);
      if (typeof parsed === 'object' && parsed !== null) {
        this.materias = Object.entries(parsed).map(([nombre, opciones]) => ({
          nombre,
          opciones: Array.isArray(opciones) ? opciones as string[] : []
        }));
      }
    } catch {
      this.materias = [];
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  verPagos(): void {
    this.dialogRef.close({ action: 'pagos', id: this.data.suscripcion.id });
  }

  verDocumentos(): void {
    this.dialogRef.close({ action: 'documentos', suscripcion: this.data.suscripcion });
  }
}
