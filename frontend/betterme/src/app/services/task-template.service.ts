import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';
import { Task } from '../models/task.model';

export interface TaskTemplate {
  id: number;
  name: string;
  description?: string;
  title: string;
  taskDescription?: string;
  category: string;
  priority: number;
  estimatedDurationMinutes?: number;
  difficulty?: string;
  isRecurring: boolean;
  recurrencePattern: string;
  recurrenceInterval: number;
  tags: string[];
  createdAt: string;
  lastUsedAt?: string;
  useCount: number;
  isFavorite: boolean;
}

export interface CreateTaskTemplateRequest {
  name: string;
  description?: string;
  title: string;
  taskDescription?: string;
  category?: string;
  priority?: number;
  estimatedDurationMinutes?: number;
  difficulty?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  tags?: string[];
}

export interface UpdateTaskTemplateRequest {
  name?: string;
  description?: string;
  title?: string;
  taskDescription?: string;
  category?: string;
  priority?: number;
  estimatedDurationMinutes?: number;
  difficulty?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  tags?: string[];
  isFavorite?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TaskTemplateService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/tasktemplate`;

  private authHeaders(): { headers: { [key: string]: string } } {
    const token = this.authService.getToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  createTemplate(request: CreateTaskTemplateRequest): Observable<TaskTemplate> {
    return this.http.post<TaskTemplate>(`${this.apiUrl}`, request, this.authHeaders());
  }

  getAllTemplates(): Observable<TaskTemplate[]> {
    return this.http.get<TaskTemplate[]>(`${this.apiUrl}`, this.authHeaders());
  }

  getFavoriteTemplates(): Observable<TaskTemplate[]> {
    return this.http.get<TaskTemplate[]>(`${this.apiUrl}/favorites`, this.authHeaders());
  }

  getTemplateById(id: number): Observable<TaskTemplate> {
    return this.http.get<TaskTemplate>(`${this.apiUrl}/${id}`, this.authHeaders());
  }

  updateTemplate(id: number, request: UpdateTaskTemplateRequest): Observable<TaskTemplate> {
    return this.http.put<TaskTemplate>(`${this.apiUrl}/${id}`, request, this.authHeaders());
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.authHeaders());
  }

  createTaskFromTemplate(templateId: number, dueDate?: Date): Observable<Task> {
    const body = dueDate ? { dueDate: dueDate.toISOString() } : {};
    return this.http.post<Task>(`${this.apiUrl}/${templateId}/create-task`, body, this.authHeaders());
  }

  toggleFavorite(id: number): Observable<TaskTemplate> {
    return this.http.post<TaskTemplate>(`${this.apiUrl}/${id}/toggle-favorite`, {}, this.authHeaders());
  }
}

