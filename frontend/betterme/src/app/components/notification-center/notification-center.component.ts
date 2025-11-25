import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-center">
      <div class="notification-header">
        <h3>Notifications</h3>
        <div class="header-actions">
          @if (unreadCount > 0) {
            <button class="btn-mark-all" (click)="markAllAsRead()">Mark all as read</button>
          }
          <button class="btn-close" (click)="close()">×</button>
        </div>
      </div>

      <div class="notification-list">
        @if (loading) {
          <div class="loading">Loading notifications...</div>
        } @else if (notifications.length === 0) {
          <div class="empty-state">
            <span class="empty-icon">🔔</span>
            <p>No notifications</p>
          </div>
        } @else {
          @for (notification of notifications; track notification.id) {
            <div 
              class="notification-item" 
              [class.unread]="!notification.isRead"
              (click)="handleNotificationClick(notification)"
            >
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                @if (notification.message) {
                  <div class="notification-message">{{ notification.message }}</div>
                }
                <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
              </div>
              @if (!notification.isRead) {
                <div class="unread-indicator"></div>
              }
              <button 
                class="btn-delete" 
                (click)="deleteNotification(notification.id); $event.stopPropagation()"
                title="Delete"
              >
                ×
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .notification-center {
      position: fixed;
      top: 100px;
      right: 20px;
      width: 400px;
      max-height: 600px;
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .notification-header {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notification-header h3 {
      margin: 0;
      color: white;
      font-size: 1.2rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn-mark-all {
      background: rgba(102, 126, 234, 0.2);
      border: 1px solid rgba(102, 126, 234, 0.4);
      color: #667eea;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .btn-mark-all:hover {
      background: rgba(102, 126, 234, 0.3);
    }

    .btn-close {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .btn-close:hover {
      color: white;
    }

    .notification-list {
      flex: 1;
      overflow-y: auto;
      max-height: 500px;
    }

    .notification-item {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      transition: background 0.2s;
      position: relative;
    }

    .notification-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .notification-item.unread {
      background: rgba(102, 126, 234, 0.1);
    }

    .notification-content {
      flex: 1;
    }

    .notification-title {
      color: white;
      font-weight: 600;
      margin-bottom: 0.25rem;
      font-size: 0.95rem;
    }

    .notification-message {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }

    .notification-time {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.75rem;
    }

    .unread-indicator {
      width: 8px;
      height: 8px;
      background: #667eea;
      border-radius: 50%;
      margin-top: 0.5rem;
      flex-shrink: 0;
    }

    .btn-delete {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
      flex-shrink: 0;
    }

    .btn-delete:hover {
      color: #ff6b6b;
    }

    .loading, .empty-state {
      padding: 2rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
      .notification-center {
        width: 100%;
        right: 0;
        left: 0;
        top: 80px;
        max-height: calc(100vh - 80px);
        border-radius: 0;
      }
    }
  `]
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  
  notifications: Notification[] = [];
  unreadCount = 0;
  loading = true;
  private subscriptions = new Subscription();

  ngOnInit() {
    this.loadNotifications();
    this.subscribeToNotifications();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadNotifications() {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loading = false;
      }
    });

    this.notificationService.getUnreadCount().subscribe({
      next: (response) => this.unreadCount = response.count,
      error: (error) => console.error('Error loading unread count:', error)
    });
  }

  private subscribeToNotifications() {
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );

    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => console.error('Error marking all as read:', error)
    });
  }

  handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.loadNotifications();
        }
      });
    }

    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
      this.close();
    }
  }

  deleteNotification(id: number) {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.loadNotifications();
      },
      error: (error) => console.error('Error deleting notification:', error)
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  close() {
    // This should emit an event to parent or use a service to close
    // For now, we'll just hide it
    const element = document.querySelector('.notification-center');
    if (element) {
      (element as HTMLElement).style.display = 'none';
    }
  }
}

