import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  observable?: Observable<T>;
}

@Injectable({
  providedIn: 'root'
})
export class CachedDataService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene datos del caché o ejecuta el fetcher si no están disponibles o están expirados
   * @param key Clave única para identificar los datos
   * @param fetcher Función que retorna un Observable con los datos
   * @param cacheDuration Duración del caché en milisegundos (opcional)
   */
  get<T>(key: string, fetcher: () => Observable<T>, cacheDuration?: number): Observable<T> {
    const duration = cacheDuration || this.DEFAULT_CACHE_DURATION;
    const cached = this.cache.get(key);
    const now = Date.now();

    // Si existe en caché y no ha expirado, retornar datos cacheados
    if (cached && (now - cached.timestamp) < duration) {
      return of(cached.data);
    }

    // Si hay una llamada en progreso, retornarla
    if (cached?.observable) {
      return cached.observable;
    }

    // No hay datos en caché o están expirados, hacer nueva llamada
    
    const observable = fetcher().pipe(
      tap(data => {
        // Guardar en caché cuando se reciban los datos
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          observable: undefined
        });
      }),
      shareReplay(1) // Compartir resultado entre múltiples suscriptores
    );

    // Marcar que hay una llamada en progreso
    this.cache.set(key, {
      data: null as any,
      timestamp: 0,
      observable
    });

    return observable;
  }

  /**
   * Invalida (elimina) una entrada específica del caché
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalida múltiples entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.invalidate(key));
  }

  /**
   * Limpia todo el caché
   */
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
  }

  /**
   * Obtiene información del estado del caché
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Precarga datos en el caché
   */
  preload<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      observable: undefined
    });
  }
}
