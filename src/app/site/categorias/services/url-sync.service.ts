import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable } from 'rxjs';

/**
 * Servicio para sincronizar el estado de filtros con los query parameters de la URL.
 * Esto permite que los usuarios compartan URLs con filtros aplicados.
 */
@Injectable({
  providedIn: 'root'
})
export class UrlSyncService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);


  /**
   * Actualiza los query parameters en la URL sin recargar la página.
   * Los parámetros con valor null o vacío son removidos de la URL.
   * 
   * @param params - Objeto con los parámetros a actualizar. Usar null para remover un parámetro.
   * @param replaceUrl - Si es true, reemplaza la URL actual sin agregar al historial (default: false)
   */
  updateQueryParams(params: Record<string, string | null>, replaceUrl: boolean = false): void {
    // Filtrar parámetros vacíos o null
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value != null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    // NO usar 'merge' - reemplazar completamente los params
    // Esto asegura que los parámetros null/vacíos se eliminen de la URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleanParams,
      replaceUrl: replaceUrl
    });
  }

  /**
   * Obtiene los query parameters actuales como Observable.
   * Útil para reaccionar a cambios en la URL.
   * 
   * @returns Observable que emite los parámetros actuales
   */
  getCurrentParams(): Observable<Params> {
    return this.route.queryParams;
  }

  /**
   * Limpia todos los query parameters de la URL.
   * Útil al resetear filtros.
   */
  clearQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  /**
   * Genera una URL completa compartible con los query parameters actuales.
   * Esta URL puede ser copiada y compartida con otros usuarios.
   * 
   * @returns URL completa como string
   */
  getShareableUrl(): string {
    const tree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: this.route.snapshot.queryParams,
      queryParamsHandling: 'merge'
    });
    
    const urlPath = this.router.serializeUrl(tree);
    return window.location.origin + urlPath;
  }

  /**
   * Obtiene un parámetro específico de la URL.
   * 
   * @param key - Nombre del parámetro
   * @returns Valor del parámetro o null si no existe
   */
  getParam(key: string): string | null {
    return this.route.snapshot.queryParams[key] || null;
  }

  /**
   * Verifica si existe un parámetro específico en la URL.
   * 
   * @param key - Nombre del parámetro
   * @returns true si el parámetro existe
   */
  hasParam(key: string): boolean {
    return key in this.route.snapshot.queryParams;
  }
}
