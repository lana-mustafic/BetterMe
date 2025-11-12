import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Task, TaskCategory } from '../../models/task.model';

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
            
            <!-- Smart Category Display -->
            @if (task.category) {
              <div class="task-category">
                <strong>Category:</strong> 
                <span 
                  class="category-badge" 
                  [style.background]="getCategoryColor(task.category)"
                  [style.border-color]="getCategoryColor(task.category)"
                >
                  <span class="category-icon">{{ getCategoryIcon(task.category) }}</span>
                  {{ task.category }}
                </span>
              </div>
            }
            
            <p class="task-description">{{ task.description || 'No description provided' }}</p>
            
            <!-- Smart Tags Display -->
            @if (task.tags && task.tags.length > 0) {
              <div class="task-tags">
                <strong>Tags:</strong>
                <div class="tags-container">
                  @for (tag of task.tags; track tag) {
                    <span class="tag" [style.background]="getTagColor(tag)">{{ tag }}</span>
                  }
                </div>
              </div>
            }
            
            <!-- Smart Properties Section -->
            <div class="smart-properties-section">
              <h4>🎯 Smart Properties</h4>
              <div class="properties-grid">
                <!-- Priority -->
                <div class="property-card">
                  <div class="property-icon">🔥</div>
                  <div class="property-content">
                    <div class="property-label">Priority</div>
                    <div class="property-value" [class]="'priority-' + task.priority">
                      @if (task.priority === 3) {
                        High Priority
                      } @else if (task.priority === 2) {
                        Medium Priority
                      } @else {
                        Low Priority
                      }
                    </div>
                  </div>
                </div>

                <!-- Context -->
                <div class="property-card">
                  <div class="property-icon">{{ getContextIcon(getTaskContext(task)) }}</div>
                  <div class="property-content">
                    <div class="property-label">Context</div>
                    <div class="property-value">{{ getContextDisplayName(getTaskContext(task)) }}</div>
                  </div>
                </div>

                <!-- Estimated Duration -->
                @if (task.estimatedDuration) {
                  <div class="property-card">
                    <div class="property-icon">⏱️</div>
                    <div class="property-content">
                      <div class="property-label">Duration</div>
                      <div class="property-value">{{ task.estimatedDuration }} min</div>
                    </div>
                  </div>
                }

                <!-- Difficulty -->
                <div class="property-card">
                  <div class="property-icon">{{ getDifficultyIcon(task.difficulty) }}</div>
                  <div class="property-content">
                    <div class="property-label">Difficulty</div>
                    <div class="property-value" [class]="'difficulty-' + task.difficulty">
                      {{ formatDifficulty(task.difficulty) }}
                    </div>
                  </div>
                </div>

                <!-- Energy Level -->
                <div class="property-card">
                  <div class="property-icon">⚡</div>
                  <div class="property-content">
                    <div class="property-label">Energy</div>
                    <div class="property-value">
                      {{ getEnergyLevel(task) }}
                    </div>
                  </div>
                </div>

                <!-- Focus Required -->
                <div class="property-card">
                  <div class="property-icon">🎯</div>
                  <div class="property-content">
                    <div class="property-label">Focus</div>
                    <div class="property-value">
                      {{ getFocusLevel(task) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="task-meta">
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

            <!-- Smart Features Section -->
            <div class="smart-features-section">
              <h4>✨ Smart Features</h4>
              
              <!-- Recurring Task Info -->
              @if (task.isRecurring) {
                <div class="feature-item">
                  <div class="feature-icon">🔄</div>
                  <div class="feature-content">
                    <div class="feature-title">Recurring Task</div>
                    <div class="feature-description">
                      {{ formatRecurrencePattern(task.recurrencePattern) }} every {{ task.recurrenceInterval }} {{ task.recurrencePattern }}(s)
                    </div>
                    @if (task.streakCount && task.streakCount > 0) {
                      <div class="streak-info">
                        <span class="streak-badge">🔥 {{ task.streakCount }} day streak</span>
                        @if (task.lastCompletedDate) {
                          <span class="streak-date">Last completed: {{ formatRelativeDate(task.lastCompletedDate) }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
              
              <!-- Completion Stats -->
              @if (task.completionCount && task.completionCount > 0) {
                <div class="feature-item">
                  <div class="feature-icon">📈</div>
                  <div class="feature-content">
                    <div class="feature-title">Completion Stats</div>
                    <div class="feature-description">
                      Completed {{ task.completionCount }} times
                    </div>
                  </div>
                </div>
              }

              <!-- Next Occurrence -->
              @if (task.nextOccurrence && task.isRecurring) {
                <div class="feature-item">
                  <div class="feature-icon">📅</div>
                  <div class="feature-content">
                    <div class="feature-title">Next Occurrence</div>
                    <div class="feature-description">
                      {{ formatDate(task.nextOccurrence) }}
                      <span class="relative-date">({{ formatRelativeDate(task.nextOccurrence) }})</span>
                    </div>
                  </div>
                </div>
              }

              <!-- Smart Insights -->
              <div class="feature-item">
                <div class="feature-icon">💡</div>
                <div class="feature-content">
                  <div class="feature-title">Smart Insights</div>
                  <div class="feature-description">
                    @if (getOptimalTime(task)) {
                      <div class="insight">🕒 Best time: {{ getOptimalTime(task) }}</div>
                    }
                    @if (getProductivityTip(task)) {
                      <div class="insight">💪 Tip: {{ getProductivityTip(task) }}</div>
                    }
                  </div>
                </div>
              </div>
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
      max-width: 800px;
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
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
      border-left: 6px solid #667eea;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .task-header h3 {
      color: #2d3748;
      font-size: 2rem;
      font-weight: 800;
      margin: 0;
      flex: 1;
      line-height: 1.2;
    }

    .task-status {
      padding: 0.75rem 1.5rem;
      border-radius: 25px;
      font-weight: 700;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .task-status.completed {
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      color: white;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.3);
    }

    .task-status:not(.completed) {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
    }

    /* Smart Category Display */
    .task-category {
      margin-bottom: 1.5rem;
    }
    
    .category-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      padding: 0.6rem 1.2rem;
      border-radius: 25px;
      font-size: 0.9rem;
      font-weight: 700;
      margin-left: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    .category-badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    
    .category-icon {
      font-size: 1rem;
    }
    
    /* Smart Tags Display */
    .task-tags {
      margin-bottom: 2rem;
    }
    
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }
    
    .tag {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 15px;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .tag:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .task-description {
      color: #4a5568;
      line-height: 1.7;
      font-size: 1.15rem;
      margin-bottom: 2.5rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      border-left: 4px solid #cbd5e0;
    }

    /* Smart Properties Section */
    .smart-properties-section {
      margin-bottom: 2.5rem;
    }

    .smart-properties-section h4 {
      color: #2d3748;
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .property-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .property-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .property-icon {
      font-size: 1.5rem;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 12px;
      color: white;
    }

    .property-content {
      flex: 1;
    }

    .property-label {
      font-size: 0.8rem;
      color: #718096;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .property-value {
      font-size: 1rem;
      font-weight: 700;
      color: #2d3748;
    }

    /* Priority Styles */
    .priority-3 {
      color: #e53e3e;
    }

    .priority-2 {
      color: #dd6b20;
    }

    .priority-1 {
      color: #38a169;
    }

    /* Difficulty Styles */
    .difficulty-easy {
      color: #38a169;
    }

    .difficulty-medium {
      color: #d69e2e;
    }

    .difficulty-hard {
      color: #e53e3e;
    }

    .task-meta {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2.5rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }

    .meta-item {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      font-size: 1rem;
    }

    .meta-item strong {
      color: #4a5568;
      min-width: 100px;
    }

    .overdue {
      color: #e53e3e;
      font-weight: 600;
    }

    .overdue-badge {
      background: #e53e3e;
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 15px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-left: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Smart Features Section */
    .smart-features-section {
      background: linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2.5rem;
      border: 1px solid #c3dafe;
    }

    .smart-features-section h4 {
      color: #2d3748;
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      background: white;
      border-radius: 12px;
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
    }

    .feature-item:hover {
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .feature-item:last-child {
      margin-bottom: 0;
    }

    .feature-icon {
      font-size: 1.5rem;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 12px;
      color: white;
      flex-shrink: 0;
    }

    .feature-content {
      flex: 1;
    }

    .feature-title {
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }

    .feature-description {
      color: #4a5568;
      line-height: 1.5;
    }

    .streak-info {
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .streak-badge {
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .streak-date, .relative-date {
      font-size: 0.85rem;
      color: #718096;
      font-style: italic;
    }

    .insight {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: #f7fafc;
      border-radius: 8px;
      border-left: 3px solid #667eea;
      font-size: 0.9rem;
    }

    .task-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 14px 28px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      flex: 1;
      min-width: 140px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: linear-gradient(135deg, #718096, #4a5568);
      color: white;
      box-shadow: 0 4px 15px rgba(113, 128, 150, 0.3);
    }

    .btn-danger {
      background: linear-gradient(135deg, #e53e3e, #c53030);
      color: white;
      box-shadow: 0 4px 15px rgba(229, 62, 62, 0.3);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #667eea;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      background: linear-gradient(135deg, #fed7d7, #feb2b2);
      color: #c53030;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      text-align: center;
      border: 1px solid #fc8181;
      font-weight: 600;
    }

    .btn-retry {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      margin-left: 1rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-retry:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .no-task {
      text-align: center;
      padding: 4rem;
      color: #718096;
      font-size: 1.1rem;
    }

    .btn-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
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

      .properties-grid {
        grid-template-columns: 1fr;
      }

      .feature-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .streak-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .meta-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .meta-item strong {
        min-width: auto;
      }
    }

    @media (max-width: 480px) {
      .task-card {
        padding: 1.5rem;
      }
      
      .smart-features-section {
        padding: 1.5rem;
      }
      
      .task-header h3 {
        font-size: 1.6rem;
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
  smartCategories: TaskCategory[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.taskId = parseInt(id, 10);
        if (!isNaN(this.taskId)) {
          this.loadTask();
          this.initializeSmartFeatures();
        } else {
          this.errorMessage = 'Invalid task ID';
        }
      }
    });
  }

  initializeSmartFeatures(): void {
    this.smartCategories = this.taskService.getSmartCategories();
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

  // Smart Feature Methods
  getCategoryColor(categoryName: string): string {
    const category = this.smartCategories.find(c => c.name === categoryName);
    return category ? category.color : '#6c757d';
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.smartCategories.find(c => c.name === categoryName);
    return category ? category.icon : '📦';
  }

  getTagColor(tagName: string): string {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #30cfd0, #330867)'
    ];
    const index = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  getTaskContext(task: Task): string {
    if (task.tags) {
      if (task.tags.includes('home') || task.tags.includes('personal')) return 'home';
      if (task.tags.includes('work') || task.tags.includes('office')) return 'work';
      if (task.tags.includes('errands') || task.tags.includes('shopping')) return 'errands';
      if (task.tags.includes('calls') || task.tags.includes('phone')) return 'calls';
      if (task.tags.includes('computer') || task.tags.includes('digital')) return 'computer';
    }
    
    if (task.category) {
      const categoryLower = task.category.toLowerCase();
      if (categoryLower.includes('personal') || categoryLower.includes('home')) return 'home';
      if (categoryLower.includes('work') || categoryLower.includes('business')) return 'work';
      if (categoryLower.includes('shopping') || categoryLower.includes('errands')) return 'errands';
    }
    
    return 'other';
  }

  getContextDisplayName(context: string): string {
    const contextMap: { [key: string]: string } = {
      'home': 'Home',
      'work': 'Work',
      'errands': 'Errands',
      'calls': 'Calls',
      'computer': 'Computer',
      'other': 'Other'
    };
    return contextMap[context] || context;
  }

  getContextIcon(context: string): string {
    const contextIcons: { [key: string]: string } = {
      'home': '🏠',
      'work': '💼',
      'errands': '🛒',
      'calls': '📞',
      'computer': '💻',
      'other': '📦'
    };
    return contextIcons[context] || '📦';
  }

  getDifficultyIcon(difficulty: string): string {
    const difficultyIcons: { [key: string]: string } = {
      'easy': '😊',
      'medium': '😐',
      'hard': '😰'
    };
    return difficultyIcons[difficulty] || '😐';
  }

  getEnergyLevel(task: Task): string {
    if (task.tags?.includes('high-energy') || task.priority === 3) return 'High Energy';
    if (task.tags?.includes('low-energy') || task.priority === 1) return 'Low Energy';
    if (task.estimatedDuration && task.estimatedDuration > 60) return 'High Energy';
    return 'Medium Energy';
  }

  getFocusLevel(task: Task): string {
    if (task.tags?.includes('deep-focus') || task.difficulty === 'hard') return 'Deep Focus';
    if (task.tags?.includes('light-focus') || task.difficulty === 'easy') return 'Light Focus';
    return 'Medium Focus';
  }

  getOptimalTime(task: Task): string {
    if (task.tags?.includes('morning')) return 'Morning';
    if (task.tags?.includes('evening')) return 'Evening';
    if (task.estimatedDuration && task.estimatedDuration <= 15) return 'Any time (Quick)';
    if (task.difficulty === 'hard') return 'Morning (High energy)';
    return 'Afternoon';
  }

  getProductivityTip(task: Task): string {
    if (task.estimatedDuration && task.estimatedDuration > 120) return 'Break into smaller chunks';
    if (task.tags?.includes('procrastination')) return 'Start with 5-minute commitment';
    if (task.difficulty === 'hard') return 'Schedule for high-energy periods';
    return 'Pair with similar context tasks';
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatRelativeDate(date: string | Date): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  }

  formatRecurrencePattern(pattern: string): string {
    const patternMap: { [key: string]: string } = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'yearly': 'Yearly',
      'none': 'Not recurring'
    };
    
    return patternMap[pattern] || pattern;
  }

  formatDifficulty(difficulty: string): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
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