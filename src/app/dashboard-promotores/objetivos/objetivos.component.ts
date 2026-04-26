import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UsersService } from '../../@core/backend/services/users.service';
import { ObjectivesService } from '../../@core/backend/services/objectives.service';
import { FormsModule } from '@angular/forms';
import { AdminHeaderActionsComponent } from '../../@theme/components/admin-header-actions/admin-header-actions.component';

interface PromotorRow {
  id: string;
  name: string;
  email: string;
  commission?: number;
  objectiveText?: string;
  objectiveId?: number | null;
}

@Component({
    selector: 'ngx-objetivos',
    templateUrl: './objetivos.component.html',
    styleUrls: ['./objetivos.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [FormsModule, AdminHeaderActionsComponent],
})
export class ObjetivosComponent implements OnInit {
  promotores: PromotorRow[] = [];

  // modal state
  showObjetivoModal = false;
  editingPromotor?: PromotorRow | null = null;
  editCommission = 10;
  editObjectiveText = '';
  // per-promotor objectives shown in modal when editing a promotor
  promotorObjectives: Array<any> = [];
  // fields for creating a new custom objective within modal
  newCustomText = '';
  newCustomCommission = 0;

  loading = false;
  // support multiple general objectives
  generalObjectives: Array<{ id?: number; message: string; commissionBonus?: number }> = [];
  newGeneralText = '';
  editingGeneralId: number | null = null;
  editingGeneralText = '';

  // pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;

  constructor(private usersService: UsersService, private objectivesService: ObjectivesService) {}

  ngOnInit(): void {
    this.loadPromotoresAndObjectives();
  }

  // load promotores and objectives then merge
  public loadPromotoresAndObjectives(page: number = this.currentPage): void {
    this.loading = true;
    this.currentPage = page;
    // dashboard controller expects 1-based pagina parameter
    this.usersService.getPromotores(this.currentPage, this.pageSize).subscribe({
      next: promResp => {
        // promResp follows GetPromotoresResponse shape: { data: [...], pagination: {...} }
        const promotores = (promResp?.data || promResp) as any[];
        const pagination = (promResp && (promResp as any).pagination) || null;
        if (pagination) {
          this.currentPage = pagination.paginaActual || this.currentPage;
          this.pageSize = pagination.cantidadElementosPorPagina || this.pageSize;
          this.totalPages = pagination.cantidadDePaginas || this.totalPages;
          this.totalItems = pagination.cantidadDeDocumentos || this.totalItems;
        }
        this.objectivesService.getObjectives().subscribe({
          next: (objResp: any[]) => {
            const objByUser = new Map<number, any>();
            (objResp || []).forEach(o => { if (o.assignedTo) objByUser.set(Number(o.assignedTo.id || o.assignedTo), o); });

        this.promotores = promotores.map(p => ({
          id: String(p.idPromotor || p.id),
          name: p.name || (p.firstname ? (p.firstname + ' ' + (p.lastname || '')) : ''),
          email: p.email,
              commission: 10,
          objectiveText: (() => {
            const key = Number(p.idPromotor || p.id);
            const o = objByUser.get(key);
            if (!o) return '';
            if (o.message && o.message.trim() !== '') return o.message;
            // fallback to parsing target JSON if message empty
            try {
              const t = typeof o.target === 'string' ? JSON.parse(o.target) : o.target;
              return (t && (t.text || t.message)) ? (t.text || t.message) : '';
            } catch (e) {
              return '';
            }
          })(),
          objectiveId: (() => { const o = objByUser.get(Number(p.idPromotor || p.id)); return o ? (o.id || null) : null })()
            }));
              // try to find a general objective (no assignedTo) and set the textarea value
              // collect only general objectives (no assignedTo and key === 'GENERAL_OBJECTIVE')
              this.generalObjectives = (objResp || [])
                .filter((o: any) => (!o.assignedTo || o.assignedTo === null) && (o.key === 'GENERAL_OBJECTIVE'))
                .map((o: any) => ({ id: o.id, message: o.message, commissionBonus: o.commissionBonus || 0 }));
              this.loading = false;
          },
          error: () => this.loading = false
        });
      },
      error: () => this.loading = false
    });
  }

  openEdit(prom: PromotorRow): void {
    this.editingPromotor = prom;
    this.editCommission = prom.commission || 10;
    this.editObjectiveText = '';
    this.showObjetivoModal = true;
    // load objectives assigned to this promotor (CUSTOM_OBJECTIVE)
    const assignedId = Number(prom.id);
    this.loadObjectivesForPromotor(assignedId);
  }

  closeObjetivoModal(): void {
    this.showObjetivoModal = false;
    this.editingPromotor = null;
  }

  saveObjetivo(): void {
    // legacy single-objective save removed — use the modal-specific create/update handlers
    // Keep for compatibility: if editingPromotor.objectiveId is set, update that specific objective
    if (!this.editingPromotor) return;
    const assignedToId = Number(this.editingPromotor.id);
    if (this.editingPromotor.objectiveId) {
      const payload: any = {
        key: 'CUSTOM_OBJECTIVE',
        message: this.editObjectiveText,
        target: JSON.stringify({ text: this.editObjectiveText }),
        commissionBonus: Number(this.editCommission),
        status: 'active'
      };
      const id = Number(this.editingPromotor.objectiveId);
      this.objectivesService.updateObjective(id, payload, assignedToId).subscribe({ next: () => { this.loadPromotoresAndObjectives(this.currentPage); this.closeObjetivoModal(); } });
    } else {
      const payload: any = {
        key: 'CUSTOM_OBJECTIVE',
        message: this.editObjectiveText,
        target: JSON.stringify({ text: this.editObjectiveText }),
        commissionBonus: Number(this.editCommission),
        status: 'active'
      };
      this.objectivesService.createObjective(payload, assignedToId).subscribe({ next: () => { this.loadPromotoresAndObjectives(this.currentPage); this.closeObjetivoModal(); } });
    }
  }

  // Load objectives for a specific promotor (client-side filter)
  private loadObjectivesForPromotor(assignedId: number): void {
    this.promotorObjectives = [];
    this.objectivesService.getObjectives().subscribe({ next: (objs: any[]) => {
      this.promotorObjectives = (objs || []).filter(o => {
        // o.assignedTo may be primitive id or object; handle both
        const a = o.assignedTo;
        const aid = (a && typeof a === 'object') ? (a.id || a) : a;
        return (aid != null) && Number(aid) === Number(assignedId) && o.key === 'CUSTOM_OBJECTIVE';
      });
    }});
  }

  createPromotorObjective(): void {
    if (!this.editingPromotor) return;
    const assignedToId = Number(this.editingPromotor.id);
    const payload: any = {
      key: 'CUSTOM_OBJECTIVE',
      message: this.newCustomText,
      target: JSON.stringify({ text: this.newCustomText }),
      commissionBonus: Number(this.newCustomCommission || 0),
      status: 'active'
    };
    this.objectivesService.createObjective(payload, assignedToId).subscribe({ next: () => { this.newCustomText = ''; this.newCustomCommission = 0; this.loadObjectivesForPromotor(assignedToId); this.loadPromotoresAndObjectives(this.currentPage); } });
  }

  updatePromotorObjective(id: number, updatedText: string, commission: number): void {
    if (!this.editingPromotor) return;
    const assignedToId = Number(this.editingPromotor.id);
    const payload: any = {
      key: 'CUSTOM_OBJECTIVE',
      message: updatedText,
      target: JSON.stringify({ text: updatedText }),
      commissionBonus: Number(commission || 0),
      status: 'active'
    };
    this.objectivesService.updateObjective(id, payload, assignedToId).subscribe({ next: () => { this.loadObjectivesForPromotor(assignedToId); this.loadPromotoresAndObjectives(this.currentPage); } });
  }

  deletePromotorObjective(id: number): void {
    if (!this.editingPromotor) return;
    if (!confirm('¿Eliminar objetivo personalizado?')) return;
    this.objectivesService.deleteObjective(id).subscribe({ next: () => { this.loadObjectivesForPromotor(Number(this.editingPromotor!.id)); this.loadPromotoresAndObjectives(this.currentPage); } });
  }

  saveGeneralObjective(): void {
    // Create a new general objective
    const payload: any = {
      key: 'GENERAL_OBJECTIVE',
      message: this.newGeneralText,
      target: JSON.stringify({ text: this.newGeneralText }),
      commissionBonus: 0,
      status: 'active'
    };

    this.objectivesService.createObjective(payload).subscribe({ next: () => { this.newGeneralText = ''; this.loadPromotoresAndObjectives(); } });
  }

  editGeneralObjective(g: { id?: number; message: string }): void {
    if (!g || !g.id) return;
    this.editingGeneralId = Number(g.id);
    this.editingGeneralText = g.message || '';
  }

  cancelEditGeneral(): void {
    this.editingGeneralId = null;
    this.editingGeneralText = '';
  }

  saveEditedGeneral(): void {
    if (this.editingGeneralId == null) return;
    const payload: any = {
      key: 'GENERAL_OBJECTIVE',
      message: this.editingGeneralText,
      target: JSON.stringify({ text: this.editingGeneralText }),
      commissionBonus: 0,
      status: 'active'
    };
    this.objectivesService.updateObjective(Number(this.editingGeneralId), payload).subscribe({ next: () => { this.cancelEditGeneral(); this.loadPromotoresAndObjectives(); } });
  }

  deleteGeneralObjective(id?: number): void {
    if (!id) return;
    if (!confirm('¿Eliminar objetivo general? Esta acción no se puede deshacer.')) return;
    this.objectivesService.deleteObjective(Number(id)).subscribe({ next: () => { this.loadPromotoresAndObjectives(); } });
  }
}
