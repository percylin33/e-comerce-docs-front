import { Injectable } from '@angular/core';

/**
 * Carga scripts externos bajo demanda y los memoiza por URL.
 * Permite eliminar tags `<script>` 3rd-party del index.html para
 * mejorar FCP/LCP/TBT en la carga inicial.
 */
@Injectable({ providedIn: 'root' })
export class ScriptLoaderService {
  private cache = new Map<string, Promise<void>>();

  /**
   * Carga un script una sola vez. Si ya existe en el documento (por src
   * exacto o que contiene `matchSubstr`), reusa el tag.
   *
   * @param src URL del script.
   * @param options.matchSubstr Subcadena alternativa a buscar para detectar
   *   un tag pre-existente (útil cuando el src puede variar por query string).
   * @param options.globalCheck Función opcional que retorna true cuando el
   *   global esperado ya está disponible en `window`.
   */
  load(
    src: string,
    options: { matchSubstr?: string; globalCheck?: () => boolean } = {},
  ): Promise<void> {
    const key = src;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      // 1) Si el global ya existe, no volvemos a inyectar.
      if (options.globalCheck && options.globalCheck()) {
        return resolve();
      }

      // 2) Reutilizar tag existente.
      const existing = Array.from(document.getElementsByTagName('script'))
        .find(s => {
          const ssrc = (s as HTMLScriptElement).src || '';
          return (
            ssrc === src ||
            (options.matchSubstr ? ssrc.includes(options.matchSubstr) : false)
          );
        }) as HTMLScriptElement | undefined;

      if (existing) {
        if ((existing as any).hasLoaded) return resolve();
        existing.addEventListener('load', () => {
          (existing as any).hasLoaded = true;
          resolve();
        });
        existing.addEventListener('error', () =>
          reject(new Error(`Error cargando script: ${src}`)),
        );
        // Si ya terminó pero el global aún no está visible, espera un tick.
        setTimeout(() => {
          if (options.globalCheck ? options.globalCheck() : true) resolve();
        }, 50);
        return;
      }

      // 3) Crear tag nuevo.
      const tag = document.createElement('script');
      tag.src = src;
      tag.async = true;
      tag.defer = true;
      tag.addEventListener('load', () => {
        (tag as any).hasLoaded = true;
        if (!options.globalCheck) return resolve();
        // Pequeño delay para que el global termine de exponerse.
        setTimeout(() => {
          if (options.globalCheck!()) resolve();
          else reject(new Error(`Script cargado pero global ausente: ${src}`));
        }, 40);
      });
      tag.addEventListener('error', () =>
        reject(new Error(`Error cargando script: ${src}`)),
      );
      document.head.appendChild(tag);
    });

    this.cache.set(key, promise);
    return promise;
  }
}
