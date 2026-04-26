import { Component, ViewEncapsulation, OnInit, inject } from '@angular/core';
import { DashboardService } from '../../@core/backend/services/dashboard.service';
import { DashboardStats } from '../../@core/interfaces/dashboard';
import { DashboardPromotoresService } from '../../@core/backend/services/dashboard-promotores.service';
import { WithdrawalDto } from '../../@core/interfaces/dashboard-promotores';
import { AdminHeaderActionsComponent } from '../../@theme/components/admin-header-actions/admin-header-actions.component';
import { RouterLink } from '@angular/router';
import { NgClass, LowerCasePipe, DecimalPipe, TitleCasePipe, DatePipe } from '@angular/common';

@Component({
    selector: 'ngx-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        AdminHeaderActionsComponent,
        RouterLink,
        NgClass,
        LowerCasePipe,
        DecimalPipe,
        TitleCasePipe,
        DatePipe,
    ],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private promService = inject(DashboardPromotoresService);

  stats: DashboardStats | null = null;
  loadingStats = false;
  // latest withdrawals (pending) shown in the dashboard (limit 5)
  recentWithdrawals: WithdrawalDto[] = [];
  loadingWithdrawals = false;
  // top embajadores (month)
  topEmbajadores: Array<{ promotorId: string; firstname: string; lastname: string; email: string; total: number }> = [];
  loadingTopEmbajadores = false;
  // recent activity feed
  recentActivities: Array<{ id: number; actorEmail: string; action: string; targetTable: string; targetId: number; payload?: string; timestamp?: string }> = [];
  loadingRecentActivities = false;

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentWithdrawals();
    this.loadTopEmbajadores();
    this.loadRecentActivities();
  }

  loadStats(): void {
    this.loadingStats = true;
    this.dashboardService.getStats().subscribe({
      next: (s) => { this.stats = s; this.loadingStats = false; },
      error: (err) => { console.error('Error loading dashboard stats', err); this.loadingStats = false; }
    });
  }

  loadRecentWithdrawals(): void {
    this.loadingWithdrawals = true;
    this.promService.getList('pending', undefined, 0, 5).subscribe({
      next: (data) => {
        this.recentWithdrawals = Array.isArray(data.content) ? data.content : [];
        this.loadingWithdrawals = false;
      },
      error: (err: any) => { console.error('Error loading recent withdrawals', err); this.loadingWithdrawals = false; }
    });
  }

  loadTopEmbajadores(): void {
    this.loadingTopEmbajadores = true;
    this.dashboardService.getTopEmbajadores(5).subscribe({
      next: (data) => { this.topEmbajadores = Array.isArray(data) ? data : []; this.loadingTopEmbajadores = false; },
      error: (err) => { console.error('Error loading top embajadores', err); this.loadingTopEmbajadores = false; }
    });
  }

  loadRecentActivities(): void {
    this.loadingRecentActivities = true;
    this.dashboardService.getRecentActivities(5).subscribe({
      next: (data) => { this.recentActivities = Array.isArray(data) ? data : []; this.loadingRecentActivities = false; },
      error: (err) => { console.error('Error loading recent activities', err); this.loadingRecentActivities = false; }
    });
  }

  // Próximo lanzamiento is handled in Contenido component now

  // Devuelve la clase CSS del icono según la acción (más fiable que ngClass con claves con espacios)
  activityIcon(action?: string): string {
    const a = (action || '').toLowerCase();
    if (a.includes('create') || a.includes('new') || a.includes('registro') || a.includes('promotor')) {
      return 'fas fa-user-plus';
    }
    // detectar rechazo primero (palabras clave en inglés y español)
    if (a.includes('reject') || a.includes('rechaz') || a.includes('rejected')) {
      return 'fas fa-times-circle';
    }
    if (a.includes('approve') || a.includes('aprob') || a.includes('paid')) {
      return 'fas fa-check-circle';
    }
    // si el texto contiene 'withdrawal' sin indicar aprobado/rechazado, usar check-circle por defecto
    if (a.includes('withdrawal')) {
      return 'fas fa-check-circle';
    }
    if (a.includes('upload') || a.includes('guía') || a.includes('guia') || a.includes('document')) {
      return 'fas fa-file-upload';
    }
    // fallback
    return 'fas fa-info-circle';
  }
}
