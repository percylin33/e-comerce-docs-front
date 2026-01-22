import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DocumentCacheService } from './document-cache.service';

describe('DocumentCacheService', () => {
  let service: DocumentCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentCacheService);
  });

  afterEach(() => {
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should cache data on first call', (done) => {
    const key = 'test-key';
    const data = { items: [1, 2, 3] };
    const source$ = of(data);

    service.get(key, source$).subscribe(result => {
      expect(result).toEqual(data);
      expect(service.has(key)).toBe(true);
      done();
    });
  });

  it('should return cached data on subsequent calls', (done) => {
    const key = 'test-key';
    const data = { items: [1, 2, 3] };
    let callCount = 0;
    
    // Observable que cuenta cuántas veces se ejecuta
    const source$ = of(data).pipe(
      tap(() => callCount++)
    );

    // Primera llamada
    service.get(key, source$).subscribe(() => {
      // Segunda llamada - debería usar caché
      service.get(key, source$).subscribe(result => {
        expect(result).toEqual(data);
        expect(callCount).toBe(1); // Solo debe ejecutarse una vez
        done();
      });
    });
  });

  it('should expire cache after specified time', fakeAsync(() => {
    const key = 'test-key';
    const data = { items: [1, 2, 3] };
    const cacheTime = 1000; // 1 segundo
    const source$ = of(data);

    service.get(key, source$, cacheTime).subscribe();
    expect(service.has(key, cacheTime)).toBe(true);

    // Avanzar tiempo más allá del cacheTime
    tick(cacheTime + 1);
    
    expect(service.has(key, cacheTime)).toBe(false);
  }));

  it('should generate consistent keys from parameters', () => {
    const params1 = { nivel: 'PRIMARIA', materia: 'MATEMATICA', grado: '1°' };
    const params2 = { materia: 'MATEMATICA', grado: '1°', nivel: 'PRIMARIA' }; // Orden diferente
    
    const key1 = service.generateKey('filter', params1);
    const key2 = service.generateKey('filter', params2);
    
    expect(key1).toBe(key2);
  });

  it('should ignore empty parameters when generating keys', () => {
    const params1 = { nivel: 'PRIMARIA', materia: '', grado: null };
    const params2 = { nivel: 'PRIMARIA' };
    
    const key1 = service.generateKey('filter', params1);
    const key2 = service.generateKey('filter', params2);
    
    expect(key1).toBe(key2);
  });

  it('should invalidate specific cache entry', (done) => {
    const key = 'test-key';
    const data = { items: [1, 2, 3] };
    const source$ = of(data);

    service.get(key, source$).subscribe(() => {
      expect(service.has(key)).toBe(true);
      
      service.invalidate(key);
      expect(service.has(key)).toBe(false);
      done();
    });
  });

  it('should invalidate cache entries matching pattern', (done) => {
    const data = { items: [1, 2, 3] };
    
    service.get('filter:1', of(data)).subscribe();
    service.get('filter:2', of(data)).subscribe();
    service.get('document:1', of(data)).subscribe();

    setTimeout(() => {
      expect(service.size()).toBe(3);
      
      service.invalidatePattern(/^filter:/);
      
      expect(service.size()).toBe(1);
      expect(service.has('document:1')).toBe(true);
      done();
    }, 10);
  });

  it('should clear all cache', (done) => {
    const data = { items: [1, 2, 3] };
    
    service.get('key1', of(data)).subscribe();
    service.get('key2', of(data)).subscribe();
    service.get('key3', of(data)).subscribe();

    setTimeout(() => {
      expect(service.size()).toBe(3);
      
      service.clear();
      
      expect(service.size()).toBe(0);
      done();
    }, 10);
  });

  it('should remove cache entry on error', (done) => {
    const key = 'error-key';
    const error$ = throwError(() => new Error('Test error'));

    service.get(key, error$).subscribe({
      error: () => {
        expect(service.has(key)).toBe(false);
        done();
      }
    });
  });

  it('should share result between multiple subscribers', (done) => {
    const key = 'shared-key';
    const data = { items: [1, 2, 3] };
    let callCount = 0;
    
    const source$ = of(data).pipe(
      tap(() => callCount++)
    );

    const cached$ = service.get(key, source$);
    
    // Múltiples suscriptores
    cached$.subscribe();
    cached$.subscribe();
    cached$.subscribe();

    setTimeout(() => {
      expect(callCount).toBe(1); // Solo debe ejecutarse una vez
      done();
    }, 10);
  });

  it('should clean expired entries', fakeAsync(() => {
    const cacheTime = 1000;
    
    service.get('key1', of({ data: 1 }), cacheTime).subscribe();
    tick(500);
    service.get('key2', of({ data: 2 }), cacheTime).subscribe();
    tick(600); // key1 ha expirado, key2 no
    
    service.cleanExpired(cacheTime);
    
    expect(service.has('key1', cacheTime)).toBe(false);
    expect(service.has('key2', cacheTime)).toBe(true);
  }));

  it('should provide cache statistics', (done) => {
    service.get('key1', of({ data: 1 })).subscribe();
    service.get('key2', of({ data: 2 })).subscribe();

    setTimeout(() => {
      const stats = service.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.oldestEntry).toBeTruthy();
      done();
    }, 10);
  });

  it('should preload data into cache', (done) => {
    const key = 'preload-key';
    const data = { items: [1, 2, 3] };
    
    service.preload(key, of(data)).subscribe(result => {
      expect(result).toEqual(data);
      expect(service.has(key)).toBe(true);
      done();
    });
  });
});
