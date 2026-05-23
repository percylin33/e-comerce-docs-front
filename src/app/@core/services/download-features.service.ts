import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Feature flags del refactor de descargas (Fase 0).
 *
 * <p>Se inicializan desde {@link environment} y, opcionalmente, pueden ser
 * sobreescritas en runtime via {@link sessionStorage} para QA manual:</p>
 *
 * <pre>
 *   sessionStorage.setItem('downloadsV2.enabled', 'true');
 *   sessionStorage.setItem('downloadsV2.frontendPercent', '50');
 * </pre>
 *
 * <p>La decision por usuario es determinista: hash modular sobre el userId
 * para que un mismo usuario siempre caiga del mismo lado del rollout, evitando
 * el flapping entre flujos legacy y v2.</p>
 *
 * <p>Fase 3a expondra el nuevo {@code DownloadSessionController}. Fase 3b
 * empuja {@code frontendPercent} a 10, 50, 100. Fase 3c elimina el codigo
 * legacy y este servicio devuelve siempre {@code true}.</p>
 */
@Injectable({ providedIn: 'root' })
export class DownloadFeaturesService {
  /** Lee el flag global. Si esta apagado, ningun usuario usa v2. */
  isV2Enabled(): boolean {
    const override = this.sessionOverride('downloadsV2.enabled');
    if (override !== null) return override === 'true';
    return !!environment?.downloadsV2?.enabled;
  }

  /** Porcentaje de trafico (0-100). Clampea a rango valido. */
  getV2FrontendPercent(): number {
    const override = this.sessionOverride('downloadsV2.frontendPercent');
    const raw = override !== null ? Number(override) : Number(environment?.downloadsV2?.frontendPercent ?? 0);
    if (Number.isNaN(raw)) return 0;
    return Math.max(0, Math.min(100, Math.floor(raw)));
  }

  /**
   * Decide si un usuario concreto debe usar el flujo v2. La decision se
   * basa en {@code (userId % 100) < frontendPercent} para que sea estable
   * por usuario y no haga flapping entre llamadas.
   *
   * @param userId Si es undefined, devuelve {@code false} (usuario anonimo
   *               siempre por el flujo legacy).
   */
  shouldUseV2(userId?: number | string | null): boolean {
    if (!this.isV2Enabled()) return false;
    if (userId === undefined || userId === null || userId === '') return false;
    const pct = this.getV2FrontendPercent();
    if (pct >= 100) return true;
    if (pct <= 0) return false;
    const hash = this.userBucket(userId);
    return hash < pct;
  }

  private userBucket(userId: number | string): number {
    const asNumber = typeof userId === 'number' ? userId : this.hashString(String(userId));
    return Math.abs(asNumber) % 100;
  }

  private hashString(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 31 + s.charCodeAt(i)) | 0;
    }
    return hash;
  }

  private sessionOverride(key: string): string | null {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
}
