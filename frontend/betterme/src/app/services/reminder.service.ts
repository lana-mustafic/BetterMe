import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export interface Reminder {
  id: number;
  taskId: number;
  taskTitle: string;
  remindAt: string;
  reminderType: string;
  offset?: string;
  notificationMethod: string;
  isSent: boolean;
  sentAt?: string;
  isActive: boolean;
  customMessage?: string;
  createdAt: string;
}

export interface CreateReminderRequest {
  taskId: number;
  reminderType: 'before_due' | 'at_due' | 'custom';
  offset?: string; // e.g., "1 hour", "30 minutes", "1 day"
  customDateTime?: string;
  notificationMethod?: 'browser';
  customMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/reminders`;

  // Create reminder
  createReminder(request: CreateReminderRequest): Observable<Reminder> {
    return this.http.post<Reminder>(this.apiUrl, request);
  }

  // Get reminder by ID
  getReminder(id: number): Observable<Reminder> {
    return this.http.get<Reminder>(`${this.apiUrl}/${id}`);
  }

  // Get reminders for a task
  getTaskReminders(taskId: number): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.apiUrl}/task/${taskId}`);
  }

  // Get all user reminders
  getUserReminders(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(this.apiUrl);
  }

  // Delete reminder
  deleteReminder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Toggle reminder active status
  toggleReminder(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/toggle`, {});
  }

  // Helper: Create multiple reminders for common patterns
  createMultipleReminders(taskId: number, dueDate: Date): Observable<Reminder[]> {
    const notificationMethod = 'browser';
    const reminders: Observable<Reminder>[] = [];

    // 1 day before
    reminders.push(this.createReminder({
      taskId,
      reminderType: 'before_due',
      offset: '1 day',
      notificationMethod
    }));

    // 1 hour before
    reminders.push(this.createReminder({
      taskId,
      reminderType: 'before_due',
      offset: '1 hour',
      notificationMethod
    }));

    // At due time
    reminders.push(this.createReminder({
      taskId,
      reminderType: 'at_due',
      notificationMethod
    }));

    // Return all created reminders
    return new Observable(observer => {
      let completed = 0;
      const results: Reminder[] = [];

      reminders.forEach(obs => {
        obs.subscribe({
          next: (reminder) => {
            results.push(reminder);
            completed++;
            if (completed === reminders.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            completed++;
            if (completed === reminders.length) {
              observer.error(error);
            }
          }
        });
      });
    });
  }
}

