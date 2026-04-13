/**
 * MEMBRESÍAS permanece aquí porque tiene ruta diferente (/site/membresia).
 * El resto del menú de servicios es dinámico: se carga desde el backend
 * en HeaderComponent via CategoryService.
 */
export const MEMBRESIAS_ITEM = {
  title: 'MEMBRESÍAS',
  link: '/site/membresia',
  queryParams: {} as Record<string, string>,
};
