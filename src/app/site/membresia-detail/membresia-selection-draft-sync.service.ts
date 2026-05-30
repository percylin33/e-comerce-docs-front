import { Injectable } from '@angular/core';

export const MEMBRESIA_SELECTION_DRAFT_KEY = 'cd_membresia_selection_draft_v1';

export interface MembresiaSelectionDraftV1 {
  v: 1;
  t: number;
  subscriptionTypeId: number;
  tipoVisualizacion: 'vigente' | 'historico';
  selectedYear: number | null;
  selectedUnitId: number | null;
  currentStep: number;
  showAllUnits: boolean;
  showInstallments: boolean;
  selectedCuota: number | null;
  picks: { materiaId: number; nombres: string[] }[];
  expandidoMateriaIds: number[];
}

@Injectable({ providedIn: 'root' })
export class MembresiaSelectionDraftSyncService {
  private provider: (() => string | null) | null = null;

  register(serializer: () => string | null): void {
    this.provider = serializer;
  }

  unregister(): void {
    this.provider = null;
  }

  flush(): void {
    try {
      const json = this.provider?.() ?? null;
      if (json) {
        sessionStorage.setItem(MEMBRESIA_SELECTION_DRAFT_KEY, json);
      }
    } catch {
      // ignore
    }
  }
}