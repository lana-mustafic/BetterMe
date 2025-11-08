import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';

interface TagWithCount {
  name: string;
  count: number;
  selected: boolean;
}

interface CategoryStats {
  name: string;
  count: number;
  completed: number;
  percentage: number;
  color: string;
}

interface PriorityStats {
  priority: number;
  name: string;
  count: number;
  completed: number;
  color: string;
}

interface Category {
  name: string;
  color: string;
  icon: string;
  custom?: boolean;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    FormsModule, 
    CalendarViewComponent,
    CommonModule
  ],
  template: `
    <div class="tasks-page">
      <!-- Background Animation -->
      <div class="background-animation">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
        <div class="floating-shape shape-4"></div>
      </div>

      <div class="container">
        <div class="tasks-container">
          <!-- Header Section -->
          <div class="tasks-header">
            <div class="header-content">
              <h1 class="gradient-text">My Tasks</h1>
              <p class="subtitle">Manage your productivity and track your progress</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-gradient" (click)="showCreateForm = !showCreateForm">
                <span class="btn-icon">+</span>
                Add New Task
              </button>
              <button class="btn btn-outline" (click)="showTagManager = !showTagManager">
                <span class="btn-icon">🏷️</span>
                Manage Tags
              </button>
            </div>
          </div>

          <!-- View Toggle -->
          <div class="view-toggle-container">
            <div class="view-toggle">
              <button 
                class="toggle-btn" 
                [class.active]="activeView === 'list'"
                (click)="activeView = 'list'"
              >
                <span class="toggle-icon">📋</span>
                <span class="toggle-text">Task List</span>
              </button>
              <button 
                class="toggle-btn" 
                [class.active]="activeView === 'stats'"
                (click)="activeView = 'stats'"
              >
                <span class="toggle-icon">📊</span>
                <span class="toggle-text">Analytics</span>
              </button>
              <button 
                class="toggle-btn" 
                [class.active]="activeView === 'calendar'"
                (click)="activeView = 'calendar'"
              >
                <span class="toggle-icon">📅</span>
                <span class="toggle-text">Calendar</span>
              </button>
            </div>
          </div>

          <!-- Calendar View -->
          @if (activeView === 'calendar') {
            <app-calendar-view></app-calendar-view>
          }

          <!-- Beautiful Statistics Dashboard -->
          @if (activeView === 'stats') {
            <div class="dashboard">
              <!-- Summary Cards - Glass Morphism Design -->
              <div class="stats-grid">
                <div class="stat-card glass-card">
                  <div class="stat-card-content">
                    <div class="stat-icon">📝</div>
                    <div class="stat-data">
                      <div class="stat-number">{{ totalTasks }}</div>
                      <div class="stat-label">Total Tasks</div>
                    </div>
                  </div>
                  <div class="stat-trend">All time</div>
                </div>
                
                <div class="stat-card glass-card">
                  <div class="stat-card-content">
                    <div class="stat-icon">✅</div>
                    <div class="stat-data">
                      <div class="stat-number">{{ completedTasks }}</div>
                      <div class="stat-label">Completed</div>
                    </div>
                  </div>
                  <div class="stat-trend">{{ completionRate }}% done</div>
                </div>
                
                <div class="stat-card glass-card">
                  <div class="stat-card-content">
                    <div class="stat-icon">⏳</div>
                    <div class="stat-data">
                      <div class="stat-number">{{ pendingTasks }}</div>
                      <div class="stat-label">Pending</div>
                    </div>
                  </div>
                  <div class="stat-trend">{{ 100 - completionRate }}% remaining</div>
                </div>
                
                <div class="stat-card glass-card">
                  <div class="stat-card-content">
                    <div class="stat-icon">📈</div>
                    <div class="stat-data">
                      <div class="stat-number">{{ completionRate }}%</div>
                      <div class="stat-label">Progress</div>
                    </div>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="completionRate"></div>
                  </div>
                </div>

                <div class="stat-card glass-card">
                  <div class="stat-card-content">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-data">
                      <div class="stat-number">{{ highPriorityTasks }}</div>
                      <div class="stat-label">High Priority</div>
                    </div>
                  </div>
                  <div class="stat-trend">Needs attention</div>
                </div>

                <div class="stat-card glass-card">
                  <div class="stat-card-content">
                    <div class="stat-icon">⏰</div>
                    <div class="stat-data">
                      <div class="stat-number">{{ overdueTasks }}</div>
                      <div class="stat-label">Overdue</div>
                    </div>
                  </div>
                  <div class="stat-trend">Past deadline</div>
                </div>
              </div>

              <!-- Main Charts Section -->
              <div class="charts-section">
                <!-- Left Column -->
                <div class="charts-column">
                  <!-- Completion Progress Chart -->
                  <div class="chart-widget glass-card">
                    <div class="chart-header">
                      <h3>Completion Progress</h3>
                      <div class="chart-actions">
                        <button class="chart-action-btn" (click)="filterCompleted()">View All</button>
                      </div>
                    </div>
                    <div class="completion-widget">
                      <div class="completion-radial">
                        <div class="radial-progress" [style.--progress]="completionRate + '%'">
                          <div class="radial-inner">
                            <span class="radial-percentage">{{ completionRate }}%</span>
                            <span class="radial-label">Complete</span>
                          </div>
                        </div>
                      </div>
                      <div class="completion-breakdown">
                        <div class="breakdown-item completed">
                          <div class="breakdown-dot"></div>
                          <div class="breakdown-info">
                            <span class="breakdown-count">{{ completedTasks }}</span>
                            <span class="breakdown-label">Done</span>
                          </div>
                        </div>
                        <div class="breakdown-item pending">
                          <div class="breakdown-dot"></div>
                          <div class="breakdown-info">
                            <span class="breakdown-count">{{ pendingTasks }}</span>
                            <span class="breakdown-label">To Do</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Priority Distribution -->
                  <div class="chart-widget glass-card">
                    <div class="chart-header">
                      <h3>Priority Distribution</h3>
                    </div>
                    <div class="priority-widget">
                      @for (priority of priorityStats; track priority.priority) {
                        <div class="priority-item" (click)="filterByPriority(priority.priority)">
                          <div class="priority-header">
                            <div class="priority-info">
                              <span class="priority-badge" [style.background]="priority.color">
                                {{ priority.name }}
                              </span>
                              <span class="priority-count">{{ priority.count }} tasks</span>
                            </div>
                            <span class="priority-percentage">{{ getPriorityPercentage(priority) }}%</span>
                          </div>
                          <div class="priority-bar">
                            <div 
                              class="priority-progress" 
                              [style.width.%]="getPriorityPercentage(priority)"
                              [style.background]="priority.color"
                            ></div>
                          </div>
                          <div class="priority-completion">
                            <span>{{ priority.completed }}/{{ priority.count }} completed</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="charts-column">
                  <!-- Category Distribution -->
                  <div class="chart-widget glass-card">
                    <div class="chart-header">
                      <h3>Tasks by Category</h3>
                      <div class="chart-actions">
                        <button class="chart-action-btn" (click)="showAllCategories()">View All</button>
                      </div>
                    </div>
                    <div class="category-widget">
                      @for (category of categoryStats; track category.name; let i = $index) {
                        <div 
                          class="category-item" 
                          (click)="filterByCategory(category.name)"
                          [style.--color]="getCategoryColor(category.name)"
                        >
                          <div class="category-main">
                            <div class="category-icon-small">{{ getCategoryIcon(category.name) }}</div>
                            <span class="category-name">{{ category.name }}</span>
                            <span class="category-count">{{ category.count }}</span>
                          </div>
                          <div class="category-bar">
                            <div 
                              class="category-progress" 
                              [style.width.%]="category.percentage"
                            ></div>
                          </div>
                          <div class="category-percentage">{{ category.percentage }}%</div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Popular Tags -->
                  <div class="chart-widget glass-card">
                    <div class="chart-header">
                      <h3>Popular Tags</h3>
                    </div>
                    <div class="tags-widget">
                      <div class="tags-cloud">
                        @for (tag of popularTags.slice(0, 12); track tag.name) {
                          <span 
                            class="tag-cloud-item"
                            [style.background]="getTagColor(tag.name)"
                            [style.transform]="getTagScale(tag.count)"
                            (click)="filterByTag(tag.name)"
                          >
                            {{ tag.name }}
                            <span class="tag-count">{{ tag.count }}</span>
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bottom Section -->
              <div class="bottom-section">
                <!-- Recent Activity -->
                <div class="chart-widget full-width glass-card">
                  <div class="chart-header">
                    <h3>Recent Activity</h3>
                    <div class="chart-actions">
                      <button class="chart-action-btn" (click)="activeView = 'list'">View All Tasks</button>
                    </div>
                  </div>
                  <div class="activity-widget">
                    <div class="activity-list">
                      @for (task of recentTasks; track task.id) {
                        <div class="activity-item">
                          <div class="activity-icon" [class.completed]="task.completed">
                            @if (task.completed) {
                              <div class="icon-completed">✓</div>
                            } @else {
                              <div class="icon-created">+</div>
                            }
                          </div>
                          <div class="activity-content">
                            <div class="activity-title">{{ task.title }}</div>
                            <div class="activity-details">
                              <span class="activity-type">
                                @if (task.completed) {
                                  Completed
                                } @else {
                                  Created
                                }
                              </span>
                              <span class="activity-time">{{ formatRelativeDate(task.createdAt) }}</span>
                              @if (task.category) {
                                <span 
                                  class="activity-category"
                                  [style.background]="getCategoryColor(task.category) + '20'"
                                  [style.color]="getCategoryColor(task.category)"
                                  [style.border]="'1px solid ' + getCategoryColor(task.category)"
                                >
                                  {{ getCategoryIcon(task.category) }} {{ task.category }}
                                </span>
                              }
                              @if (task.priority === 3) {
                                <span class="activity-priority high">High</span>
                              }
                            </div>
                          </div>
                          <div class="activity-actions">
                            <button class="btn-icon" (click)="onToggleComplete(task.id)" [title]="task.completed ? 'Mark as pending' : 'Mark as completed'">
                              {{ task.completed ? '↶' : '✓' }}
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
                
                <!-- Quick Insights -->
                <div class="chart-widget glass-card">
                  <div class="chart-header">
                    <h3>Quick Insights</h3>
                  </div>
                  <div class="insights-widget">
                    <div class="insight-item">
                      <div class="insight-icon">🎯</div>
                      <div class="insight-content">
                        <div class="insight-title">Productivity Score</div>
                        <div class="insight-value">{{ getProductivityScore() }}/10</div>
                      </div>
                    </div>
                    <div class="insight-item">
                      <div class="insight-icon">⚡</div>
                      <div class="insight-content">
                        <div class="insight-title">Avg Completion</div>
                        <div class="insight-value">{{ getAverageCompletionTime() }}</div>
                      </div>
                    </div>
                    <div class="insight-item">
                      <div class="insight-icon">📅</div>
                      <div class="insight-content">
                        <div class="insight-title">Busiest Day</div>
                        <div class="insight-value">{{ getBusiestDay() }}</div>
                      </div>
                    </div>
                    <div class="insight-item">
                      <div class="insight-icon">🏆</div>
                      <div class="insight-content">
                        <div class="insight-title">Best Category</div>
                        <div class="insight-value">{{ getBestCategory() }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Enhanced Filter Section (only show in list view) -->
          @if (activeView === 'list') {
            <div class="filters-section glass-card">
              <div class="filters-header">
                <h3>Filters</h3>
                @if (hasActiveFilters) {
                  <button class="btn-clear-filters" (click)="clearFilters()">
                    Clear All Filters
                  </button>
                }
              </div>
              
              <div class="filters-grid">
                <!-- Search Filter -->
                <div class="filter-group">
                  <label class="filter-label">Search</label>
                  <input
                    type="text"
                    class="filter-input"
                    placeholder="Search tasks..."
                    [(ngModel)]="searchTerm"
                    (input)="onFiltersChange()"
                  />
                </div>

                <!-- Enhanced Category Filter -->
                <div class="filter-group">
                  <label class="filter-label">Category</label>
                  <select
                    class="filter-select"
                    [(ngModel)]="selectedCategory"
                    (change)="onFiltersChange()"
                  >
                    <option value="">All Categories</option>
                    @for (category of availableCategoriesWithIcons; track category.name) {
                      <option [value]="category.name">
                        {{ category.icon }} {{ category.name }}
                      </option>
                    }
                  </select>
                </div>

                <!-- Status Filter -->
                <div class="filter-group">
                  <label class="filter-label">Status</label>
                  <select
                    class="filter-select"
                    [(ngModel)]="selectedStatus"
                    (change)="onFiltersChange()"
                  >
                    <option value="all">All Tasks</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <!-- Priority Filter -->
                <div class="filter-group">
                  <label class="filter-label">Priority</label>
                  <select
                    class="filter-select"
                    [(ngModel)]="selectedPriority"
                    (change)="onFiltersChange()"
                  >
                    <option value="all">All Priorities</option>
                    <option value="3">High</option>
                    <option value="2">Medium</option>
                    <option value="1">Low</option>
                  </select>
                </div>
              </div>

              <!-- Active Filters Display -->
              @if (hasActiveFilters) {
                <div class="active-filters">
                  <strong>Active Filters:</strong>
                  <div class="active-filter-tags">
                    @if (searchTerm) {
                      <span class="active-filter">
                        Search: "{{ searchTerm }}"
                        <button (click)="clearSearch()">×</button>
                      </span>
                    }
                    @if (selectedCategory) {
                      <span class="active-filter">
                        Category: {{ selectedCategory }}
                        <button (click)="clearCategory()">×</button>
                      </span>
                    }
                    @if (selectedStatus !== 'all') {
                      <span class="active-filter">
                        Status: {{ selectedStatus === 'completed' ? 'Completed' : 'Active' }}
                        <button (click)="clearStatus()">×</button>
                      </span>
                    }
                    @if (selectedPriority !== 'all') {
                      <span class="active-filter">
                        Priority: {{ getPriorityText(selectedPriority) }}
                        <button (click)="clearPriority()">×</button>
                      </span>
                    }
                  </div>
                </div>
              }

              <!-- Results Count -->
              <div class="results-info">
                Showing {{ filteredTasks.length }} of {{ tasks.length }} tasks
                @if (filteredTasks.length === 0 && tasks.length > 0) {
                  <span class="no-results">No tasks match your filters</span>
                }
              </div>
            </div>
          }

          <!-- Create Task Form (only show in list view) -->
          @if (showCreateForm && activeView === 'list') {
            <div class="create-task-form glass-card">
              <h3>Create New Task</h3>
              <form (ngSubmit)="onCreateTask()">
                <div class="form-group">
                  <input 
                    type="text" 
                    class="form-input"
                    placeholder="Task title"
                    [(ngModel)]="newTaskTitle"
                    name="title"
                    required
                  />
                </div>
                <div class="form-group">
                  <textarea 
                    class="form-input"
                    placeholder="Task description"
                    [(ngModel)]="newTaskDescription"
                    name="description"
                    rows="3"
                  ></textarea>
                </div>
                
                <!-- Enhanced Category Dropdown -->
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select 
                    class="form-input"
                    [(ngModel)]="newTaskCategory"
                    name="category"
                  >
                    <option value="">Select Category</option>
                    @for (category of categories; track category.name) {
                      <option [value]="category.name">
                        {{ category.icon }} {{ category.name }}
                      </option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Due Date</label>
                  <input 
                    type="date" 
                    class="form-input"
                    [(ngModel)]="newTaskDueDate"
                    name="dueDate"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select 
                    class="form-input"
                    [(ngModel)]="newTaskPriority"
                    name="priority"
                  >
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="3">High</option>
                  </select>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-gradient">Create Task</button>
                  <button type="button" class="btn btn-outline" (click)="showCreateForm = false">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- Loading State -->
          @if (isLoading) {
            <div class="loading glass-card">
              <div class="loading-spinner"></div>
              Loading tasks...
            </div>
          }

          <!-- Error Message -->
          @if (errorMessage) {
            <div class="error-message glass-card">
              {{ errorMessage }}
            </div>
          }
          
          <!-- Tasks List (only show in list view) -->
          @if (activeView === 'list') {
            <div class="task-list">
              @for (task of filteredTasks; track task.id) {
                <div class="task-item glass-card" [class.completed]="task.completed">
                  <div class="task-content">
                    <div class="task-header">
                      <h3 class="task-title">{{ task.title }}</h3>
                      <div class="task-actions">
                        <button 
                          class="btn-status" 
                          (click)="onToggleComplete(task.id)"
                          [class.completed]="task.completed"
                        >
                          {{ task.completed ? '✅' : '⏳' }}
                        </button>
                      </div>
                    </div>
                    
                    <!-- Enhanced Category Badge -->
                    @if (task.category) {
                      <div class="task-category">
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
                    
                    <div class="task-meta">
                      <span class="task-date">
                        Created: {{ formatDate(task.createdAt) }}
                      </span>
                      @if (task.dueDate) {
                        <span class="task-date">
                          Due: {{ formatDate(task.dueDate) }}
                        </span>
                      }
                      @if (task.priority === 3) {
                        <span class="priority-high">🔥 High Priority</span>
                      } @else if (task.priority === 2) {
                        <span class="priority-medium">⚡ Medium Priority</span>
                      }
                    </div>
                    <div class="task-actions-bottom">
                      <button class="btn-small btn-danger" (click)="onDeleteTask(task.id)">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="empty-state glass-card">
                  @if (tasks.length === 0) {
                    <p>No tasks yet. Create your first task to get started!</p>
                    <button class="btn btn-gradient" (click)="showCreateForm = true">
                      Create Your First Task
                    </button>
                  } @else {
                    <p>No tasks match your current filters.</p>
                    <button class="btn btn-outline" (click)="clearFilters()">
                      Clear Filters
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-page {
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

    .shape-3 {
      width: 100px;
      height: 100px;
      bottom: 20%;
      left: 15%;
      animation-delay: 4s;
    }

    .shape-4 {
      width: 120px;
      height: 120px;
      top: 30%;
      right: 20%;
      animation-delay: 1s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    .container {
      position: relative;
      z-index: 1;
    }

    .tasks-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .tasks-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 2rem;
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

    .header-actions {
      display: flex;
      gap: 1rem;
    }

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
    }

    .btn-gradient {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .btn-icon {
      font-size: 1.1rem;
    }

    /* View Toggle Styles */
    .view-toggle-container {
      margin-bottom: 2rem;
    }

    .view-toggle {
      display: inline-flex;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      padding: 0.5rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 140px;
    }

    .toggle-btn.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .toggle-btn:hover:not(.active) {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      transform: translateY(-1px);
    }

    /* Dashboard Styles */
    .dashboard {
      background: transparent;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 2rem;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
    }

    .stat-card-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat-icon {
      font-size: 2.5rem;
      opacity: 0.9;
    }

    .stat-data {
      flex: 1;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 800;
      color: white;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-trend {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4ade80, #22d3ee);
      border-radius: 3px;
      transition: width 1s ease-in-out;
    }

    /* Charts Section */
    .charts-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .charts-column {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .chart-widget {
      padding: 2rem;
      transition: all 0.3s ease;
    }

    .chart-widget:hover {
      transform: translateY(-3px);
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
    }

    .chart-widget.full-width {
      grid-column: 1 / -1;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .chart-header h3 {
      margin: 0;
      color: white;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .chart-action-btn {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: transparent;
      border-radius: 8px;
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chart-action-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    /* Completion Widget */
    .completion-widget {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .completion-radial {
      flex-shrink: 0;
    }

    .radial-progress {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: conic-gradient(#4ade80 var(--progress), rgba(255, 255, 255, 0.2) 0deg);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .radial-progress::before {
      content: '';
      position: absolute;
      width: 90px;
      height: 90px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .radial-inner {
      position: relative;
      text-align: center;
      z-index: 1;
    }

    .radial-percentage {
      display: block;
      font-size: 1.8rem;
      font-weight: 800;
      color: white;
    }

    .radial-label {
      display: block;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
    }

    .completion-breakdown {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
    }

    .breakdown-item.completed .breakdown-dot {
      background: #4ade80;
    }

    .breakdown-item.pending .breakdown-dot {
      background: rgba(255, 255, 255, 0.3);
    }

    .breakdown-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .breakdown-info {
      flex: 1;
    }

    .breakdown-count {
      display: block;
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
    }

    .breakdown-label {
      display: block;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Priority Widget */
    .priority-widget {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .priority-item {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .priority-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(5px);
    }

    .priority-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .priority-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .priority-badge {
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .priority-count {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .priority-percentage {
      font-size: 1rem;
      font-weight: 700;
      color: white;
    }

    .priority-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .priority-progress {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .priority-completion {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Category Widget */
    .category-widget {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .category-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(5px);
    }

    .category-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .category-name {
      font-weight: 600;
      color: white;
      flex: 1;
    }

    .category-count {
      font-weight: 700;
      color: white;
    }

    .category-bar {
      width: 80px;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
    }

    .category-progress {
      height: 100%;
      background: var(--color);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .category-percentage {
      width: 40px;
      text-align: right;
      font-size: 0.85rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Tags Widget */
    .tags-widget {
      padding: 0.5rem;
    }

    .tags-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      justify-content: center;
      min-height: 120px;
    }

    .tag-cloud-item {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
    }

    .tag-cloud-item:hover {
      transform: scale(1.1) translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .tag-count {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      font-size: 0.7rem;
    }

    /* Bottom Section */
    .bottom-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    /* Activity Widget */
    .activity-widget {
      max-height: 300px;
      overflow-y: auto;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .activity-item:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon:not(.completed) {
      background: #667eea;
    }

    .activity-icon.completed {
      background: #4ade80;
    }

    .icon-completed, .icon-created {
      color: white;
      font-weight: bold;
      font-size: 1rem;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-weight: 600;
      color: white;
      margin-bottom: 0.25rem;
    }

    .activity-details {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .activity-type {
      font-weight: 600;
    }

    .activity-time {
      color: rgba(255, 255, 255, 0.7);
    }

    .activity-category, .activity-priority {
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .activity-category {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .activity-priority.high {
      background: rgba(239, 68, 68, 0.3);
      color: #fecaca;
    }

    .activity-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      color: white;
    }

    .btn-icon:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    /* Insights Widget */
    .insights-widget {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .insight-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
    }

    .insight-icon {
      font-size: 1.5rem;
      opacity: 0.8;
    }

    .insight-content {
      flex: 1;
    }

    .insight-title {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 0.25rem;
    }

    .insight-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
    }

    /* Filters Section */
    .filters-section {
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .filters-header h3 {
      color: white;
      margin: 0;
      font-size: 1.3rem;
    }

    .btn-clear-filters {
      background: rgba(239, 68, 68, 0.3);
      color: #fecaca;
      border: 1px solid rgba(239, 68, 68, 0.5);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-clear-filters:hover {
      background: rgba(239, 68, 68, 0.5);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
    }

    .filter-label {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .filter-input, .filter-select {
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      font-size: 14px;
      color: white;
      transition: all 0.3s ease;
    }

    .filter-input::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .filter-input:focus, .filter-select:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }

    .active-filters {
      margin: 1rem 0;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .active-filters strong {
      color: white;
    }

    .active-filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .active-filter {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 16px;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .active-filter button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .active-filter button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .results-info {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      padding: 0.5rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .no-results {
      color: #fecaca;
      font-weight: 600;
      margin-left: 1rem;
    }

    /* Create Task Form */
    .create-task-form {
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .create-task-form h3 {
      color: white;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
    }

    .form-input {
      width: 100%;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      font-size: 16px;
      color: white;
      transition: all 0.3s ease;
    }

    .form-input::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .form-input:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 1rem;
    }

    /* Task List */
    .task-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-item {
      padding: 1.5rem;
      transition: all 0.3s ease;
      border-left: 4px solid #667eea;
    }

    .task-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
    }

    .task-item.completed {
      opacity: 0.7;
      border-left-color: #4ade80;
    }

    .task-item.completed .task-title {
      text-decoration: line-through;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .task-title {
      color: white;
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0;
      flex: 1;
    }

    .task-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-status {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: background-color 0.2s ease;
      color: white;
    }

    .btn-status:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .task-category {
      margin-bottom: 1rem;
    }

    .category-badge {
      background: #667eea;
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .category-badge:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .category-icon {
      font-size: 0.9rem;
    }

    .task-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .task-date {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .priority-high {
      font-size: 0.8rem;
      color: #fecaca;
      font-weight: 600;
    }

    .priority-medium {
      font-size: 0.8rem;
      color: #fed7aa;
      font-weight: 600;
    }

    .task-actions-bottom {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .btn-small {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      color: white;
    }

    .btn-small:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .btn-small.btn-danger {
      color: #fecaca;
      border-color: rgba(239, 68, 68, 0.5);
    }

    .btn-small.btn-danger:hover {
      background: rgba(239, 68, 68, 0.3);
    }

    /* Loading State */
    .loading {
      padding: 3rem;
      text-align: center;
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

    /* Error Message */
    .error-message {
      background: rgba(239, 68, 68, 0.1);
      color: #fecaca;
      padding: 1.5rem;
      text-align: center;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    /* Empty State */
    .empty-state {
      padding: 3rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
    }

    .empty-state p {
      margin-bottom: 1.5rem;
      font-size: 1.1rem;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .charts-section {
        grid-template-columns: 1fr;
      }
      
      .bottom-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .tasks-header {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .view-toggle {
        flex-direction: column;
        width: 100%;
      }

      .toggle-btn {
        min-width: auto;
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .completion-widget {
        flex-direction: column;
        text-align: center;
      }

      .task-header {
        flex-direction: column;
        gap: 1rem;
      }

      .task-actions-bottom {
        flex-wrap: wrap;
      }
    }

    @media (max-width: 480px) {
      .tasks-container {
        padding: 1rem 0.5rem;
      }

      .header-content h1 {
        font-size: 2.2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .chart-widget,
      .stat-card,
      .filters-section,
      .create-task-form,
      .task-item {
        padding: 1.5rem;
      }
    }
  `]
})
export class TasksComponent implements OnInit {
  private taskService = inject(TaskService);

  tasks: Task[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  showCreateForm: boolean = false;
  showTagManager: boolean = false;
  activeView: 'list' | 'stats' | 'calendar' = 'list';
  activeTab: 'tags' | 'categories' = 'tags';

  // Form fields
  newTaskTitle: string = '';
  newTaskDescription: string = '';
  newTaskDueDate: string = '';
  newTaskPriority: number = 1;
  newTaskCategory: string = '';
  newTaskTagInput: string = '';
  newTaskTags: string[] = [];
  newTagName: string = '';
  newCategoryName: string = '';
  newTaskIsRecurring: boolean = false;
  newTaskRecurrencePattern: string = 'daily';
  newTaskRecurrenceInterval: number = 1;

  // Filter fields
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = 'all';
  selectedPriority: string = 'all';
  tagSearchTerm: string = '';
  tagFilterLogic: 'AND' | 'OR' = 'OR';
  filteredTags: string[] = [];
  selectedTagNames: string[] = [];

  // Enhanced Categories System
  categories: Category[] = [
    { name: 'Personal', color: '#667eea', icon: '🏠' },
    { name: 'Work', color: '#764ba2', icon: '💼' },
    { name: 'Shopping', color: '#f093fb', icon: '🛒' },
    { name: 'Health', color: '#4facfe', icon: '🏥' },
    { name: 'Education', color: '#43e97b', icon: '🎓' },
    { name: 'Finance', color: '#fa709a', icon: '💰' },
    { name: 'Travel', color: '#30cfd0', icon: '✈️' },
    { name: 'Other', color: '#a8edea', icon: '📦' }
  ];

  // Statistics computed properties
  get totalTasks(): number {
    return this.tasks.length;
  }

  get completedTasks(): number {
    return this.tasks.filter(task => task.completed).length;
  }

  get pendingTasks(): number {
    return this.tasks.filter(task => !task.completed).length;
  }

  get completionRate(): number {
    return this.totalTasks > 0 ? Math.round((this.completedTasks / this.totalTasks) * 100) : 0;
  }

  get highPriorityTasks(): number {
    return this.tasks.filter(task => task.priority === 3).length;
  }

  get overdueTasks(): number {
    const today = new Date();
    return this.tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) < today
    ).length;
  }

  // Category helper methods
  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category ? category.color : '#6c757d';
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category ? category.icon : '📦';
  }

  // Enhanced computed property for categories with icons
  get availableCategoriesWithIcons(): Category[] {
    const usedCategories = this.tasks
      .map(task => task.category)
      .filter((category): category is string => category != null && category.trim() !== '');
    
    const uniqueCategories = [...new Set(usedCategories)];
    
    return uniqueCategories.map(categoryName => {
      const existingCategory = this.categories.find(c => c.name === categoryName);
      return existingCategory || { 
        name: categoryName, 
        color: this.generateColor(categoryName), 
        icon: '📦',
        custom: true 
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  // Generate a consistent color for custom categories
  private generateColor(text: string): string {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#4facfe', 
      '#43e97b', '#fa709a', '#30cfd0', '#a8edea',
      '#fed6e3', '#5ee7df', '#b490ca', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  // Category management methods
  createNewCategory(): void {
    if (!this.newCategoryName.trim()) return;
    
    const categoryName = this.newCategoryName.trim();
    const existingCategory = this.categories.find(c => c.name === categoryName);
    
    if (!existingCategory) {
      this.categories.push({
        name: categoryName,
        color: this.generateColor(categoryName),
        icon: '📦',
        custom: true
      });
      this.newCategoryName = '';
    }
  }

  deleteCategory(categoryName: string): void {
    if (!this.isCategoryInUse(categoryName)) {
      this.categories = this.categories.filter(c => c.name !== categoryName);
    }
  }

  isCategoryInUse(categoryName: string): boolean {
    return this.tasks.some(task => task.category === categoryName);
  }

  getCustomCategoriesCount(): number {
    return this.categories.filter(c => c.custom).length;
  }

  hasDuplicateCategory(): boolean {
    return !!this.newCategoryName && this.categories.some(c => c.name === this.newCategoryName.trim());
  }

  get completionCircleBackground(): string {
    return `conic-gradient(#28a745 ${this.completionRate}%, #e1e5e9 0%)`;
  }

  get categoryStats(): CategoryStats[] {
    const categoryMap = new Map<string, { count: number, completed: number }>();
    
    this.tasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, completed: 0 });
      }
      const stats = categoryMap.get(category)!;
      stats.count++;
      if (task.completed) stats.completed++;
    });

    const totalTasks = this.totalTasks;
    
    return Array.from(categoryMap.entries())
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        completed: stats.completed,
        percentage: totalTasks > 0 ? Math.round((stats.count / totalTasks) * 100) : 0,
        color: this.getCategoryColor(name)
      }))
      .sort((a, b) => b.count - a.count);
  }

  get priorityStats(): PriorityStats[] {
    const priorities = [
      { priority: 3, name: 'High', color: '#e74c3c' },
      { priority: 2, name: 'Medium', color: '#f39c12' },
      { priority: 1, name: 'Low', color: '#27ae60' }
    ];

    return priorities.map(p => {
      const tasksInPriority = this.tasks.filter(task => task.priority === p.priority);
      return {
        ...p,
        count: tasksInPriority.length,
        completed: tasksInPriority.filter(task => task.completed).length
      };
    });
  }

  get recentTasks(): Task[] {
    return [...this.tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  // Existing computed properties from filtering
  get availableCategories(): string[] {
    const categories = this.tasks
      .map(task => task.category)
      .filter((category): category is string => category != null && category.trim() !== '');
    return [...new Set(categories)].sort();
  }

  get tagsWithCount(): TagWithCount[] {
    const allTags = this.tasks.flatMap(task => task.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count, selected: this.selectedTagNames.includes(name) }))
      .sort((a, b) => b.count - a.count);
  }

  get popularTags(): TagWithCount[] {
    return this.tagsWithCount.slice(0, 10);
  }

  get tagSuggestions(): TagWithCount[] {
    if (!this.tagSearchTerm) return [];
    const searchLower = this.tagSearchTerm.toLowerCase();
    return this.tagsWithCount.filter(tag => 
      tag.name.toLowerCase().includes(searchLower)
    );
  }

  getTagScale(count: number): string {
    if (this.popularTags.length === 0) return 'scale(1)';
    
    const maxCount = Math.max(...this.popularTags.map(t => t.count));
    const scale = 0.8 + (count / maxCount) * 0.4;
    
    return `scale(${scale})`;
  }

  get selectedTags(): TagWithCount[] {
    return this.tagsWithCount.filter(tag => tag.selected);
  }

  get filteredTasks(): Task[] {
    return this.tasks.filter(task => {
      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower)) ||
          (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchLower)));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (this.selectedCategory && task.category !== this.selectedCategory) {
        return false;
      }

      // Status filter
      if (this.selectedStatus !== 'all') {
        if (this.selectedStatus === 'completed' && !task.completed) return false;
        if (this.selectedStatus === 'active' && task.completed) return false;
      }

      // Priority filter
      if (this.selectedPriority !== 'all') {
        const priorityNum = Number(this.selectedPriority);
        if (task.priority !== priorityNum) return false;
      }

      return true;
    });
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm !== '' ||
           this.selectedCategory !== '' ||
           this.selectedStatus !== 'all' ||
           this.selectedPriority !== 'all';
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  // UPDATED: Load tasks without mock data
  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        // Use only real data from backend - no mock data
        this.tasks = tasks;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load tasks. Please try again.';
        this.isLoading = false;
        console.error('Error loading tasks:', error);
      }
    });
  }

  // Statistics helper methods
  getCategoryTooltip(category: CategoryStats): string {
    return `${category.name}: ${category.count} tasks (${category.completed} completed)`;
  }

  getPriorityPercentage(priority: PriorityStats): number {
    const total = this.totalTasks;
    return total > 0 ? Math.round((priority.count / total) * 100) : 0;
  }

  getTagCloudSize(count: number): number {
    const maxCount = Math.max(...this.popularTags.map(t => t.count));
    const minSize = 12;
    const maxSize = 24;
    return minSize + ((count / maxCount) * (maxSize - minSize));
  }

  formatRelativeDate(date: string | Date): string {
    // Handle empty/null/undefined cases
    if (!date) return '';
    
    // Convert to Date object if it's a string
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if it's a valid date
    if (isNaN(dateObj.getTime())) return '';
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      // Format as absolute date for older dates
      return dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: diffInDays > 365 ? 'numeric' : undefined
      });
    }
  }

  // Dashboard interaction methods
  getTagColor(tagName: string): string {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #30cfd0, #330867)',
      'linear-gradient(135deg, #a8edea, #fed6e3)',
      'linear-gradient(135deg, #5ee7df, #b490ca)'
    ];
    const index = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  filterByPriority(priority: number): void {
    this.activeView = 'list';
    this.selectedPriority = priority.toString();
  }

  filterByCategory(category: string): void {
    this.activeView = 'list';
    this.selectedCategory = category;
  }

  filterByTag(tagName: string): void {
    this.activeView = 'list';
    this.filteredTags = [tagName];
    this.tagFilterLogic = 'OR';
  }

  filterCompleted(): void {
    this.activeView = 'list';
    this.selectedStatus = 'completed';
  }
  showAllCategories(): void {
    this.activeView = 'list';
    this.selectedCategory = '';
  }

  // Sample insight methods
  getProductivityScore(): number {
    return Math.min(10, Math.floor(this.completionRate / 10));
  }

  getAverageCompletionTime(): string {
    return '2 days';
  }

  getBusiestDay(): string {
    return 'Monday';
  }

  getBestCategory(): string {
    if (this.categoryStats.length === 0) return 'None';
    const bestCategory = this.categoryStats.reduce((prev, current) => 
      (prev.completed > current.completed) ? prev : current
    );
    return bestCategory.name;
  }

  onRecurrenceToggle(): void {
    if (!this.newTaskIsRecurring) {
      // Reset recurrence settings when turning off recurrence
      this.newTaskRecurrencePattern = 'daily';
      this.newTaskRecurrenceInterval = 1;
    }
  }

  // EXISTING methods from filtering
  onTagSearchChange(): void {}

  toggleTagFilter(tagName: string): void {
    if (this.filteredTags.includes(tagName)) {
      this.filteredTags = this.filteredTags.filter(tag => tag !== tagName);
    } else {
      this.filteredTags = [...this.filteredTags, tagName];
    }
    this.tagSearchTerm = '';
  }

  isTagFiltered(tagName: string): boolean {
    return this.filteredTags.includes(tagName);
  }

  removeTagFilter(tagName: string): void {
    this.filteredTags = this.filteredTags.filter(tag => tag !== tagName);
  }

  clearTagFilters(): void {
    this.filteredTags = [];
  }

  onFiltersChange(): void {}
  
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = 'all';
    this.selectedPriority = 'all';
    this.filteredTags = [];
    this.tagSearchTerm = '';
  }
  
  clearSearch(): void { this.searchTerm = ''; }
  clearCategory(): void { this.selectedCategory = ''; }
  clearStatus(): void { this.selectedStatus = 'all'; }
  clearPriority(): void { this.selectedPriority = 'all'; }
  
  getPriorityText(priority: string): string {
    // Convert priority to number for comparison
    const priorityNum = Number(priority);
    switch (priorityNum) {
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'All';
    }
  }

  // Tag Management Methods
  createNewTag(): void {
    if (!this.newTagName.trim()) return;
    const tagName = this.newTagName.trim();
    if (!this.tagsWithCount.some(tag => tag.name === tagName)) {
      this.newTagName = '';
    }
  }

  toggleTagSelection(tagName: string): void {
    if (this.selectedTagNames.includes(tagName)) {
      this.selectedTagNames = this.selectedTagNames.filter(name => name !== tagName);
    } else {
      this.selectedTagNames = [...this.selectedTagNames, tagName];
    }
  }

  applySelectedTags(): void {
    this.filteredTags = [...this.selectedTagNames];
    this.showTagManager = false;
  }

  clearSelectedTags(): void {
    this.selectedTagNames = [];
  }

  deleteTag(tagName: string): void {
    const tag = this.tagsWithCount.find(t => t.name === tagName);
    if (tag && tag.count === 0) {
      this.selectedTagNames = this.selectedTagNames.filter(name => name !== tagName);
      this.filteredTags = this.filteredTags.filter(name => name !== tagName);
    }
  }

  // Existing task methods
  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }
  
  addTag(): void {
    const tag = this.newTaskTagInput.trim();
    if (tag && !this.newTaskTags.includes(tag)) {
      this.newTaskTags.push(tag);
      this.newTaskTagInput = '';
    }
  }
  
  removeTag(tagToRemove: string): void {
    this.newTaskTags = this.newTaskTags.filter(tag => tag !== tagToRemove);
  }
  
  onCreateTask(): void {
    if (!this.newTaskTitle.trim()) {
      this.errorMessage = 'Task title is required';
      return;
    }

    this.taskService.createTask({
      title: this.newTaskTitle,
      description: this.newTaskDescription,
      dueDate: this.newTaskDueDate || null,
      priority: this.newTaskPriority,
      category: this.newTaskCategory || 'Other',
      tags: this.newTaskTags,
      isRecurring: this.newTaskIsRecurring,
      recurrencePattern: this.newTaskIsRecurring ? this.newTaskRecurrencePattern : 'none',
      recurrenceInterval: this.newTaskIsRecurring ? this.newTaskRecurrenceInterval : 1
    }).subscribe({
      next: (newTask: Task) => {
        this.tasks.unshift(newTask);
        this.resetForm();
        this.showCreateForm = false;
        this.errorMessage = '';
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to create task. Please try again.';
        console.error('Error creating task:', error);
      }
    });
  }
  
  // FIXED: Added missing onToggleComplete method
  onToggleComplete(taskId: number): void {
    this.taskService.toggleTaskCompletion(taskId).subscribe({
      next: (updatedTask: Task) => {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to update task. Please try again.';
        console.error('Error updating task:', error);
      }
    });
  }
  
  // FIXED: Added missing onDeleteTask method
  onDeleteTask(taskId: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.tasks = this.tasks.filter(t => t.id !== taskId);
        },
        error: (error: any) => {
          this.errorMessage = 'Failed to delete task. Please try again.';
          console.error('Error deleting task:', error);
        }
      });
    }
  }
  
  // FIXED: Added missing formatDate method
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private resetForm(): void {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskDueDate = '';
    this.newTaskPriority = 1;
    this.newTaskCategory = '';
    this.newTaskTags = [];
    this.newTaskTagInput = '';
    this.newTaskIsRecurring = false;
    this.newTaskRecurrencePattern = 'daily';
    this.newTaskRecurrenceInterval = 1;
  }
}