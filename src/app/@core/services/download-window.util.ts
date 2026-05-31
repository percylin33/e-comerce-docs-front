// Calcula la duracion (ms) durante la cual mantener el boton de descarga
// bloqueado tras disparar el a.click() nativo. Como el navegador no expone
// evento de "descarga terminada" para descargas nativas, esto es una
// ventana heuristica de feedback visual.
//
// Asume un throughput conservador de ~0.5 MB/s (BYTES_PER_MS = 500 bytes/ms,
// que equivale a 500 KB/s) para tolerar conexiones lentas (4G en hora pico,
// WiFi compartido) y enlaces saturados. Limita la ventana entre
// MIN_WINDOW_MS (12s — feedback minimo aunque el archivo sea muy chico) y
// MAX_WINDOW_MS (10 min, para PDFs grandes >300 MB). La barra de descargas
// nativa del navegador sigue siendo la fuente real de progreso.
//
// Tabla orientativa:
//   1 MB   -> 12s   (clamp por minimo)
//   5 MB   -> 12s   (clamp por minimo)
//   20 MB  -> 40s
//   50 MB  -> 100s
//   200 MB -> 400s (~6.7 min)
//   500 MB -> 600s (10 min, clamp por maximo)

const BYTES_PER_MS = 500;
const MIN_WINDOW_MS = 12000;
const MAX_WINDOW_MS = 600000;
const DEFAULT_WINDOW_MS = 30000;

export function computeDownloadWindowMs(fileSize?: number | null): number {
  if (!fileSize || fileSize <= 0) {
    return DEFAULT_WINDOW_MS;
  }
  const estimated = Math.round(fileSize / BYTES_PER_MS);
  return Math.max(MIN_WINDOW_MS, Math.min(MAX_WINDOW_MS, estimated));
}
