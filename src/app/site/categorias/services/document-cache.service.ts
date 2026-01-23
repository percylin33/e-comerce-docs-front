import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { shareReplay, catchError, tap } from 'rxjs/operators';

interface CacheEntry<T> {
  data: Observable<T>;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutos por defecto
  
  constructor() {}

  /**
   * Obtiene datos del caché o ejecuta la función si no existe/expiró
   * @param key Clave única para identificar el caché
   * @param source$ Observable fuente que obtiene los datos
   * @param cacheTime Tiempo de vida del caché en milisegundos (default: 5 minutos)
   */
  get<T>(key: string, source$: Observable<T>, cacheTime: number = this.DEFAULT_CACHE_TIME): Observable<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Si existe en caché y no ha expirado, retornar
    if (cached && (now - cached.timestamp) < cacheTime) {
      return cached.data as Observable<T>;
    }

    // Si no existe o expiró, crear nueva entrada
    const sharedSource$ = source$.pipe(
      shareReplay(1), // Compartir resultado entre múltiples suscriptores
      catchError(error => {
        // En caso de error, remover del caché
        this.cache.delete(key);
        return throwError(() => error);
      })
    );

    this.cache.set(key, {
      data: sharedSource$,
      timestamp: now
    });

    return sharedSource$;
  }

  /**
   * Invalida una entrada específica del caché
   * @param key Clave del caché a invalidar
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   * @param pattern Expresión regular para buscar claves
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene el tamaño actual del caché
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Verifica si una clave existe en el caché y no ha expirado
   * @param key Clave a verificar
   * @param cacheTime Tiempo de vida del caché en milisegundos
   */
  has(key: string, cacheTime: number = this.DEFAULT_CACHE_TIME): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    const isExpired = (now - cached.timestamp) >= cacheTime;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Genera una clave de caché a partir de parámetros
   * @param prefix Prefijo para la clave (ej: 'documents', 'filter')
   * @param params Objeto con parámetros que identifican la petición
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    // Ordenar las claves para generar claves consistentes
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        const value = params[key];
        // Solo incluir valores no vacíos
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Pre-carga datos en el caché
   * @param key Clave del caché
   * @param data$ Observable con los datos a cachear
   * @param cacheTime Tiempo de vida del caché
   */
  preload<T>(key: string, data$: Observable<T>, cacheTime: number = this.DEFAULT_CACHE_TIME): Observable<T> {
    return this.get(key, data$, cacheTime);
  }

  /**
   * Limpia entradas expiradas del caché
   */
  cleanExpired(cacheTime: number = this.DEFAULT_CACHE_TIME): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if ((now - entry.timestamp) >= cacheTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): { size: number; keys: string[]; oldestEntry: number | null } {
    let oldestTimestamp: number | null = null;
    const keys: string[] = [];

    this.cache.forEach((entry, key) => {
      keys.push(key);
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    });

    return {
      size: this.cache.size,
      keys,
      oldestEntry: oldestTimestamp
    };
  }
}
