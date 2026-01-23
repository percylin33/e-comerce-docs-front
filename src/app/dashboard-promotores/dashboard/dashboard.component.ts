import { Component, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';
import { DashboardService } from '../../@core/backend/services/dashboard.service';
import { DashboardPromotoresService } from '../../@core/backend/services/dashboard-promotores.service';
import { DashboardStats } from '../../@core/interfaces/dashboard';
import { WithdrawalDto } from '../../@core/interfaces/dashboard-promotores';

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
  // REMOVIDO: ViewEncapsulation.None (causa problemas de estilo global)
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Responsive
  isMobile = window.innerWidth <= 767;

  // Datos agrupados (rendimiento)
  dashboardData: {
    stats: DashboardStats | null;
    withdrawals: WithdrawalDto[];
    topEmbajadores: any[];
    activities: any[];
  } = {
    stats: null,
    withdrawals: [],
    topEmbajadores: [],
    activities: []
  };

  // Backwards-compatible properties
  stats: DashboardStats | null = null;
  loadingStats = true;
  recentWithdrawals: WithdrawalDto[] = [];
  loadingWithdrawals = true;
  topEmbajadores: any[] = [];
  loadingTopEmbajadores = true;
  recentActivities: any[] = [];
  loadingRecentActivities = true;

  // Un solo flag de carga
  loading = true;

  // Mapeo de íconos
  readonly activityIconMap: Record<string, string> = {
    'nuevo_embajador': 'fas fa-user-plus',
    'embajador_registrado': 'fas fa-user-plus',
    'retiro_aprobado': 'fas fa-check-circle',
    'retiro_rechazado': 'fas fa-times-circle',
    'nueva_guia': 'fas fa-file-upload',
    'venta_completada': 'fas fa-shopping-cart',
    'comision_pagada': 'fas fa-hand-holding-usd',
    'default': 'fas fa-info-circle'
  };

  constructor(
    private dashboardService: DashboardService,
    private promService: DashboardPromotoresService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: Event): void {
    this.isMobile = window.innerWidth <= 767;
  }

  private loadAllData(): void {
    this.loading = true;
    this.loadingStats = true;
    this.loadingWithdrawals = true;
    this.loadingTopEmbajadores = true;
    this.loadingRecentActivities = true;

    // CombineLatest para paralelizar llamadas
    combineLatest([
      this.dashboardService.getStats(),
      this.promService.getList('pending', undefined, 0, 5).pipe(
        map(data => Array.isArray(data?.content) ? data.content : [])
      ),
      this.dashboardService.getTopEmbajadores(5).pipe(
        map(data => Array.isArray(data) ? data : [])
      ),
      this.dashboardService.getRecentActivities(5).pipe(
        map(data => Array.isArray(data) ? data : [])
      )
    ])
    .pipe(
      map(([stats, withdrawals, topEmbajadores, activities]) => ({
        stats,
        withdrawals,
        topEmbajadores,
        activities
      })),
      finalize(() => {
        this.loading = false;
        this.loadingStats = false;
        this.loadingWithdrawals = false;
        this.loadingTopEmbajadores = false;
        this.loadingRecentActivities = false;
        // ensure view updates after loading flags change
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (data) => {
        this.dashboardData = data;
        // update template-facing aliases
        this.stats = data.stats;
        this.recentWithdrawals = data.withdrawals;
        this.topEmbajadores = data.topEmbajadores;
        this.recentActivities = data.activities;
        // ensure OnPush components detect this async update
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
      }
    });
  }

  // TrackBy para rendimiento
  trackById(index: number, item: any): string | number {
    return item?.id || item?.idWithdrawal || item?.promotorId || index;
  }

  // Obtiene ícono basado en acción
  getActivityIcon(action: string): string {
    const key = (action || '').toLowerCase().replace(/\s+/g, '_');
    return this.activityIconMap[key] || this.activityIconMap['default'];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}