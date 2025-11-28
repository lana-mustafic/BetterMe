import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { 
  SharedTask, 
  ShareTaskRequest, 
  SharePermission,
  TaskComment,
  CreateCommentRequest,
  TaskActivity,
  AssignTaskRequest
} from '../models/collaboration.model';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/collaboration`;

  // Sharing methods
  shareTask(request: ShareTaskRequest): Observable<{ message: string; shareId: number }> {
    return this.http.post<{ message: string; shareId: number }>(
      `${this.apiUrl}/tasks/${request.taskId}/share`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  unshareTask(taskId: number, sharedWithUserId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/tasks/${taskId}/share/${sharedWithUserId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  getSharedTasks(): Observable<SharedTask[]> {
    return this.http.get<SharedTask[]>(`${this.apiUrl}/tasks/shared`).pipe(
      catchError(this.handleError)
    );
  }

  getTaskShares(taskId: number): Observable<SharedTask[]> {
    return this.http.get<SharedTask[]>(`${this.apiUrl}/tasks/${taskId}/shares`).pipe(
      catchError(this.handleError)
    );
  }

  // Assignment methods
  assignTask(taskId: number, request: AssignTaskRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/tasks/${taskId}/assign`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Comment methods
  createComment(taskId: number, request: CreateCommentRequest): Observable<TaskComment> {
    return this.http.post<TaskComment>(
      `${this.apiUrl}/tasks/${taskId}/comments`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  getComments(taskId: number): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(
      `${this.apiUrl}/tasks/${taskId}/comments`
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateComment(commentId: number, content: string): Observable<TaskComment> {
    return this.http.put<TaskComment>(
      `${this.apiUrl}/comments/${commentId}`,
      { content }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Activity methods
  getActivities(taskId: number): Observable<TaskActivity[]> {
    return this.http.get<TaskActivity[]>(
      `${this.apiUrl}/tasks/${taskId}/activities`
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('CollaborationService error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

