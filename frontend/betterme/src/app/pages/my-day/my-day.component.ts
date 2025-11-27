import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-my-day',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="my-day-page">
      <!-- Background Animation -->
      <div class="background-animation">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
      </div>

      <div class="container">
        <div class="my-day-container">
          <!-- Header -->
          <div class="my-day-header glass-card">
            <div class="header-content">
              <h1 class="gradient-text">My Day</h1>
              <p class="subtitle">{{ getTodayDate() }}</p>
            </div>
            <div class="header-stats">
              <div class="stat-item">
                <div class="stat-number">{{ completedCount }}</div>
                <div class="stat-label">Completed</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ myDayTasks.length }}</div>
                <div class="stat-label">Total</div>
              </div>
            </div>
          </div>

          <!-- Progress Indicator -->
          <div class="progress-section glass-card">
            <div class="progress-header">
              <h3>Today's Progress</h3>
              <span class="progress-percentage">{{ getProgressPercentage() }}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" [style.width.%]="getProgressPercentage()"></div>
            </div>
            <div class="progress-text">
              {{ completedCount }} of {{ myDayTasks.length }} tasks completed
            </div>
          </div>

          <!-- Suggested Tasks -->
          @if (suggestedTasks.length > 0 && showSuggestions) {
            <div class="suggestions-section glass-card">
              <div class="section-header">
                <h3>💡 Suggested for Today</h3>
                <button class="btn-toggle" (click)="showSuggestions = false">Hide</button>
              </div>
              <div class="suggested-tasks-list">
                @for (task of suggestedTasks; track task.id) {
                  <div class="suggested-task-item">
                    <div class="task-info">
                      <h4>{{ task.title }}</h4>
                      @if (task.dueDate) {
                        <span class="task-due">Due: {{ formatDate(task.dueDate) }}</span>
                      }
                      @if (task.priority === 3) {
                        <span class="priority-badge high">High Priority</span>
                      }
                    </div>
                    <button class="btn-add" (click)="addSuggestedTask(task.id)">
                      Add to My Day
                    </button>
                  </div>
                }
              </div>
            </div>
          }

          <!-- My Day Tasks List -->
          <div class="tasks-section">
            @if (isLoading) {
              <div class="loading glass-card">
                <div class="loading-spinner"></div>
                Loading your day...
              </div>
            } @else if (myDayTasks.length === 0) {
              <div class="empty-state glass-card">
                <div class="empty-icon">☀️</div>
                <h3>Your day is clear!</h3>
                <p>Add tasks to get started, or check out suggestions above.</p>
                <button class="btn btn-gradient" routerLink="/tasks">
                  Go to Tasks
                </button>
              </div>
            } @else {
              <div class="tasks-list">
                @for (task of myDayTasks; track task.id) {
                  <div class="task-item glass-card" [class.completed]="task.completed">
                    <div class="task-checkbox-container">
                      <input 
                        type="checkbox" 
                        [checked]="task.completed"
                        (change)="toggleTaskComplete(task.id)"
                        class="task-checkbox"
                      />
                      <span class="checkmark"></span>
                    </div>
                    <div class="task-content">
                      <h3 class="task-title" [class.completed]="task.completed">
                        {{ task.title }}
                      </h3>
                      @if (task.description) {
                        <p class="task-description">{{ task.description }}</p>
                      }
                      <div class="task-meta">
                        @if (task.dueDate) {
                          <span class="meta-item date" [class.overdue]="isOverdue(task.dueDate)">
                            📅 {{ formatDate(task.dueDate) }}
                          </span>
                        }
                        @if (task.priority === 3) {
                          <span class="meta-item priority high">🔥 High</span>
                        } @else if (task.priority === 2) {
                          <span class="meta-item priority medium">⚡ Medium</span>
                        }
                        @if (task.category) {
                          <span class="meta-item category">{{ task.category }}</span>
                        }
                      </div>
                    </div>
                    <div class="task-actions">
                      <button 
                        class="btn-action btn-remove" 
                        (click)="removeFromMyDay(task.id)"
                        title="Remove from My Day"
                      >
                        ✕
                      </button>
                      <button 
                        class="btn-action btn-view" 
                        [routerLink]="['/tasks', task.id]"
                        title="View Details"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-day-page {
      min-height: 100vh;
      background: var(--bg-gradient);
      position: relative;
      padding: 2rem 1rem;
      transition: background 0.3s ease;
    }

    .background-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    }

    .floating-shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 6s ease-in-out infinite;
      transition: background 0.3s ease;
    }

    body.dark-mode .floating-shape {
      background: rgba(255, 255, 255, 0.05);
    }

    .shape-1 {
      width: 200px;
      height: 200px;
      top: 10%;
      left: 5%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 150px;
      height: 150px;
      top: 60%;
      right: 10%;
      animation-delay: 2s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 1200px;
      margin: 0 auto;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
    }

    body.dark-mode .glass-card {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }

    .my-day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transition: background 0.3s ease;
    }

    body.dark-mode .header-content h1 {
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.2rem;
    }

    .header-stats {
      display: flex;
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 800;
      color: white;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 0.5rem;
    }

    .progress-section {
      margin-bottom: 2rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .progress-header h3 {
      color: white;
      margin: 0;
      font-size: 1.3rem;
    }

    .progress-percentage {
      font-size: 2rem;
      font-weight: 800;
      color: white;
    }

    .progress-bar-container {
      height: 12px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4ade80, #22d3ee);
      border-radius: 6px;
      transition: width 0.5s ease;
    }

    .progress-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .suggestions-section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h3 {
      color: white;
      margin: 0;
      font-size: 1.2rem;
    }

    .btn-toggle {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-toggle:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .suggested-tasks-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .suggested-task-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .task-info {
      flex: 1;
    }

    .task-info h4 {
      color: white;
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
    }

    .task-due {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      margin-right: 0.5rem;
    }

    .priority-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .priority-badge.high {
      background: rgba(239, 68, 68, 0.3);
      color: #fecaca;
    }

    .btn-add {
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-add:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      transition: all 0.3s;
    }

    .task-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }

    .task-item.completed {
      opacity: 0.7;
    }

    .task-checkbox-container {
      display: flex;
      align-items: center;
      cursor: pointer;
      margin-top: 0.25rem;
    }

    .task-checkbox {
      display: none;
    }

    .checkmark {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }

    .task-checkbox:checked + .checkmark {
      background: #4ade80;
      border-color: #4ade80;
    }

    .task-checkbox:checked + .checkmark::after {
      content: '✓';
      color: white;
      font-size: 14px;
      font-weight: bold;
    }

    .task-content {
      flex: 1;
    }

    .task-title {
      color: white;
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .task-title.completed {
      text-decoration: line-through;
      opacity: 0.8;
    }

    .task-description {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }

    .task-meta {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
    }

    .meta-item {
      padding: 0.4rem 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .meta-item.overdue {
      background: rgba(239, 68, 68, 0.3);
      color: #fecaca;
    }

    .meta-item.priority.high {
      background: rgba(239, 68, 68, 0.3);
      color: #fecaca;
    }

    .meta-item.priority.medium {
      background: rgba(245, 158, 11, 0.3);
      color: #fed7aa;
    }

    .task-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 1rem;
    }

    .btn-remove {
      background: rgba(239, 68, 68, 0.3);
      color: #fecaca;
    }

    .btn-remove:hover {
      background: rgba(239, 68, 68, 0.5);
    }

    .btn-view {
      background: rgba(59, 130, 246, 0.3);
      color: #93c5fd;
    }

    .btn-view:hover {
      background: rgba(59, 130, 246, 0.5);
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: white;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: white;
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
    }

    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-block;
    }

    .btn-gradient {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
    }

    .btn-gradient:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(74, 222, 128, 0.4);
    }

    @media (max-width: 768px) {
      .my-day-header {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }

      .header-stats {
        justify-content: center;
      }
    }
  `]
})
export class MyDayComponent implements OnInit {
  private taskService = inject(TaskService);

  myDayTasks: Task[] = [];
  suggestedTasks: Task[] = [];
  isLoading = false;
  showSuggestions = true;

  get completedCount(): number {
    return this.myDayTasks.filter(t => t.completed).length;
  }

  ngOnInit() {
    this.loadMyDayTasks();
    this.loadSuggestedTasks();
  }

  loadMyDayTasks() {
    this.isLoading = true;
    this.taskService.getMyDayTasks().subscribe({
      next: (tasks) => {
        this.myDayTasks = tasks;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading My Day tasks:', error);
        this.isLoading = false;
      }
    });
  }

  loadSuggestedTasks() {
    this.taskService.getSuggestedTasksForMyDay().subscribe({
      next: (tasks) => {
        this.suggestedTasks = tasks;
      },
      error: (error) => {
        console.error('Error loading suggested tasks:', error);
      }
    });
  }

  toggleTaskComplete(taskId: number) {
    const task = this.myDayTasks.find(t => t.id === taskId);
    if (!task) return;

    this.taskService.toggleTaskCompletion(taskId).subscribe({
      next: (updatedTask) => {
        const index = this.myDayTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          this.myDayTasks[index] = updatedTask;
        }
      },
      error: (error) => {
        console.error('Error toggling task completion:', error);
      }
    });
  }

  addSuggestedTask(taskId: number) {
    this.taskService.addTaskToMyDay(taskId).subscribe({
      next: (task) => {
        this.myDayTasks.push(task);
        this.suggestedTasks = this.suggestedTasks.filter(t => t.id !== taskId);
      },
      error: (error) => {
        console.error('Error adding task to My Day:', error);
      }
    });
  }

  removeFromMyDay(taskId: number) {
    this.taskService.removeTaskFromMyDay(taskId).subscribe({
      next: () => {
        this.myDayTasks = this.myDayTasks.filter(t => t.id !== taskId);
      },
      error: (error) => {
        console.error('Error removing task from My Day:', error);
      }
    });
  }

  getProgressPercentage(): number {
    if (this.myDayTasks.length === 0) return 0;
    return Math.round((this.completedCount / this.myDayTasks.length) * 100);
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (taskDate.getTime() === today.getTime() + 86400000) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  }

  isOverdue(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  }
}

