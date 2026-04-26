import { Injectable, inject } from '@angular/core';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { NotificationsApi, Notification, NotificationsResponse } from '../backend/api/notifications.api';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private notificationsApi = inject(NotificationsApi);

  private unreadCount$ = new BehaviorSubject<number>(0);
  private pollingInterval = 300000; // 5 minutes (300 seconds) - reduced frequency
  private userId: number | null = null;

  /**
   * Initialize polling for notifications
   */
  startPolling(userId: number): void {
    this.userId = userId;
    
    // Initial load
    this.loadUnreadCount();
    
    // Poll every 60 seconds
    interval(this.pollingInterval)
      .pipe(
        switchMap(() => this.notificationsApi.getUnreadCount(userId)),
        map((response: any) => response?.data || 0),
        catchError(() => of(0))
      )
      .subscribe(count => {
        this.unreadCount$.next(count);
      });
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    this.userId = null;
    this.unreadCount$.next(0);
  }

  /**
   * Get current unread count as observable
   */
  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  /**
   * Get notifications
   */
  getNotifications(limit: number = 20): Observable<NotificationsResponse> {
    if (!this.userId) {
      return of({ notifications: [], unreadCount: 0, totalCount: 0 });
    }

    return this.notificationsApi.getNotifications(this.userId, limit).pipe(
      map((response: any) => response?.data || { notifications: [], unreadCount: 0, totalCount: 0 }),
      catchError(() => of({ notifications: [], unreadCount: 0, totalCount: 0 }))
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: number): Observable<boolean> {
    if (!this.userId) return of(false);

    return this.notificationsApi.markAsRead(notificationId, this.userId).pipe(
      map((response: any) => response?.data || false),
      tap(() => this.loadUnreadCount()),
      catchError(() => of(false))
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<number> {
    if (!this.userId) return of(0);

    return this.notificationsApi.markAllAsRead(this.userId).pipe(
      map((response: any) => response?.data || 0),
      tap(() => this.unreadCount$.next(0)),
      catchError(() => of(0))
    );
  }

  /**
   * Reload unread count
   */
  private loadUnreadCount(): void {
    if (!this.userId) return;

    this.notificationsApi.getUnreadCount(this.userId)
      .pipe(
        map((response: any) => response?.data || 0),
        catchError(() => of(0))
      )
      .subscribe(count => {
        this.unreadCount$.next(count);
      });
  }

  /**
   * Manually refresh unread count
   */
  refreshUnreadCount(): void {
    this.loadUnreadCount();
  }
}
