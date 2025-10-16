import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="task-detail">
        <div class="header-actions">
          <button class="btn btn-back" (click)="goBack()">← Back to Tasks</button>
        </div>
        
        <h2>Task Details</h2>
        
        @if (isLoading) {
          <div class="loading">
            <div class="spinner"></div>
            Loading task details...
          </div>
        }

        @if (errorMessage) {
          <div class="error-message">
            {{ errorMessage }}
            <button class="btn-retry" (click)="loadTask()">Retry</button>
          </div>
        }

        @if (task && !isLoading) {
          <div class="task-card">
            <div class="task-header">
              <h3>{{ task.title }}</h3>
              <span class="task-status" [class.completed]="task.completed">
                {{ task.completed ? '✅ Completed' : '⏳ Pending' }}
              </span>
            </div>
            
            <!-- NEW: Category Display -->
            @if (task.category) {
              <div class="task-category">
                <strong>Category:</strong> 
                <span class="category-badge">{{ task.category }}</span>
              </div>
            }
            
            <p class="task-description">{{ task.description || 'No description provided' }}</p>
            
            <!-- NEW: Tags Display -->
            @if (task.tags && task.tags.length > 0) {
              <div class="task-tags">
                <strong>Tags:</strong>
                <div class="tags-container">
                  @for (tag of task.tags; track tag) {
                    <span class="tag">{{ tag }}</span>
                  }
                </div>
              </div>
            }
            
           <div class="task-meta">
  <div class="meta-item">
    <strong>Priority:</strong> 
    @if (+task.priority === 3) {
      <span class="priority-high">High 🔥</span>
    } @else if (+task.priority === 2) {
      <span class="priority-medium">Medium ⚡</span>
    } @else {
      <span class="priority-low">Low</span>
    }
  </div>
              
              <div class="meta-item">
                <strong>Created:</strong> {{ formatDate(task.createdAt) }}
              </div>
              
              @if (task.updatedAt && task.updatedAt !== task.createdAt) {
                <div class="meta-item">
                  <strong>Updated:</strong> {{ formatDate(task.updatedAt) }}
                </div>
              }
              
              @if (task.dueDate) {
                <div class="meta-item">
                  <strong>Due Date:</strong> 
                  <span [class.overdue]="isOverdue(task.dueDate) && !task.completed">
                    {{ formatDate(task.dueDate) }}
                    @if (isOverdue(task.dueDate) && !task.completed) {
                      <span class="overdue-badge">OVERDUE</span>
                    }
                  </span>
                </div>
              }
              
              @if (task.completedAt) {
                <div class="meta-item">
                  <strong>Completed:</strong> {{ formatDate(task.completedAt) }}
                </div>
              }
            </div>
            
            <div class="task-actions">
              <button 
                class="btn btn-primary" 
                (click)="onToggleComplete()"
                [disabled]="isLoading"
              >
                @if (isLoading) {
                  <span class="btn-loading">Updating...</span>
                } @else {
                  {{ task.completed ? 'Mark as Pending' : 'Mark as Completed' }}
                }
              </button>
              <button 
                class="btn btn-secondary" 
                (click)="onEdit()"
                [disabled]="isLoading"
              >
                Edit Task
              </button>
              <button 
                class="btn btn-danger" 
                (click)="onDelete()"
                [disabled]="isLoading"
              >
                Delete Task
              </button>
            </div>
          </div>
        }

        @if (!task && !isLoading && !errorMessage) {
          <div class="no-task">
            <p>Task not found.</p>
            <button class="btn btn-primary" (click)="goBack()">Back to Tasks</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .task-detail {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
    }

    .header-actions {
      margin-bottom: 1rem;
    }

    .btn-back {
      background: #6c757d;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .task-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #667eea;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .task-header h3 {
      color: #333;
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0;
      flex: 1;
    }

    .task-status {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .task-status.completed {
      background: #d1edff;
      color: #0c5460;
    }

    .task-status:not(.completed) {
      background: #fff3cd;
      color: #856404;
    }

    /* NEW STYLES FOR CATEGORY AND TAGS */
    .task-category {
      margin-bottom: 1rem;
    }
    
    .category-badge {
      background: #667eea;
      color: white;
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }
    
    .task-tags {
      margin-bottom: 1.5rem;
    }
    
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .tag {
      background: #e9ecef;
      color: #495057;
      padding: 0.3rem 0.8rem;
      border-radius: 12px;
      font-size: 0.8rem;
      border: 1px solid #dee2e6;
    }

    .task-description {
      color: #666;
      line-height: 1.6;
      font-size: 1.1rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .task-meta {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .meta-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .priority-high {
      color: #e74c3c;
      font-weight: 600;
    }

    .priority-medium {
      color: #f39c12;
      font-weight: 600;
    }

    .priority-low {
      color: #27ae60;
      font-weight: 600;
    }

    .overdue {
      color: #e74c3c;
      font-weight: 600;
    }

    .overdue-badge {
      background: #e74c3c;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      margin-left: 8px;
    }

    .task-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #667eea;
      font-weight: 600;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      background: #fee;
      color: #c33;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      text-align: center;
      border: 1px solid #fcc;
    }

    .btn-retry {
      background: #667eea;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      margin-left: 1rem;
      cursor: pointer;
    }

    .no-task {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .task-header {
        flex-direction: column;
        gap: 1rem;
      }
      
      .task-actions {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
      }
    }
  `]
})
export class TaskDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);

  taskId: number = 0;
  task: Task | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.taskId = parseInt(id, 10);
        if (!isNaN(this.taskId)) {
          this.loadTask();
        } else {
          this.errorMessage = 'Invalid task ID';
        }
      }
    });
  }

  loadTask(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTaskById(this.taskId).subscribe({
      next: (task: Task) => {
        this.task = task;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = this.getErrorMessage(error);
        this.isLoading = false;
        console.error('Error loading task:', error);
      }
    });
  }

  onToggleComplete(): void {
    if (this.task) {
      this.isLoading = true;
      this.taskService.toggleTaskCompletion(this.taskId).subscribe({
        next: (updatedTask: Task) => {
          this.task = updatedTask;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.errorMessage = this.getErrorMessage(error);
          this.isLoading = false;
          console.error('Error updating task:', error);
        }
      });
    }
  }

  onEdit(): void {
    if (this.task) {
      this.router.navigate(['/tasks', this.taskId, 'edit']);
    }
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      this.isLoading = true;
      this.taskService.deleteTask(this.taskId).subscribe({
        next: () => {
          this.router.navigate(['/tasks']);
        },
        error: (error: any) => {
          this.errorMessage = this.getErrorMessage(error);
          this.isLoading = false;
          console.error('Error deleting task:', error);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }

 formatDate(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  // Your date formatting logic here
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

  isOverdue(dueDate: string | null | undefined): boolean {
    if (!dueDate) return false;
    try {
      return new Date(dueDate) < new Date() && !this.task?.completed;
    } catch (error) {
      return false;
    }
  }

  private getErrorMessage(error: any): string {
    if (error && error.message) {
      return error.message;
    }
    
    if (error?.status === 0) {
      return 'Unable to connect to server. Please check your connection.';
    } else if (error?.status === 401) {
      return 'Authentication failed. Please log in again.';
    } else if (error?.status === 404) {
      return 'Task not found.';
    } else if (error?.status === 403) {
      return 'You do not have permission to access this task.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
}