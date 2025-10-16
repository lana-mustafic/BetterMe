import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, switchMap, tap, catchError, throwError } from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';
import { AuthService } from './auth'; // Fixed import - from './auth' not './auth.service'

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
  
  private apiUrl = 'http://localhost:5051/api';

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError('getTasks', error))
    );
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError('getTaskById', error))
    );
  }

  createTask(taskData: CreateTaskRequest): Observable<Task> {
    console.log('🔧 [TaskService] Creating task with data:', taskData);
    console.log('🔧 [TaskService] Auth token:', this.authService.getToken() ? 'Present' : 'Missing');
    
    return this.http.post<Task>(`${this.apiUrl}/tasks`, taskData, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      tap(response => {
        console.log('✅ [TaskService] Task created successfully:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ [TaskService] Task creation failed!');
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Full error:', error);
        
        // Check if it's a CORS error
        if (error.status === 0) {
          console.error('❌ This looks like a CORS or network error');
        }
        
        // Check if it's an authentication error
        if (error.status === 401) {
          console.error('❌ Authentication failed - token might be invalid');
        }
        
        return throwError(() => this.createApiError(error));
      })
    );
  }

  updateTask(id: number, taskData: UpdateTaskRequest): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}`, taskData, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError('updateTask', error))
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError('deleteTask', error))
    );
  }

 toggleTaskCompletion(id: number): Observable<Task> {
  return this.getTaskById(id).pipe(
    switchMap(currentTask => {
      if (currentTask.completed) {
        // Mark as incomplete
        return this.updateTask(id, { completed: false });
      } else {
        // Mark as complete
        if (currentTask.isRecurring) {
          // For recurring tasks, complete the instance
          const completionDate = new Date().toISOString();
          return this.completeRecurringInstance(id, completionDate);
        } else {
          // For non-recurring tasks, just mark as completed
          return this.updateTask(id, { completed: true });
        }
      }
    }),
    catchError((error: HttpErrorResponse) => this.handleError('toggleTaskCompletion', error))
  );
}

  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    console.error(`❌ [TaskService] ${operation} failed:`, error);
    return throwError(() => this.createApiError(error));
  }

  private createApiError(error: HttpErrorResponse): ApiError {
    let userMessage = 'An unexpected error occurred';
    
    if (error.status === 0) {
      userMessage = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 401) {
      userMessage = 'Authentication failed. Please log in again.';
    } else if (error.status === 404) {
      userMessage = 'Task not found.';
    } else if (error.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    }
    
    return {
      message: userMessage,
      originalError: error
    };
  }
  // Add these methods to your TaskService class:

completeRecurringInstance(taskId: number, completionDate: string): Observable<Task> {
  return this.http.post<Task>(`${this.apiUrl}/tasks/${taskId}/complete-instance`, {
    completionDate
  }, {
    headers: {
      'Authorization': `Bearer ${this.authService.getToken()}`
    }
  }).pipe(
    catchError((error: HttpErrorResponse) => this.handleError('completeRecurringInstance', error))
  );
}

getHabitStreak(taskId: number): Observable<number> {
  return this.http.get<number>(`${this.apiUrl}/tasks/${taskId}/streak`, {
    headers: {
      'Authorization': `Bearer ${this.authService.getToken()}`
    }
  }).pipe(
    catchError((error: HttpErrorResponse) => this.handleError('getHabitStreak', error))
  );
}

generateRecurringInstances(): Observable<Task[]> {
  return this.http.post<Task[]>(`${this.apiUrl}/tasks/generate-recurring`, {}, {
    headers: {
      'Authorization': `Bearer ${this.authService.getToken()}`
    }
  }).pipe(
    catchError((error: HttpErrorResponse) => this.handleError('generateRecurringInstances', error))
  );
}
}