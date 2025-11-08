import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { Task, UpdateTaskRequest } from '../../models/task.model';

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="edit-task-page">
      <!-- Background Decoration -->
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="container">
        <div class="edit-task-container">
          <!-- Header Section -->
          <div class="edit-task-header">
            <div class="header-content">
              <h1 class="gradient-text">Edit Task</h1>
              <p class="subtitle">Update your task details and stay organized</p>
            </div>
            <a routerLink="/tasks" class="btn btn-back">
              <span class="btn-icon">←</span>
              Back to Tasks
            </a>
          </div>

          <!-- Main Edit Card -->
          <div class="edit-task-card glass-card">
            <!-- Loading State -->
            @if (isLoading && !task) {
              <div class="loading-section">
                <div class="loading-spinner">
                  <div class="spinner-ring"></div>
                </div>
                <p>Loading your task...</p>
              </div>
            }

            <!-- Error State -->
            @if (errorMessage) {
              <div class="error-card">
                <div class="error-icon">⚠️</div>
                <div class="error-content">
                  <h3>Something went wrong</h3>
                  <p>{{ errorMessage }}</p>
                </div>
                <button class="btn btn-outline" (click)="loadTask()">
                  Try Again
                </button>
              </div>
            }

            <!-- Edit Form -->
            @if (task) {
              <div class="edit-form">
                <form (ngSubmit)="onUpdateTask()">
                  <!-- Basic Information Section -->
                  <div class="form-section">
                    <h3 class="section-title">Basic Information</h3>
                    
                    <div class="form-group">
                      <label class="form-label">Task Title</label>
                      <input 
                        type="text" 
                        class="form-control"
                        placeholder="What needs to be done?"
                        [(ngModel)]="editData.title"
                        name="title"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Description</label>
                      <textarea 
                        class="form-control"
                        placeholder="Add more details about your task..."
                        [(ngModel)]="editData.description"
                        name="description"
                        rows="4"
                      ></textarea>
                    </div>
                  </div>

                  <!-- Schedule & Priority Section -->
                  <div class="form-section">
                    <h3 class="section-title">Schedule & Priority</h3>
                    
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
                        <label class="form-label">Priority Level</label>
                        <select 
                          class="form-control"
                          [(ngModel)]="editData.priority"
                          name="priority"
                        >
                          <option [ngValue]="1">📊 Low Priority</option>
                          <option [ngValue]="2">⚠️ Medium Priority</option>
                          <option [ngValue]="3">🚨 High Priority</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Recurrence Section -->
                  <div class="form-section">
                    <h3 class="section-title">Repeat Settings</h3>
                    
                    <div class="recurrence-options">
                      <label class="checkbox-card" [class.active]="editData.isRecurring">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="editData.isRecurring"
                          name="isRecurring"
                          (change)="onRecurrenceToggle()"
                        >
                        <div class="checkbox-content">
                          <span class="checkbox-icon">🔄</span>
                          <div class="checkbox-text">
                            <div class="checkbox-title">Repeat this task</div>
                            <div class="checkbox-description">Set up automatic repetition</div>
                          </div>
                        </div>
                      </label>
                      
                      @if (editData.isRecurring) {
                        <div class="recurrence-settings">
                          <div class="form-row">
                            <div class="form-group">
                              <label class="form-label">Repeat every</label>
                              <select 
                                class="form-control"
                                [(ngModel)]="editData.recurrenceInterval"
                                name="recurrenceInterval"
                              >
                                <option [ngValue]="1">1</option>
                                <option [ngValue]="2">2</option>
                                <option [ngValue]="3">3</option>
                                <option [ngValue]="4">4</option>
                                <option [ngValue]="5">5</option>
                                <option [ngValue]="6">6</option>
                                <option [ngValue]="7">7</option>
                              </select>
                            </div>
                            
                            <div class="form-group">
                              <label class="form-label">Time period</label>
                              <select 
                                class="form-control"
                                [(ngModel)]="editData.recurrencePattern"
                                name="recurrencePattern"
                              >
                                <option value="daily">Day(s)</option>
                                <option value="weekly">Week(s)</option>
                                <option value="monthly">Month(s)</option>
                                <option value="yearly">Year(s)</option>
                              </select>
                            </div>
                          </div>
                          <div class="recurrence-hint">
                            @if (editData.recurrenceInterval === 1) {
                              <span>🔁 Repeats every {{ editData.recurrencePattern?.slice(0, -2) }}</span>
                            } @else {
                              <span>🔁 Repeats every {{ editData.recurrenceInterval }} {{ editData.recurrencePattern?.slice(0, -2) }}s</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Status Section -->
                  <div class="form-section">
                    <h3 class="section-title">Task Status</h3>
                    
                    <label class="checkbox-card" [class.active]="editData.completed">
                      <input 
                        type="checkbox"
                        [(ngModel)]="editData.completed"
                        name="completed"
                      />
                      <div class="checkbox-content">
                        <span class="checkbox-icon">✅</span>
                        <div class="checkbox-text">
                          <div class="checkbox-title">Mark as completed</div>
                          <div class="checkbox-description">Task is finished and done</div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <!-- Actions Section -->
                  <div class="actions-section">
                    <div class="actions-grid">
                      <button 
                        type="submit" 
                        class="btn btn-primary"
                        [disabled]="isLoading"
                      >
                        <span class="btn-icon">💾</span>
                        {{ isLoading ? 'Updating Task...' : 'Update Task' }}
                      </button>
                      
                      <button 
                        type="button" 
                        class="btn btn-secondary"
                        (click)="onCancel()"
                        [disabled]="isLoading"
                      >
                        <span class="btn-icon">↩️</span>
                        Cancel
                      </button>
                      
                      <button 
                        type="button" 
                        class="btn btn-danger"
                        (click)="onDeleteTask()"
                        [disabled]="isLoading"
                      >
                        <span class="btn-icon">🗑️</span>
                        Delete Task
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .edit-task-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow-x: hidden;
    }

    .background-shapes {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
    }

    .shape-1 {
      width: 300px;
      height: 300px;
      top: -150px;
      right: -100px;
    }

    .shape-2 {
      width: 200px;
      height: 200px;
      bottom: 100px;
      left: -50px;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      right: 20%;
    }

    .container {
      position: relative;
      z-index: 1;
    }

    .edit-task-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .edit-task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 3rem;
    }

    .header-content h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.2rem;
      font-weight: 500;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .edit-task-card {
      min-height: 400px;
    }

    .form-section {
      margin-bottom: 2.5rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .form-section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
    }

    .section-title {
      color: white;
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.95rem;
    }

    .form-control {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      font-size: 16px;
      color: white;
      transition: all 0.3s ease;
    }

    .form-control::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .form-control:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    }

    .form-control option {
      background: #4a5568;
      color: white;
    }

    /* Checkbox Cards */
    .checkbox-card {
      display: block;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .checkbox-card.active {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.4);
      transform: translateY(-2px);
    }

    .checkbox-card input {
      display: none;
    }

    .checkbox-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .checkbox-icon {
      font-size: 1.5rem;
    }

    .checkbox-title {
      color: white;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .checkbox-description {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    /* Recurrence Styles */
    .recurrence-settings {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .recurrence-hint {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(102, 126, 234, 0.2);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      text-align: center;
      border: 1px solid rgba(102, 126, 234, 0.3);
    }

    /* Buttons */
    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      text-decoration: none;
    }

    .btn-back {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .btn-primary {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .btn-danger {
      background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Actions Section */
    .actions-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .actions-grid {
      display: flex;
      gap: 1rem;
    }

    /* Loading & Error States */
    .loading-section {
      text-align: center;
      padding: 4rem 2rem;
      color: white;
    }

    .loading-spinner {
      margin-bottom: 1.5rem;
    }

    .spinner-ring {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    .error-card {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-content h3 {
      color: white;
      margin-bottom: 0.5rem;
    }

    .error-content p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 1.5rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .edit-task-container {
        padding: 1rem 0.5rem;
      }

      .glass-card {
        padding: 2rem 1.5rem;
      }

      .edit-task-header {
        flex-direction: column;
        gap: 1.5rem;
        align-items: flex-start;
      }

      .header-content h1 {
        font-size: 2.5rem;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .actions-grid {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .glass-card {
        padding: 1.5rem 1rem;
        border-radius: 20px;
      }

      .header-content h1 {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .form-section {
        padding-bottom: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .checkbox-card {
        padding: 1.25rem;
      }

      .recurrence-settings {
        padding: 1.25rem;
      }
    }
  `]
})
export class EditTaskComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);
  private destroy$ = new Subject<void>();

  taskId: number = 0;
  task: Task | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  editData: UpdateTaskRequest = {
    title: '',
    description: '',
    dueDate: null,
    priority: 1,
    completed: false,
    isRecurring: false,
    recurrencePattern: 'daily',
    recurrenceInterval: 1
  };

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.taskId = parseInt(params['id'], 10);
        this.loadTask();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTask(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTaskById(this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task: Task) => {
          this.task = task;
          this.editData = {
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate ? task.dueDate.toString() : null,
            priority: task.priority,
            completed: task.completed,
            isRecurring: task.isRecurring || false,
            recurrencePattern: task.recurrencePattern || 'daily',
            recurrenceInterval: task.recurrenceInterval || 1
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

  onRecurrenceToggle(): void {
    if (!this.editData.isRecurring) {
      // Reset recurrence settings when turning off recurrence
      this.editData.recurrencePattern = 'daily';
      this.editData.recurrenceInterval = 1;
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

    this.taskService.updateTask(this.taskId, this.editData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      this.taskService.deleteTask(this.taskId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
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