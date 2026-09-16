import { SidebarCategoryItem } from './documento-comprado.model';

/**
 * Iconos por code de categoría para el sidebar de la vista grid.
 * Mismo set que `catalog-explorer.component.ts` para mantener consistencia visual.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  KITS: 'category',
  PLANIFICACION: 'event_note',
  EVALUACION: 'rule',
  EBOOKS: 'menu_book',
  ESTRATEGIAS: 'tips_and_updates',
  REFORZAMIENTO: 'trending_up',
  PLAN_LECTOR: 'bookmark',
  TALLERES: 'layers',
  MATERIAL_GRATIS: 'redeem',
  RECURSOS: 'folder_open',
  CONCURSOS: 'emoji_events',
};

/** Categorías que no se ofrecen en "Mis Documentos". */
export const EXCLUDED_SIDEBAR_CODES = new Set(['MEMBRESIAS', 'SUSCRIPCION']);

/** Construye la lista del sidebar excluyendo codes no aplicables y agregando "KITS" sintético. */
export function buildSidebarCategories(
  rawCategories: Array<{ id: number; code: string; name: string; active?: boolean }>,
): SidebarCategoryItem[] {
  const active = (rawCategories || []).filter((c) => c.active !== false);
  const planificacion = active.find((c) => c.code === 'PLANIFICACION');

  const synthKits: SidebarCategoryItem = {
    code: 'KITS',
    name: 'Kits de Planificacion',
    icon: CATEGORY_ICONS['KITS'] || 'category',
    categoryId: planificacion?.id ?? null,
    isSyntheticKits: true,
  };

  const rest = active
    .filter((c) => !EXCLUDED_SIDEBAR_CODES.has(c.code))
    .map<SidebarCategoryItem>((c) => ({
      code: c.code,
      name: c.name,
      icon: CATEGORY_ICONS[c.code] || 'folder',
      categoryId: c.id,
    }));

  return [synthKits, ...rest];
}