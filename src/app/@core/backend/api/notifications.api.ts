import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string; // Aceptar cualquier string para tipos backend (VENTA, COMISION, RETIRO, OBJETIVO, SISTEMA)
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdAt: string;
  timeAgo: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

@Injectable()
export class NotificationsApi {
  private readonly apiController: string = 'api/v1/notifications';

  constructor(private api: HttpService) {}

  /**
   * Get notifications for a user
   */
  getNotifications(userId: number, limit: number = 20): Observable<any> {
    return this.api.get(`${this.apiController}/${userId}?limit=${limit}`);
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: number): Observable<any> {
    return this.api.get(`${this.apiController}/${userId}/unread-count`);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: number, userId: number): Observable<any> {
    return this.api.put(`${this.apiController}/${notificationId}/read?userId=${userId}`, null);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: number): Observable<any> {
    return this.api.put(`${this.apiController}/${userId}/read-all`, null);
  }
}
