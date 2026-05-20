import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { NbButtonModule } from '@nebular/theme';

interface PaymentRow {
  type: 'group' | 'payment';
  subscriptionId?: string | null;
  summary?: any;
  payment?: any;
  children?: any[];
}

@Component({
    selector: 'ngx-payments-table',
    templateUrl: './payments-table.component.html',
    styleUrls: ['./payments-table.component.scss'],
    standalone: true,
    imports: [NgClass, NbButtonModule, DatePipe]
})
export class PaymentsTableComponent implements OnChanges {
  @Input() payments: any[] = [];
  @Output() detailsClick = new EventEmitter<string>();

  displayRows: PaymentRow[] = [];
  expandedGroups = new Set<string | number>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.payments) {
      this.expandedGroups.clear();
      this.buildDisplayRows();
    }
  }

  onKeydown(event: KeyboardEvent, sid: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleGroup(sid);
    }
  }

  formatAmount(value: any): string {
    try {
      const n = typeof value === 'number' ? value : Number(value);
      if (isNaN(n)) return '-';
      return 'S/ ' + n.toFixed(2);
    } catch (e) { return '-'; }
  }

  isDocumentPayment(p: any): boolean {
    if (!p) return false;
    // Detect common document-payment markers if present
    if (p.documentIds && Array.isArray(p.documentIds) && p.documentIds.length > 0) return true;
    if (p.downloads && Array.isArray(p.downloads) && p.downloads.length > 0) return true;
    if (p.documents && Array.isArray(p.documents) && p.documents.length > 0) return true;
    // fallback: if there's no subscriptionId, treat as single/document
    if (!p.subscriptionId) return true;
    return false;
  }

  private buildDisplayRows() {
    const rows: PaymentRow[] = [];

    // If backend returned a mixed payload (some items are groups with `head`,
    // others are standalone payments) process each element individually.
    const isSubscriptionItem = (it: any) => it && (it.type === 'subscription' || it.head !== undefined);
    const anyGrouped = (this.payments || []).some(isSubscriptionItem);

    if (anyGrouped) {
      for (const item of (this.payments as any[])) {
        if (isSubscriptionItem(item)) {
          const grp = item as any;
          const head = grp.head as any;
          const children = (grp.children || []) as any[];

          const summary = {
            subscriptionId: grp.subscriptionId,
            displayName: head?.firstName || head?.name || ('Suscripción ' + String(grp.subscriptionId).slice(-6)),
            nextDue: head?.paymentDate,
            count: grp.count || (children.length + (head ? 1 : 0)),
            totalAmount: grp.totalAmount
          };

          rows.push({ type: 'group', subscriptionId: String(grp.subscriptionId || ''), summary, children: [head, ...children] });
        } else {
          // standalone payment object
          rows.push({ type: 'payment', payment: item });
        }
      }

      // Order comes from API (groups by MIN payment_date, standalones by payment_date)
      this.displayRows = rows;
      return;
    }

    // Fallback: group client-side by subscription/user
    const bySub = new Map<string, any[]>();

    const getSid = (p: any): string | null => {
      if (!p) return null;
      // If there's an explicit subscription identifier, use it.
      if (p.subscriptionId) return String(p.subscriptionId);

      // Only consider grouping when the payment is clearly a subscription.
      // This prevents document/pay-per-download payments from being grouped
      // by shared fields like `userId` or `email`.
      if (p.isSubscription === true) {
        if (p.subscription && (p.subscription.id || p.subscription.subscriptionId)) return String(p.subscription.id || p.subscription.subscriptionId);
        if (p.subscription_id) return String(p.subscription_id);
        if (p.metadata && p.metadata.subscriptionId) return String(p.metadata.subscriptionId);
        if (p.subscriptionIdNumber) return String(p.subscriptionIdNumber);
        if (p.userId) return `user:${String(p.userId)}`;
        if (p.email) return `email:${String(p.email).toLowerCase()}`;
      }

      return null;
    };

    (this.payments || []).forEach(p => {
      const sid = getSid(p);
      if (sid) {
        if (!bySub.has(sid)) bySub.set(sid, []);
        bySub.get(sid)!.push(p);
      }
    });

    const singles = (this.payments || []).filter(p => !getSid(p));

    for (const [sid, list] of bySub.entries()) {
      const totalPending = list.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const nextDue = list.reduce((d: string|null, it) => {
        if (!it.paymentDate) return d;
        if (!d) return it.paymentDate;
        return new Date(it.paymentDate) < new Date(d) ? it.paymentDate : d;
      }, null);

      rows.push({
        type: 'group',
        subscriptionId: sid,
        summary: {
          subscriptionId: sid,
          displayName: list[0]?.firstName || list[0]?.name || 'Suscripción',
          totalAmount: totalPending,
          count: list.length,
          nextDue
        },
        children: list
      });
    }

    singles.forEach(p => rows.push({ type: 'payment', payment: p }));

    rows.sort((a, b) => {
      const da = a.type === 'group' && a.summary?.nextDue ? new Date(a.summary.nextDue).getTime() : (a.payment ? new Date(a.payment.paymentDate).getTime() : 0);
      const db = b.type === 'group' && b.summary?.nextDue ? new Date(b.summary.nextDue).getTime() : (b.payment ? new Date(b.payment.paymentDate).getTime() : 0);
      return db - da;
    });

    this.displayRows = rows;
  }

  toggleGroup(sid: string) {
    if (this.expandedGroups.has(sid)) this.expandedGroups.delete(sid);
    else this.expandedGroups.add(sid);
  }

  isExpanded(sid: string) {
    return this.expandedGroups.has(sid);
  }

  onDetails(paymentId: string) {
    this.detailsClick.emit(paymentId);
  }

  trackByFn(index: number, item: PaymentRow) {
    if (item.type === 'group') return `g-${item.subscriptionId}`;
    return `p-${item.payment?.id || item.payment?.paymentId || index}`;
  }
}
