/**
 * Re-exporta los guards del modulo Creadores para que el panel admin
 * (admin-creadores) pueda importarlos desde su propio path.
 *
 * <p>Mejora M6 del modulo Creadores.</p>
 */
export { creatorGuard, adminGuard } from '../../dashboard-creadores/guards/creator.guard';