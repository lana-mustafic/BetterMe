import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task, UpdateTaskRequest } from '../../models/task.model';

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="edit-task-container">
        <div class="edit-task-header">
          <h1>Edit Task</h1>
          <a routerLink="/tasks" class="btn btn-secondary">← Back to Tasks</a>
        </div>

        @if (isLoading && !task) {
          <div class="loading">Loading task...</div>
        }

        @if (errorMessage) {
          <div class="error-message">{{ errorMessage }}</div>
        }

        @if (task) {
          <div class="edit-task-form">
            <form (ngSubmit)="onUpdateTask()">
              <div class="form-group">
                <label class="form-label">Title</label>
                <input 
                  type="text" 
                  class="form-control"
                  placeholder="Task title"
                  [(ngModel)]="editData.title"
                  name="title"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea 
                  class="form-control"
                  placeholder="Task description"
                  [(ngModel)]="editData.description"
                  name="description"
                  rows="4"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Due Date</label>
                  <input 
                    type="date" 
                    class="form-control"
                    [value]="getDueDateForInput()"
                    (input)="onDueDateChange($any($event.target).value)"
                    name="dueDate"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select 
                    class="form-control"
                    [(ngModel)]="editData.priority"
                    name="priority"
                  >
                    <option [ngValue]="1">Low</option>
                    <option [ngValue]="2">Medium</option>
                    <option [ngValue]="3">High</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox"
                    [(ngModel)]="editData.completed"
                    name="completed"
                  />
                  <span class="checkmark"></span>
                  Mark as completed
                </label>
              </div>

              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  [disabled]="isLoading"
                >
                  {{ isLoading ? 'Updating...' : 'Update Task' }}
                </button>
                <button 
                  type="button" 
                  class="btn btn-secondary"
                  (click)="onCancel()"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  class="btn btn-danger"
                  (click)="onDeleteTask()"
                >
                  Delete Task
                </button>
              </div>
            </form>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .edit-task-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }

    .edit-task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .edit-task-header h1 {
      color: #333;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0;
    }

    .edit-task-form {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #555;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: 600;
      color: #555;
    }

    .checkbox-label input {
      margin-right: 0.5rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #667eea;
      font-weight: 600;
      font-size: 1.1rem;
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

    @media (max-width: 768px) {
      .edit-task-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .edit-task-header h1 {
        font-size: 2rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class EditTaskComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);

  taskId: number = 0;
  task: Task | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  editData: UpdateTaskRequest = {
    title: '',
    description: '',
    dueDate: null,
    priority: 1,
    completed: false
  };

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.taskId = parseInt(params['id'], 10);
      this.loadTask();
    });
  }

  loadTask(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTaskById(this.taskId).subscribe({
      next: (task: Task) => {
        this.task = task;
        this.editData = {
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ? task.dueDate.toString() : null,
          priority: task.priority,
          completed: task.completed
        };
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load task. Please try again.';
        this.isLoading = false;
        console.error('Error loading task:', error);
      }
    });
  }

  private getPriorityNumber(priority: string): number {
    switch (priority) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 1;
    }
  }

  getDueDateForInput(): string {
    if (!this.editData.dueDate) return '';
    
    const date = new Date(this.editData.dueDate);
    return date.toISOString().split('T')[0];
  }

  onDueDateChange(value: string): void {
    this.editData.dueDate = value ? value : null;
  }

  onUpdateTask(): void {
    if (!this.editData.title?.trim()) {
      this.errorMessage = 'Task title is required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.updateTask(this.taskId, this.editData).subscribe({
      next: (updatedTask: Task) => {
        this.isLoading = false;
        this.router.navigate(['/tasks']);
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to update task. Please try again.';
        this.isLoading = false;
        console.error('Error updating task:', error);
      }
    });
  }

  onDeleteTask(): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(this.taskId).subscribe({
        next: () => {
          this.router.navigate(['/tasks']);
        },
        error: (error: any) => {
          this.errorMessage = 'Failed to delete task. Please try again.';
          console.error('Error deleting task:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/tasks']);
  }
}