import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private localCache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutos por defecto
  
  // Subject para comunicar cambios de caché (para invalidación reactiva)
  private cacheUpdates$ = new BehaviorSubject<{ key: string, action: 'set' | 'delete' | 'clear' }>({
    key: '',
    action: 'clear'
  });

  constructor() {
    this.startCleanupTask();
  }

  /**
   * Obtiene un valor del caché
   */
  get<T>(key: string): T | null {
    const entry = this.localCache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (this.isExpired(entry)) {
      this.localCache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Guarda un valor en el caché
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.localCache.set(key, entry);
    
    // Notificar cambio
    this.cacheUpdates$.next({ key, action: 'set' });
  }

  /**
   * Elimina un valor específico del caché
   */
  delete(key: string): boolean {
    const deleted = this.localCache.delete(key);
    if (deleted) {
      this.cacheUpdates$.next({ key, action: 'delete' });
    }
    return deleted;
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.localCache.clear();
    this.cacheUpdates$.next({ key: 'all', action: 'clear' });
  }

  /**
   * Obtiene o ejecuta una función si no está en caché (wrapper útil)
   */
  getOrSet<T>(
    key: string, 
    fetchFn: () => Observable<T>, 
    ttl: number = this.DEFAULT_TTL
  ): Observable<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return of(cached);
    }

    return fetchFn().pipe(
      tap(data => this.set(key, data, ttl)),
      catchError(error => {
        console.error(`❌ Error al obtener datos para caché ${key}:`, error);
        throw error;
      })
    );
  }

  /**
   * Invalida caché por patrón (útil para invalidar múltiples entradas relacionadas)
   */
  invalidateByPattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.localCache.keys()) {
      if (regex.test(key)) {
        this.localCache.delete(key);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      this.cacheUpdates$.next({ key: pattern, action: 'delete' });
    }
    
    return deleted;
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    memoryUsage: string;
    entries: Array<{
      key: string;
      size: number;
      age: number;
      ttl: number;
      expired: boolean;
    }>;
  } {
    const entries = Array.from(this.localCache.entries());
    let validEntries = 0;
    let expiredEntries = 0;

    const entryDetails = entries.map(([key, entry]) => {
      const expired = this.isExpired(entry);
      const age = Date.now() - entry.timestamp;
      const size = this.estimateSize(entry.data);
      
      if (expired) {
        expiredEntries++;
      } else {
        validEntries++;
      }

      return {
        key,
        size,
        age,
        ttl: entry.ttl,
        expired
      };
    });

    return {
      totalEntries: entries.length,
      validEntries,
      expiredEntries,
      memoryUsage: this.formatBytes(entryDetails.reduce((sum, entry) => sum + entry.size, 0)),
      entries: entryDetails
    };
  }

  /**
   * Observable para escuchar cambios en el caché
   */
  getCacheUpdates(): Observable<{ key: string, action: 'set' | 'delete' | 'clear' }> {
    return this.cacheUpdates$.asObservable();
  }

  /**
   * Verifica si una entrada ha expirado
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Tarea de limpieza automática que se ejecuta cada 5 minutos
   */
  private startCleanupTask(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000); // Cada 5 minutos
  }

  /**
   * Limpia entradas expiradas
   */
  private cleanupExpired(): void {
    let cleaned = 0;
    
    for (const [key, entry] of this.localCache.entries()) {
      if (this.isExpired(entry)) {
        this.localCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
    }
  }

  /**
   * Estima el tamaño en bytes de un objeto
   */
  private estimateSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Formatea bytes en unidades legibles
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Genera claves de caché consistentes
   */
  static generateKey(prefix: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return paramString ? `${prefix}:${paramString}` : prefix;
  }

  /**
   * Configuración específica para diferentes tipos de datos
   */
  static readonly TTL = {
    DOCUMENTS_SHORT: 5 * 60 * 1000,      // 5 minutos para documentos frecuentes
    DOCUMENTS_MEDIUM: 15 * 60 * 1000,    // 15 minutos para listas de documentos
    DOCUMENTS_LONG: 60 * 60 * 1000,      // 1 hora para documentos estáticos
    USER_DATA: 30 * 60 * 1000,           // 30 minutos para datos de usuario
    METADATA: 2 * 60 * 60 * 1000,        // 2 horas para metadata
    STATIC_DATA: 24 * 60 * 60 * 1000,    // 24 horas para datos estáticos
  };
}
