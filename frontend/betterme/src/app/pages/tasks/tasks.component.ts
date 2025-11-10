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
              <button class="btn btn-outline" (click)="showTagManager = true">
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

          <!-- Tag Manager Modal -->
          @if (showTagManager) {
            <div class="modal-overlay" (click)="showTagManager = false">
              <div class="modal-content tag-manager-modal glass-card" (click)="$event.stopPropagation()">
                <div class="modal-header">
                  <h3>Manage Tags</h3>
                  <button class="close-btn" (click)="showTagManager = false">×</button>
                </div>
                
                <div class="modal-body">
                  <!-- Tag Input -->
                  <div class="form-group">
                    <label class="form-label">Add New Tag</label>
                    <div class="tag-input-container">
                      <input 
                        type="text" 
                        class="form-control"
                        placeholder="Enter tag name"
                        [(ngModel)]="newTagName"
                        name="newTagName"
                        (keydown.enter)="addNewTag()"
                      />
                      <button class="btn btn-primary" (click)="addNewTag()" [disabled]="!newTagName.trim()">
                        Add Tag
                      </button>
                    </div>
                  </div>

                  <!-- Tags List -->
                  <div class="tags-list-section">
                    <h4>All Tags ({{ tagsWithCount.length }})</h4>
                    @if (tagsWithCount.length > 0) {
                      <div class="tags-grid">
                        @for (tag of tagsWithCount; track tag.name) {
                          <div class="tag-item">
                            <span class="tag-badge">
                              {{ tag.name }}
                              <span class="tag-count">{{ tag.count }}</span>
                            </span>
                            <button 
                              class="btn-icon btn-danger" 
                              (click)="deleteTag(tag.name)"
                              [disabled]="tag.count > 0"
                              title="{{ tag.count > 0 ? 'Cannot delete - tag is in use' : 'Delete tag' }}"
                            >
                              ×
                            </button>
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="empty-tags">
                        <p>No tags yet. Create your first tag above!</p>
                      </div>
                    }
                  </div>

                  <div class="modal-actions">
                    <button class="btn btn-secondary" (click)="showTagManager = false">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
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

                <!-- Tag Input -->
                <div class="form-group">
                  <label class="form-label">Tags</label>
                  <div class="tag-input-container">
                    <input 
                      type="text" 
                      class="form-input"
                      placeholder="Add tags (press Enter to add)"
                      [(ngModel)]="newTaskTagInput"
                      name="tagInput"
                      (keydown)="onTagInputKeydown($event)"
                    />
                  </div>
                  <div class="tag-preview">
                    @for (tag of newTaskTags; track tag) {
                      <span class="tag-badge">
                        {{ tag }}
                        <button type="button" (click)="removeTag(tag)" class="tag-remove">×</button>
                      </span>
                    }
                  </div>
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
                    
                    @if (task.description) {
                      <p class="task-description">{{ task.description }}</p>
                    }
                    
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
                    
                    <!-- Tags Display -->
                    @if (task.tags && task.tags.length > 0) {
                      <div class="task-tags">
                        @for (tag of task.tags; track tag) {
                          <span class="tag-badge-small" [style.background]="getTagColor(tag)">
                            {{ tag }}
                          </span>
                        }
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
    /* Add these new styles to your existing styles */

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    }

    .modal-content {
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      width: 100%;
    }

    .tag-manager-modal {
      padding: 0;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem 2rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .modal-header h3 {
      margin: 0;
      color: white;
      font-size: 1.5rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.3s ease;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .modal-body {
      padding: 2rem;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Tag Manager Styles */
    .tag-input-container {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .tags-list-section {
      margin-top: 2rem;
    }

    .tags-list-section h4 {
      color: white;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .tags-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .tag-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .tag-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      font-weight: 600;
    }

    .tag-count {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .btn-icon.btn-danger {
      background: rgba(239, 68, 68, 0.3);
      color: #fecaca;
      border: 1px solid rgba(239, 68, 68, 0.5);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 0.8rem;
    }

    .btn-icon.btn-danger:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.5);
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-tags {
      text-align: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.6);
    }

    /* Task Description Style */
    .task-description {
      color: rgba(255, 255, 255, 0.8);
      margin: 0.5rem 0;
      line-height: 1.4;
    }

    /* Task Tags Style */
    .task-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }

    .tag-badge-small {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 0.3rem 0.6rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    /* Form Control Style */
    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
      transition: all 0.3s ease;
      flex: 1;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      background: rgba(255, 255, 255, 0.15);
    }

    .form-control::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    /* Tag Preview in Create Form */
    .tag-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .tag-remove {
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
      margin-left: 0.3rem;
    }

    .tag-remove:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Keep all your existing styles below... */
    .tasks-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow-x: hidden;
    }

    /* ... rest of your existing styles remain the same ... */
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

  // Form fields
  newTaskTitle: string = '';
  newTaskDescription: string = '';
  newTaskDueDate: string = '';
  newTaskPriority: number = 1;
  newTaskCategory: string = '';
  newTaskTagInput: string = '';
  newTaskTags: string[] = [];
  newTagName: string = '';
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

  // NEW: Tag management methods
  addNewTag(): void {
    if (!this.newTagName.trim()) return;
    
    const tagName = this.newTagName.trim();
    // In a real app, you would save this to your backend
    // For now, we'll just clear the input
    this.newTagName = '';
  }

  // MODIFIED: Delete tag method - only allow deletion if tag is not in use
  deleteTag(tagName: string): void {
    const tag = this.tagsWithCount.find(t => t.name === tagName);
    if (tag && tag.count === 0) {
      // In a real app, you would delete from backend
      // For now, we'll just remove from the local list if not in use
      this.selectedTagNames = this.selectedTagNames.filter(name => name !== tagName);
      this.filteredTags = this.filteredTags.filter(name => name !== tagName);
    }
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