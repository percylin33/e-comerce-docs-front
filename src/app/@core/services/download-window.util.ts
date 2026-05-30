// Calcula la duracion (ms) durante la cual mantener el boton de descarga
// bloqueado tras disparar el a.click() nativo. Como el navegador no expone
// evento de "descarga terminada" para descargas nativas, esto es una
// ventana heuristica de feedback visual.
//
// Asume un throughput sostenido de ~1.5 MB/s (BYTES_PER_MS = 1500 bytes/ms,
// que equivale a 1500 KB/s) y limita la ventana entre MIN_WINDOW_MS y
// MAX_WINDOW_MS. Para archivos de 500 MB queda capada en 2 min; la barra
// de descargas nativa del navegador sigue siendo la fuente real de progreso.
// Para archivos pequenos garantiza al menos 4s de feedback para evitar
// que el boton parpadee.

const BYTES_PER_MS = 1500;
const MIN_WINDOW_MS = 4000;
const MAX_WINDOW_MS = 120000;
const DEFAULT_WINDOW_MS = 8000;

export function computeDownloadWindowMs(fileSize?: number | null): number {
  if (!fileSize || fileSize <= 0) {
    return DEFAULT_WINDOW_MS;
  }
  const estimated = Math.round(fileSize / BYTES_PER_MS);
  return Math.max(MIN_WINDOW_MS, Math.min(MAX_WINDOW_MS, estimated));
}
