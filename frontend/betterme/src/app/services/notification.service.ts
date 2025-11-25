import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export interface Notification {
  id: number;
  title: string;
  message?: string;
  type: string;
  taskId?: number;
  taskTitle?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
}

export interface NotificationSettings {
  id: number;
  userId: number;
  enableBrowserNotifications: boolean;
  enableReminders: boolean;
  defaultReminderMinutes: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  activeDays: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationSettingsRequest {
  enableBrowserNotifications?: boolean;
  pushSubscriptionJson?: string;
  enableReminders?: boolean;
  defaultReminderMinutes?: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  activeDays?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/notifications`;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationPermissionSubject = new BehaviorSubject<NotificationPermission>('default');
  public notificationPermission$ = this.notificationPermissionSubject.asObservable();

  constructor() {
    this.checkNotificationPermission();
    this.startPolling();
  }

  // Check browser notification permission
  checkNotificationPermission(): void {
    if ('Notification' in window) {
      this.notificationPermissionSubject.next(Notification.permission);
    }
  }

  // Request browser notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermissionSubject.next('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      this.notificationPermissionSubject.next('denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    this.notificationPermissionSubject.next(permission);
    return permission === 'granted';
  }

  // Show browser notification
  showBrowserNotification(notification: Notification): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: notification.message || notification.title,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-192x192.png',
      tag: `notification-${notification.id}`,
      data: {
        notificationId: notification.id,
        taskId: notification.taskId,
        actionUrl: notification.actionUrl
      }
    };

    const browserNotification = new Notification(notification.title, options);

    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      browserNotification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => browserNotification.close(), 5000);
  }

  // Get all notifications
  getNotifications(unreadOnly: boolean = false): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}?unreadOnly=${unreadOnly}`);
  }

  // Get unread count
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread/count`);
  }

  // Mark notification as read
  markAsRead(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/read`, {});
  }

  // Mark all as read
  markAllAsRead(): Observable<{ message: string; count: number }> {
    return this.http.patch<{ message: string; count: number }>(`${this.apiUrl}/read-all`, {});
  }

  // Delete notification
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get notification settings
  getSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${environment.apiUrl}/api/notificationsettings`);
  }

  // Update notification settings
  updateSettings(settings: NotificationSettingsRequest): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${environment.apiUrl}/api/notificationsettings`, settings);
  }

  // Refresh notifications
  refreshNotifications(): void {
    this.getNotifications().subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      },
      error: (error) => console.error('Error fetching notifications:', error)
    });
  }

  // Update unread count
  updateUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (response) => this.unreadCountSubject.next(response.count),
      error: (error) => console.error('Error fetching unread count:', error)
    });
  }

  // Start polling for new notifications (every 30 seconds)
  private startPolling(): void {
    interval(30000).subscribe(() => {
      if (this.authService.isLoggedIn()) {
        this.updateUnreadCount();
        this.refreshNotifications();
      }
    });
  }
}

