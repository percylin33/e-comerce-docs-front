import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { NotificationsService } from '../../@core/services/notifications.service';
import { Notification } from '../../@core/backend/api/notifications.api';
import { SharedService } from '../../@auth/components/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ngx-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount: number = 0;
  notifications: Notification[] = [];
  showDropdown: boolean = false;
  loading: boolean = false;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private notificationsService: NotificationsService,
    private sharedService: SharedService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Subscribe to unread count
    this.subscriptions.add(
      this.notificationsService.getUnreadCount().subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Try multiple ways to get userId
    let userId: number | null = null;
    
    // Method 1: From SharedService
    const user = this.sharedService.getCurrentUser();
    if (user && user.id) {
      userId = user.id;
    }
    
    // Method 2: From localStorage
    if (!userId) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userId = parsedUser.id;
        } catch (e) {
          console.error('❌ Error parsing user from localStorage', e);
        }
      }
    }
    
    // Method 3: From sessionStorage
    if (!userId) {
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        try {
          const parsedUser = JSON.parse(sessionUser);
          userId = parsedUser.id;
        } catch (e) {
          console.error('❌ Error parsing user from sessionStorage', e);
        }
      }
    }

    if (userId) {
      this.notificationsService.startPolling(userId);
    } else {
      console.warn('⚠️ No userId found - notifications disabled');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.notificationsService.stopPolling();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.showDropdown) {
      this.showDropdown = false;
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    
    if (this.showDropdown && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationsService.getNotifications(10).subscribe(
      response => {
        this.notifications = response.notifications;
        this.loading = false;
      },
      error => {
        console.error('❌ Error loading notifications', error);
        this.loading = false;
      }
    );
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    if (!notification.isRead) {
      this.notificationsService.markAsRead(notification.id).subscribe(() => {
        notification.isRead = true;
        this.notificationsService.refreshUnreadCount();
      });
    }
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.unreadCount = 0;
    });
  }

  getNotificationIcon(type: string): string {
    const typeUpper = type?.toUpperCase() || '';
    
    switch (typeUpper) {
      case 'VENTA':
      case 'SALE':
        return 'fas fa-shopping-cart';
      case 'COMISION':
      case 'COMMISSION':
        return 'fas fa-dollar-sign';
      case 'RETIRO':
      case 'WITHDRAWAL':
        return 'fas fa-money-bill-wave';
      case 'OBJETIVO':
      case 'OBJECTIVE':
        return 'fas fa-bullseye';
      case 'SISTEMA':
      case 'SYSTEM':
        return 'fas fa-bell';
      default:
        return 'fas fa-info-circle';
    }
  }

  getNotificationClass(type: string): string {
    const typeUpper = type?.toUpperCase() || '';
    
    switch (typeUpper) {
      case 'VENTA':
      case 'SALE':
        return 'notification-sale';
      case 'COMISION':
      case 'COMMISSION':
        return 'notification-commission';
      case 'RETIRO':
      case 'WITHDRAWAL':
        return 'notification-withdrawal';
      case 'OBJETIVO':
      case 'OBJECTIVE':
        return 'notification-objective';
      case 'SISTEMA':
      case 'SYSTEM':
        return 'notification-system';
      default:
        return '';
    }
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }
}
