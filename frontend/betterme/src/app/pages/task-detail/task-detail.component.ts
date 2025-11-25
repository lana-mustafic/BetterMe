import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Task, TaskCategory } from '../../models/task.model';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="task-detail-page">
      <!-- Animated Background -->
      <div class="background-animation">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
        <div class="floating-shape shape-4"></div>
      </div>

      <div class="container">
        <div class="task-detail">
          <!-- Header with Back Button -->
          <div class="header-section">
            <a routerLink="/tasks" class="btn btn-back glass-card">
              <span class="btn-icon">←</span>
              Back to Tasks
            </a>
            <h1 class="page-title gradient-text">Task Details</h1>
          </div>

          <!-- Loading State -->
          @if (isLoading) {
            <div class="loading glass-card">
              <div class="loading-spinner"></div>
              <p>Loading task details...</p>
            </div>
          }

          <!-- Error State -->
          @if (errorMessage) {
            <div class="error-message glass-card">
              <div class="error-content">
                <span class="error-icon">⚠️</span>
                <div class="error-text">
                  <h3>Oops! Something went wrong</h3>
                  <p>{{ errorMessage }}</p>
                </div>
                <button class="btn btn-retry" (click)="loadTask()">
                  <span class="btn-icon">🔄</span>
                  Try Again
                </button>
              </div>
            </div>
          }

          <!-- Task Content -->
          @if (task && !isLoading) {
            <div class="task-content">
              <!-- Main Task Card -->
              <div class="task-main glass-card">
                <!-- Task Header -->
                <div class="task-header">
                  <div class="task-title-section">
                    <h2 class="task-title">{{ task.title }}</h2>
                    <span class="task-status" [class.completed]="task.completed">
                      {{ task.completed ? '✅ Completed' : '⏳ Pending' }}
                    </span>
                  </div>
                  
                  <!-- Quick Actions -->
                  <div class="quick-actions">
                    <button 
                      class="btn-action complete-btn" 
                      (click)="onToggleComplete()"
                      [class.completed]="task.completed"
                      [disabled]="isLoading"
                    >
                      {{ task.completed ? '↶' : '✓' }}
                    </button>
                    <button 
                      class="btn-action edit-btn" 
                      (click)="onEdit()"
                      [disabled]="isLoading"
                    >
                      ✏️
                    </button>
                  </div>
                </div>

                <!-- Category & Tags -->
                <div class="task-meta-top">
                  @if (task.category) {
                    <div class="category-section">
                      <span class="meta-label">Category</span>
                      <span 
                        class="category-badge" 
                        [style.background]="getCategoryColor(task.category)"
                      >
                        <span class="category-icon">{{ getCategoryIcon(task.category) }}</span>
                        {{ task.category }}
                      </span>
                    </div>
                  }
                  
                  @if (task.tags && task.tags.length > 0) {
                    <div class="tags-section">
                      <span class="meta-label">Tags</span>
                      <div class="tags-container">
                        @for (tag of task.tags; track tag) {
                          <span class="tag" [style.background]="getTagColor(tag)">
                            {{ tag }}
                          </span>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Description -->
                <div class="description-section">
                  <h3 class="section-title">Description</h3>
                  <p class="task-description">{{ task.description || 'No description provided' }}</p>
                </div>

                <!-- Smart Properties Grid -->
                <div class="properties-section">
                  <h3 class="section-title">🎯 Smart Properties</h3>
                  <div class="properties-grid">
                    <!-- Priority -->
                    <div class="property-card glass-card" [class]="'priority-' + task.priority">
                      <div class="property-icon">🔥</div>
                      <div class="property-content">
                        <div class="property-label">Priority</div>
                        <div class="property-value">
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
                    <div class="property-card glass-card">
                      <div class="property-icon">{{ getContextIcon(getTaskContext(task)) }}</div>
                      <div class="property-content">
                        <div class="property-label">Context</div>
                        <div class="property-value">{{ getContextDisplayName(getTaskContext(task)) }}</div>
                      </div>
                    </div>

                    <!-- Duration -->
                    @if (task.estimatedDuration) {
                      <div class="property-card glass-card">
                        <div class="property-icon">⏱️</div>
                        <div class="property-content">
                          <div class="property-label">Duration</div>
                          <div class="property-value">{{ task.estimatedDuration }} min</div>
                        </div>
                      </div>
                    }

                    <!-- Difficulty -->
                    <div class="property-card glass-card" [class]="'difficulty-' + task.difficulty">
                      <div class="property-icon">{{ getDifficultyIcon(task.difficulty) }}</div>
                      <div class="property-content">
                        <div class="property-label">Difficulty</div>
                        <div class="property-value">{{ formatDifficulty(task.difficulty) }}</div>
                      </div>
                    </div>

                    <!-- Energy Level -->
                    <div class="property-card glass-card">
                      <div class="property-icon">⚡</div>
                      <div class="property-content">
                        <div class="property-label">Energy Level</div>
                        <div class="property-value">{{ getEnergyLevel(task) }}</div>
                      </div>
                    </div>

                    <!-- Focus Required -->
                    <div class="property-card glass-card">
                      <div class="property-icon">🎯</div>
                      <div class="property-content">
                        <div class="property-label">Focus Required</div>
                        <div class="property-value">{{ getFocusLevel(task) }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Timeline Information -->
                <div class="timeline-section">
                  <h3 class="section-title">📅 Timeline</h3>
                  <div class="timeline-grid">
                    <div class="timeline-item">
                      <span class="timeline-label">Created</span>
                      <span class="timeline-value">{{ formatDate(task.createdAt) }}</span>
                    </div>
                    
                    @if (task.updatedAt && task.updatedAt !== task.createdAt) {
                      <div class="timeline-item">
                        <span class="timeline-label">Updated</span>
                        <span class="timeline-value">{{ formatDate(task.updatedAt) }}</span>
                      </div>
                    }
                    
                    @if (task.dueDate) {
                      <div class="timeline-item" [class.overdue]="isOverdue(task.dueDate) && !task.completed">
                        <span class="timeline-label">Due Date</span>
                        <span class="timeline-value">
                          {{ formatDate(task.dueDate) }}
                          @if (isOverdue(task.dueDate) && !task.completed) {
                            <span class="overdue-badge">OVERDUE</span>
                          }
                        </span>
                      </div>
                    }
                    
                    @if (task.completedAt) {
                      <div class="timeline-item">
                        <span class="timeline-label">Completed</span>
                        <span class="timeline-value">{{ formatDate(task.completedAt) }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Sidebar with Smart Features -->
              <div class="task-sidebar">
                <!-- Smart Insights -->
                <div class="sidebar-card glass-card">
                  <h3 class="sidebar-title">💡 Smart Insights</h3>
                  <div class="insights-list">
                    @if (getOptimalTime(task)) {
                      <div class="insight-item">
                        <span class="insight-icon">🕒</span>
                        <div class="insight-content">
                          <div class="insight-title">Best Time</div>
                          <div class="insight-value">{{ getOptimalTime(task) }}</div>
                        </div>
                      </div>
                    }
                    @if (getProductivityTip(task)) {
                      <div class="insight-item">
                        <span class="insight-icon">💪</span>
                        <div class="insight-content">
                          <div class="insight-title">Productivity Tip</div>
                          <div class="insight-value">{{ getProductivityTip(task) }}</div>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Recurring Task Info -->
                @if (task.isRecurring) {
                  <div class="sidebar-card glass-card">
                    <h3 class="sidebar-title">🔄 Recurring Task</h3>
                    <div class="recurring-info">
                      <p class="recurring-pattern">
                        {{ formatRecurrencePattern(task.recurrencePattern) }} every 
                        {{ task.recurrenceInterval }} {{ task.recurrencePattern }}(s)
                      </p>
                      @if (task.streakCount && task.streakCount > 0) {
                        <div class="streak-info">
                          <div class="streak-badge">🔥 {{ task.streakCount }} day streak</div>
                          @if (task.lastCompletedDate) {
                            <div class="streak-date">
                              Last completed: {{ formatRelativeDate(task.lastCompletedDate) }}
                            </div>
                          }
                        </div>
                      }
                      @if (task.nextOccurrence) {
                        <div class="next-occurrence">
                          <div class="occurrence-label">Next:</div>
                          <div class="occurrence-date">{{ formatDate(task.nextOccurrence) }}</div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Completion Stats -->
                @if (task.completionCount && task.completionCount > 0) {
                  <div class="sidebar-card glass-card">
                    <h3 class="sidebar-title">📈 Completion Stats</h3>
                    <div class="stats-info">
                      <div class="stat-item">
                        <span class="stat-number">{{ task.completionCount }}</span>
                        <span class="stat-label">times completed</span>
                      </div>
                    </div>
                  </div>
                }

                <!-- Action Buttons -->
                <div class="action-buttons">
                  <button 
                    class="btn btn-primary btn-full" 
                    (click)="onToggleComplete()"
                    [disabled]="isLoading"
                  >
                    @if (isLoading) {
                      <span class="btn-loading">Updating...</span>
                    } @else {
                      <span class="btn-icon">{{ task.completed ? '↶' : '✓' }}</span>
                      {{ task.completed ? 'Mark as Pending' : 'Mark as Completed' }}
                    }
                  </button>
                  <button 
                    class="btn btn-secondary btn-full" 
                    (click)="onEdit()"
                    [disabled]="isLoading"
                  >
                    <span class="btn-icon">✏️</span>
                    Edit Task
                  </button>
                  <button 
                    class="btn btn-danger btn-full" 
                    (click)="onDelete()"
                    [disabled]="isLoading"
                  >
                    <span class="btn-icon">🗑️</span>
                    Delete Task
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- Empty State -->
          @if (!task && !isLoading && !errorMessage) {
            <div class="empty-state glass-card">
              <div class="empty-content">
                <span class="empty-icon">📭</span>
                <h3>Task Not Found</h3>
                <p>The task you're looking for doesn't exist or has been deleted.</p>
                <a routerLink="/tasks" class="btn btn-primary">
                  <span class="btn-icon">←</span>
                  Back to Tasks
                </a>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .task-detail-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow-x: hidden;
    }

    .background-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .floating-shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 6s ease-in-out infinite;
    }

    .shape-1 {
      width: 120px;
      height: 120px;
      top: 10%;
      left: 8%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 80px;
      height: 80px;
      top: 65%;
      right: 12%;
      animation-delay: 2s;
    }

    .shape-3 {
      width: 60px;
      height: 60px;
      bottom: 30%;
      left: 18%;
      animation-delay: 4s;
    }

    .shape-4 {
      width: 90px;
      height: 90px;
      top: 30%;
      right: 25%;
      animation-delay: 1s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(180deg); }
    }

    .container {
      position: relative;
      z-index: 1;
    }

    .task-detail {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    /* Header Section */
    .header-section {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      color: white;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-back:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Loading State */
    .loading {
      padding: 3rem;
      text-align: center;
      color: white;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
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

    /* Error State */
    .error-message {
      padding: 2rem;
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      color: white;
    }

    .error-icon {
      font-size: 2rem;
    }

    .error-text {
      flex: 1;
    }

    .error-text h3 {
      margin: 0 0 0.5rem 0;
      color: white;
    }

    .error-text p {
      margin: 0;
      opacity: 0.9;
    }

    .btn-retry {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-retry:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Task Content Layout */
    .task-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      align-items: start;
    }

    /* Main Task Card */
    .task-main {
      padding: 2rem;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .task-title-section {
      flex: 1;
    }

    .task-title {
      color: white;
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      line-height: 1.2;
    }

    .task-status {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .task-status.completed {
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      color: white;
    }

    .task-status:not(.completed) {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
    }

    .quick-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .btn-action:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .btn-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Task Meta Top */
    .task-meta-top {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .category-section,
    .tags-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .meta-label {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
      font-size: 0.9rem;
    }

    .category-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Sections */
    .section-title {
      color: white;
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0 0 1.5rem 0;
    }

    .description-section {
      margin-bottom: 2rem;
    }

    .task-description {
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.6;
      font-size: 1.1rem;
      margin: 0;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border-left: 4px solid rgba(255, 255, 255, 0.2);
    }

    /* Properties Grid */
    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .property-card {
      padding: 1.5rem;
      transition: all 0.3s ease;
    }

    .property-card:hover {
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.15);
    }

    .property-card.priority-3 {
      border-left: 4px solid #e53e3e;
    }

    .property-card.priority-2 {
      border-left: 4px solid #d69e2e;
    }

    .property-card.priority-1 {
      border-left: 4px solid #38a169;
    }

    .property-card.difficulty-easy {
      border-left: 4px solid #38a169;
    }

    .property-card.difficulty-medium {
      border-left: 4px solid #d69e2e;
    }

    .property-card.difficulty-hard {
      border-left: 4px solid #e53e3e;
    }

    .property-icon {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .property-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .property-value {
      color: white;
      font-size: 1.1rem;
      font-weight: 700;
    }

    /* Timeline */
    .timeline-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .timeline-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }

    .timeline-item.overdue {
      background: rgba(229, 62, 62, 0.1);
      border-left: 4px solid #e53e3e;
    }

    .timeline-label {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
    }

    .timeline-value {
      color: white;
      font-weight: 600;
    }

    .overdue-badge {
      background: #e53e3e;
      color: white;
      padding: 0.3rem 0.6rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 700;
      margin-left: 0.5rem;
    }

    /* Sidebar */
    .task-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sidebar-card {
      padding: 1.5rem;
    }

    .sidebar-title {
      color: white;
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    /* Insights */
    .insights-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .insight-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }

    .insight-icon {
      font-size: 1.2rem;
    }

    .insight-content {
      flex: 1;
    }

    .insight-title {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .insight-value {
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
    }

    /* Recurring Info */
    .recurring-pattern {
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
    }

    .streak-info {
      margin-bottom: 1rem;
    }

    .streak-badge {
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .streak-date {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
    }

    .next-occurrence {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .occurrence-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
    }

    .occurrence-date {
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
    }

    /* Stats */
    .stats-info {
      text-align: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-number {
      color: white;
      font-size: 2rem;
      font-weight: 800;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .btn {
      padding: 1rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      text-decoration: none;
      justify-content: center;
    }

    .btn-full {
      width: 100%;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      color: white;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-danger {
      background: linear-gradient(135deg, #e53e3e, #c53030);
      color: white;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Empty State */
    .empty-state {
      padding: 3rem;
      text-align: center;
    }

    .empty-content {
      color: white;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-content h3 {
      margin: 0 0 1rem 0;
      color: white;
    }

    .empty-content p {
      margin: 0 0 2rem 0;
      opacity: 0.9;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .task-detail {
        padding: 1rem;
      }

      .header-section {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .page-title {
        font-size: 2rem;
      }

      .task-content {
        grid-template-columns: 1fr;
      }

      .task-main {
        padding: 1.5rem;
      }

      .task-header {
        flex-direction: column;
        gap: 1rem;
      }

      .task-title {
        font-size: 1.6rem;
      }

      .task-meta-top {
        flex-direction: column;
        gap: 1rem;
      }

      .properties-grid {
        grid-template-columns: 1fr;
      }

      .timeline-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .task-main {
        padding: 1rem;
      }

      .task-title {
        font-size: 1.4rem;
      }

      .section-title {
        font-size: 1.1rem;
      }

      .btn {
        padding: 0.875rem 1rem;
        font-size: 0.85rem;
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

  formatDifficulty(difficulty: string | undefined | null): string {
    if (!difficulty) return 'Medium';
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