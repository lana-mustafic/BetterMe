import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, tap, catchError, throwError } from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';
import { AuthService } from './auth';
import { environment } from '../../environments/environment'; // ✅ correct import

interface ApiError {
  message: string;
  originalError: HttpErrorResponse;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(err => this.handleError('getTasks', err))
    );
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(err => this.handleError('getTaskById', err))
    );
  }

  createTask(taskData: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, taskData, {
      headers: this.authHeaders()
    }).pipe(
      tap(task => console.log('✅ Task created:', task)),
      catchError(err => this.handleError('createTask', err))
    );
  }

  updateTask(id: number, taskData: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, taskData, {
      headers: this.authHeaders()
    }).pipe(
      catchError(err => this.handleError('updateTask', err))
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(err => this.handleError('deleteTask', err))
    );
  }

  toggleTaskCompletion(id: number): Observable<Task> {
    return this.getTaskById(id).pipe(
      switchMap(task => {
        if (task.isRecurring) {
          // Recurring streak update
          return this.completeRecurringInstance(id, new Date().toISOString());
        }
        return this.updateTask(id, { completed: !task.completed });
      }),
      catchError(err => this.handleError('toggleTaskCompletion', err))
    );
  }

  completeRecurringInstance(taskId: number, completionDate: string): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks/${taskId}/complete-instance`, { completionDate }, {
      headers: this.authHeaders()
    }).pipe(
      catchError(err => this.handleError('completeRecurringInstance', err))
    );
  }

  getHabitStreak(taskId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/tasks/${taskId}/streak`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(err => this.handleError('getHabitStreak', err))
    );
  }

  generateRecurringInstances(): Observable<Task[]> {
    return this.http.post<Task[]>(`${this.apiUrl}/tasks/generate-recurring`, {}, {
      headers: this.authHeaders()
    }).pipe(
      catchError(err => this.handleError('generateRecurringInstances', err))
    );
  }

  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    console.error(`❌ TaskService.${operation}`, error);

    let message = 'Unexpected error occurred.';
    if (error.status === 0) message = 'Cannot reach server.';
    if (error.status === 401) message = 'You must log in again.';
    if (error.status === 403) message = 'You are not allowed to do this.';
    if (error.status === 404) message = 'Task not found.';
    if (error.status >= 500) message = 'Server error. Try again later.';

    return throwError(() => ({ message, originalError: error } as ApiError));
  }
}
