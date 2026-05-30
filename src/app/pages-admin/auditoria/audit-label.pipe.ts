import { Pipe, PipeTransform } from '@angular/core';
import {
  translateAction,
  translateCategory,
  translateSeverity,
  translateTargetTable,
} from './audit-labels';

export type AuditLabelKind = 'action' | 'target' | 'category' | 'severity';

/**
 * Pipe puro para mostrar valores tecnicos del modulo de auditoria
 * (action, targetTable, category, severity) en espanol.
 *
 * Uso:
 *   {{ row.action       | auditLabel:'action' }}
 *   {{ row.targetTable  | auditLabel:'target' }}
 *   {{ row.category     | auditLabel:'category' }}
 *   {{ row.severity     | auditLabel:'severity' }}
 *
 * El raw original sigue siendo accesible en el binding (ej. via `[title]`)
 * para que el admin tecnico pueda ver el codigo exacto al hacer hover.
 */
@Pipe({
  name: 'auditLabel',
  standalone: true,
  pure: true,
})
export class AuditLabelPipe implements PipeTransform {
  transform(value: string | null | undefined, kind: AuditLabelKind = 'action'): string {
    switch (kind) {
      case 'target': return translateTargetTable(value);
      case 'category': return translateCategory(value);
      case 'severity': return translateSeverity(value);
      case 'action':
      default: return translateAction(value);
    }
  }
}
