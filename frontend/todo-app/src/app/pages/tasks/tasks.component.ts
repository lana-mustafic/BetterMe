import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

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
  imports: [RouterLink, FormsModule],
  template: `
    <div class="container">
      <div class="tasks-container">
        <div class="tasks-header">
          <h1>My Tasks</h1>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="showCreateForm = !showCreateForm">
              + Add New Task
            </button>
            <button class="btn btn-secondary" (click)="showTagManager = !showTagManager">
              🏷️ Manage Tags & Categories
            </button>
          </div>
        </div>

        <!-- Beautiful View Toggle -->
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
          </div>
        </div>

        <!-- Beautiful Statistics Dashboard -->
        @if (activeView === 'stats') {
          <div class="dashboard">
            <!-- Summary Cards - Modern Design -->
            <div class="stats-grid">
              <div class="stat-card primary">
                <div class="stat-card-content">
                  <div class="stat-icon">📝</div>
                  <div class="stat-data">
                    <div class="stat-number">{{ totalTasks }}</div>
                    <div class="stat-label">Total Tasks</div>
                  </div>
                </div>
                <div class="stat-trend">All time</div>
              </div>
              
              <div class="stat-card success">
                <div class="stat-card-content">
                  <div class="stat-icon">✅</div>
                  <div class="stat-data">
                    <div class="stat-number">{{ completedTasks }}</div>
                    <div class="stat-label">Completed</div>
                  </div>
                </div>
                <div class="stat-trend">{{ completionRate }}% done</div>
              </div>
              
              <div class="stat-card warning">
                <div class="stat-card-content">
                  <div class="stat-icon">⏳</div>
                  <div class="stat-data">
                    <div class="stat-number">{{ pendingTasks }}</div>
                    <div class="stat-label">Pending</div>
                  </div>
                </div>
                <div class="stat-trend">{{ 100 - completionRate }}% remaining</div>
              </div>
              
              <div class="stat-card info">
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

              <div class="stat-card danger">
                <div class="stat-card-content">
                  <div class="stat-icon">🔥</div>
                  <div class="stat-data">
                    <div class="stat-number">{{ highPriorityTasks }}</div>
                    <div class="stat-label">High Priority</div>
                  </div>
                </div>
                <div class="stat-trend">Needs attention</div>
              </div>

              <div class="stat-card dark">
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
                <div class="chart-widget">
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
                <div class="chart-widget">
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
                <div class="chart-widget">
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
<!-- Add this after the priority section in your create task form -->
<div class="form-group">
  <label class="form-label">Recurrence</label>
  <div class="recurrence-options">
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        [(ngModel)]="newTaskIsRecurring" 
        name="isRecurring"
        (change)="onRecurrenceToggle()"
      >
      Repeating Task
    </label>
    
    @if (newTaskIsRecurring) {
      <div class="recurrence-settings">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Pattern</label>
            <select 
              class="form-control"
              [(ngModel)]="newTaskRecurrencePattern"
              name="recurrencePattern"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Interval</label>
            <select 
              class="form-control"
              [(ngModel)]="newTaskRecurrenceInterval"
              name="recurrenceInterval"
            >
              <option value="1">Every</option>
              <option value="2">Every 2nd</option>
              <option value="3">Every 3rd</option>
              <option value="4">Every 4th</option>
              <option value="5">Every 5th</option>
              <option value="6">Every 6th</option>
              <option value="7">Every 7th</option>
            </select>
          </div>
        </div>
      </div>
    }
  </div>
</div>
                <!-- Popular Tags -->
                <div class="chart-widget">
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
           <!-- Recent Activity -->
<div class="chart-widget full-width">
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
              <!-- FIXED LINE: Use only createdAt -->
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
              <div class="chart-widget">
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

        <!-- Tag & Category Manager Modal -->
        @if (showTagManager) {
          <div class="modal-overlay" (click)="showTagManager = false">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h3>Manage Tags & Categories</h3>
                <button class="btn-close" (click)="showTagManager = false">×</button>
              </div>
              
              <div class="modal-body">
                <!-- Tabs for Tags and Categories -->
                <div class="management-tabs">
                  <button 
                    class="tab-button" 
                    [class.active]="activeTab === 'tags'"
                    (click)="activeTab = 'tags'"
                  >
                    📑 Tags
                  </button>
                  <button 
                    class="tab-button" 
                    [class.active]="activeTab === 'categories'"
                    (click)="activeTab = 'categories'"
                  >
                    🗂️ Categories
                  </button>
                </div>

                <!-- Tags Tab Content -->
                @if (activeTab === 'tags') {
                  <div class="tab-content">
                    <!-- Create New Tag -->
                    <div class="create-tag-section">
                      <h4>Create New Tag</h4>
                      <div class="tag-create-form">
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Enter tag name"
                          [(ngModel)]="newTagName"
                          (keydown.enter)="createNewTag()"
                        />
                        <button class="btn btn-primary" (click)="createNewTag()">Create Tag</button>
                      </div>
                    </div>

                    <!-- Tag Cloud -->
                    <div class="tag-cloud-section">
                      <h4>All Tags ({{ tagsWithCount.length }})</h4>
                      <div class="tag-cloud">
                        @for (tag of tagsWithCount; track tag.name) {
                          <div class="tag-cloud-item">
                            <span class="tag-name" (click)="toggleTagSelection(tag.name)">
                              {{ tag.name }}
                            </span>
                            <span class="tag-count">{{ tag.count }}</span>
                            <button 
                              class="btn-tag-delete"
                              (click)="deleteTag(tag.name)"
                              [disabled]="tag.count > 0"
                              [title]="tag.count > 0 ? 'Cannot delete - tag is in use' : 'Delete tag'"
                            >
                              ×
                            </button>
                          </div>
                        }
                        @if (tagsWithCount.length === 0) {
                          <div class="empty-state">
                            No tags created yet. Create your first tag above!
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Selected Tags Actions -->
                    @if (selectedTags.length > 0) {
                      <div class="selected-tags-actions">
                        <h4>Selected Tags ({{ selectedTags.length }})</h4>
                        <div class="action-buttons">
                          <button class="btn btn-primary" (click)="applySelectedTags()">
                            Filter with Selected Tags
                          </button>
                          <button class="btn btn-secondary" (click)="clearSelectedTags()">
                            Clear Selection
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Categories Tab Content -->
                @if (activeTab === 'categories') {
                  <div class="tab-content">
                    <!-- Predefined Categories -->
                    <div class="categories-section">
                      <h4>Predefined Categories</h4>
                      <div class="categories-list">
                        @for (category of categories; track category.name) {
                          @if (!category.custom) {
                            <div class="category-manager-item">
                              <div class="category-visual">
                                <span class="category-manager-icon">{{ category.icon }}</span>
                                <span 
                                  class="category-color-preview"
                                  [style.background]="category.color"
                                ></span>
                              </div>
                              <span class="category-manager-name">{{ category.name }}</span>
                              <div class="category-manager-actions">
                                <span class="category-badge-system">System</span>
                              </div>
                            </div>
                          }
                        }
                      </div>
                    </div>

                    <!-- Custom Categories -->
                    <div class="categories-section">
                      <h4>Custom Categories</h4>
                      <div class="categories-list">
                        @for (category of categories; track category.name) {
                          @if (category.custom) {
                            <div class="category-manager-item custom">
                              <div class="category-visual">
                                <span class="category-manager-icon">{{ category.icon }}</span>
                                <span 
                                  class="category-color-preview"
                                  [style.background]="category.color"
                                ></span>
                              </div>
                              <span class="category-manager-name">{{ category.name }}</span>
                              <div class="category-manager-actions">
                                <button 
                                  class="btn-category-delete"
                                  (click)="deleteCategory(category.name)"
                                  [disabled]="isCategoryInUse(category.name)"
                                  [title]="isCategoryInUse(category.name) ? 'Category is in use' : 'Delete category'"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          }
                        }
                        @if (getCustomCategoriesCount() === 0) {
                          <div class="empty-state">
                            No custom categories yet. Create your first one below!
                          </div>
                        }
                      </div>
                    </div>
                    
                    <!-- Add New Category -->
                    <div class="add-category-form">
                      <h5>Add New Category</h5>
                      <div class="category-create-form">
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Category name"
                          [(ngModel)]="newCategoryName"
                          (keydown.enter)="createNewCategory()"
                        />
                        <button class="btn btn-primary" (click)="createNewCategory()">
                          Add Category
                        </button>
                      </div>
                      @if (hasDuplicateCategory()) {
                        <div class="error-message">
                          A category with this name already exists.
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Enhanced Filter Section (only show in list view) -->
        @if (activeView === 'list') {
          <div class="filters-section">
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

              <!-- Multi-Tag Filter -->
              <div class="filter-group">
                <label class="filter-label">Tags</label>
                <div class="tag-filter-container">
                  <input
                    type="text"
                    class="filter-input"
                    placeholder="Type to search tags..."
                    [(ngModel)]="tagSearchTerm"
                    (input)="onTagSearchChange()"
                  />
                  <div class="tag-suggestions" [class.show]="tagSuggestions.length > 0">
                    @for (tag of tagSuggestions; track tag.name) {
                      <div 
                        class="tag-suggestion"
                        (click)="toggleTagFilter(tag.name)"
                      >
                        <span class="tag-suggestion-name">{{ tag.name }}</span>
                        <span class="tag-suggestion-count">({{ tag.count }})</span>
                        <span class="tag-suggestion-check">
                          {{ isTagFiltered(tag.name) ? '✓' : '' }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Tag Filter Logic -->
              @if (filteredTags.length > 0) {
                <div class="filter-group">
                  <label class="filter-label">Tag Logic</label>
                  <div class="tag-logic-buttons">
                    <button
                      class="btn-logic"
                      [class.active]="tagFilterLogic === 'AND'"
                      (click)="tagFilterLogic = 'AND'"
                    >
                      AND (all tags)
                    </button>
                    <button
                      class="btn-logic"
                      [class.active]="tagFilterLogic === 'OR'"
                      (click)="tagFilterLogic = 'OR'"
                    >
                      OR (any tag)
                    </button>
                  </div>
                </div>
              }

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
                  @if (filteredTags.length > 0) {
                    <span class="active-filter">
                      Tags ({{ tagFilterLogic }}): 
                      @for (tag of filteredTags; track tag) {
                        <span class="active-tag">
                          {{ tag }}
                          <button (click)="removeTagFilter(tag)">×</button>
                        </span>
                      }
                      <button (click)="clearTagFilters()">×</button>
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

            <!-- Quick Tag Filters -->
            @if (popularTags.length > 0) {
              <div class="quick-tag-filters">
                <strong>Quick Filters:</strong>
                <div class="quick-tags">
                  @for (tag of popularTags; track tag.name) {
                    <button
                      class="quick-tag"
                      [class.active]="isTagFiltered(tag.name)"
                      (click)="toggleTagFilter(tag.name)"
                    >
                      {{ tag.name }}
                      <span class="tag-count">{{ tag.count }}</span>
                    </button>
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
          <div class="create-task-form">
            <h3>Create New Task</h3>
            <form (ngSubmit)="onCreateTask()">
              <div class="form-group">
                <input 
                  type="text" 
                  class="form-control"
                  placeholder="Task title"
                  [(ngModel)]="newTaskTitle"
                  name="title"
                  required
                />
              </div>
              <div class="form-group">
                <textarea 
                  class="form-control"
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
                  class="form-control"
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
                    class="form-control"
                    placeholder="Add tags (comma separated)"
                    [(ngModel)]="newTaskTagInput"
                    name="tagInput"
                    (keydown)="onTagInputKeydown($event)"
                  />
                  <div class="tag-hint">Press Enter or comma to add tags</div>
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
                  class="form-control"
                  [(ngModel)]="newTaskDueDate"
                  name="dueDate"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select 
                  class="form-control"
                  [(ngModel)]="newTaskPriority"
                  name="priority"
                >
                  <option value="1">Low</option>
                  <option value="2">Medium</option>
                  <option value="3">High</option>
                </select>
              </div>
              <!-- Recurrence Section -->
<div class="form-group">
  <label class="form-label">Repeat Task</label>
  <div class="recurrence-options">
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        [(ngModel)]="newTaskIsRecurring" 
        name="isRecurring"
      >
      This is a repeating task
    </label>
    
    @if (newTaskIsRecurring) {
      <div class="recurrence-settings">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Repeat every</label>
            <select 
              class="form-control"
              [(ngModel)]="newTaskRecurrenceInterval"
              name="recurrenceInterval"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Time period</label>
            <select 
              class="form-control"
              [(ngModel)]="newTaskRecurrencePattern"
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
          @if (newTaskRecurrenceInterval === 1) {
            <span>Repeats every {{ newTaskRecurrencePattern.slice(0, -2) }}</span>
          } @else {
            <span>Repeats every {{ newTaskRecurrenceInterval }} {{ newTaskRecurrencePattern.slice(0, -2) }}s</span>
          }
        </div>
      </div>
    }
  </div>
</div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Create Task</button>
                <button type="button" class="btn btn-secondary" (click)="showCreateForm = false">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Loading State -->
        @if (isLoading) {
          <div class="loading">
            Loading tasks...
          </div>
        }

        <!-- Error Message -->
        @if (errorMessage) {
          <div class="error-message">
            {{ errorMessage }}
          </div>
        }
        
        <!-- Tasks List (only show in list view) -->
        @if (activeView === 'list') {
          <div class="task-list">
            @for (task of filteredTasks; track task.id) {
              <div class="task-item" [class.completed]="task.completed">
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
                  
                  <!-- Tags Display -->
                  @if (task.tags && task.tags.length > 0) {
                    <div class="task-tags">
                      @for (tag of task.tags; track tag) {
                        <span class="tag">{{ tag }}</span>
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

                    @if (task.isRecurring) {
                      <div class="recurrence-info">
                        <span class="recurrence-badge">
                          🔄 {{ getRecurrenceText(task) }}
                        </span>
                        @if (calculateHabitStreak(task) > 0) {
                          <span class="streak-badge" [class.hot-streak]="calculateHabitStreak(task) >= 7">
                            🔥 {{ calculateHabitStreak(task) }} day streak
                          </span>
                        }
                      </div>
                    }
                  </div>
                  <div class="task-actions-bottom">
                    <a [routerLink]="['/tasks', task.id]" class="btn-link">View Details</a>
                    <a [routerLink]="['/tasks', task.id, 'edit']" class="btn-small">Edit</a>
                    <button class="btn-small btn-danger" (click)="onDeleteTask(task.id)">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                @if (tasks.length === 0) {
                  <p>No tasks yet. Create your first task to get started!</p>
                  <button class="btn btn-primary" (click)="showCreateForm = true">
                    Create Your First Task
                  </button>
                } @else {
                  <p>No tasks match your current filters.</p>
                  <button class="btn btn-secondary" (click)="clearFilters()">
                    Clear Filters
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    /* Your existing styles remain exactly the same */
    .tasks-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .tasks-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .tasks-header h1 { color: #333; font-size: 2.5rem; font-weight: 700; }
    .task-list { display: flex; flex-direction: column; gap: 1rem; }
    .task-item { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); border-left: 4px solid #667eea; transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .task-item:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); }
    .task-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .task-title { color: #333; font-size: 1.3rem; font-weight: 600; margin: 0; flex: 1; }
    .task-description { color: #666; line-height: 1.5; margin-bottom: 1rem; }
    .task-actions-bottom { display: flex; gap: 1rem; align-items: center; }
    .btn-link { color: #667eea; text-decoration: none; font-weight: 600; padding: 0.5rem 1rem; border-radius: 6px; transition: background-color 0.2s ease; }
    .btn-link:hover { background: rgba(102, 126, 234, 0.1); text-decoration: none; }
    .btn-small { padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease; }
    .btn-small:hover { background: #f8f9fa; border-color: #667eea; }
    .btn-small.btn-danger { color: #e74c3c; border-color: #e74c3c; }
    .btn-small.btn-danger:hover { background: #e74c3c; color: white; }
    .empty-state { text-align: center; padding: 3rem; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
    .empty-state p { color: #666; font-size: 1.1rem; margin-bottom: 1.5rem; }
    .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #555; }
    .form-control { width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 16px; transition: border-color 0.3s ease; }
    .form-control:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
    
    .create-task-form {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #28a745;
    }

    .create-task-form h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-status {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: background-color 0.2s ease;
    }

    .btn-status:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    .task-item.completed {
      opacity: 0.7;
      border-left-color: #28a745;
    }

    .task-item.completed .task-title {
      text-decoration: line-through;
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
      color: #888;
    }

    .priority-high {
      font-size: 0.8rem;
      color: #e74c3c;
      font-weight: 600;
    }

    .priority-medium {
      font-size: 0.8rem;
      color: #f39c12;
      font-weight: 600;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #667eea;
      font-weight: 600;
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

    /* Enhanced Category Styles */
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

    .category-icon-small {
      font-size: 1rem;
      width: 20px;
      text-align: center;
    }

    .task-category {
      margin-bottom: 0.5rem;
    }
    
    .task-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .tag {
      background: #e9ecef;
      color: #495057;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.75rem;
      border: 1px solid #dee2e6;
    }
    
    .tag-input-container {
      position: relative;
    }
    
    .tag-hint {
      font-size: 0.75rem;
      color: #6c757d;
      margin-top: 0.25rem;
    }
    
    .tag-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .tag-badge {
      background: #667eea;
      color: white;
      padding: 0.3rem 0.6rem;
      border-radius: 12px;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
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
    }
    
    .tag-remove:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Filter Section Styles */
    .filters-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #667eea;
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .filters-header h3 {
      color: #333;
      margin: 0;
      font-size: 1.2rem;
    }

    .btn-clear-filters {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .btn-clear-filters:hover {
      background: #c0392b;
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
      color: #555;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .filter-input, .filter-select {
      padding: 0.75rem;
      border: 2px solid #e1e5e9;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .filter-input:focus, .filter-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    .active-filters {
      margin: 1rem 0;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #28a745;
    }

    .active-filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .active-filter {
      background: #667eea;
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
      color: #666;
      padding: 0.5rem 0;
      border-top: 1px solid #e1e5e9;
    }

    .no-results {
      color: #e74c3c;
      font-weight: 600;
      margin-left: 1rem;
    }

    .tag-filter-container {
      position: relative;
    }

    .tag-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e1e5e9;
      border-radius: 6px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 100;
      display: none;
    }

    .tag-suggestions.show {
      display: block;
    }

    .tag-suggestion {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid #f8f9fa;
    }

    .tag-suggestion:hover {
      background: #f8f9fa;
    }

    .tag-suggestion-name {
      font-weight: 500;
    }

    .tag-suggestion-count {
      color: #6c757d;
      font-size: 0.8rem;
    }

    .tag-suggestion-check {
      color: #28a745;
      font-weight: bold;
    }

    .tag-logic-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-logic {
      flex: 1;
      padding: 0.5rem 1rem;
      border: 2px solid #e1e5e9;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }

    .btn-logic.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .btn-logic:hover:not(.active) {
      border-color: #667eea;
    }

    .quick-tag-filters {
      margin: 1rem 0;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .quick-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .quick-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      border: 2px solid #e1e5e9;
      padding: 0.4rem 0.8rem;
      border-radius: 16px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }

    .quick-tag:hover {
      border-color: #667eea;
    }

    .quick-tag.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .quick-tag .tag-count {
      background: #6c757d;
      color: white;
      padding: 0.1rem 0.4rem;
      border-radius: 8px;
      font-size: 0.7rem;
    }

    .quick-tag.active .tag-count {
      background: rgba(255, 255, 255, 0.3);
    }

    .active-tag {
      background: #495057;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      font-size: 0.7rem;
      margin-left: 0.3rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .active-tag button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0;
    }

    /* Tag & Category Manager Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 0;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e1e5e9;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0.5rem;
      border-radius: 4px;
    }

    .btn-close:hover {
      background: #f8f9fa;
    }

    .modal-body {
      padding: 1.5rem;
      max-height: calc(80vh - 80px);
      overflow-y: auto;
    }

    /* Management Tabs */
    .management-tabs {
      display: flex;
      border-bottom: 1px solid #e1e5e9;
      margin-bottom: 1.5rem;
    }

    .tab-button {
      padding: 0.75rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      font-weight: 600;
      color: #6c757d;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-button:hover {
      color: #495057;
      background: #f8f9fa;
    }

    .tab-button.active {
      color: #667eea;
      border-bottom-color: #667eea;
      background: #f8f9fa;
    }

    .tab-content {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Categories Sections */
    .categories-section {
      margin-bottom: 2rem;
    }

    .categories-section h4 {
      margin-bottom: 1rem;
      color: #495057;
      font-size: 1.1rem;
      border-bottom: 2px solid #f1f3f4;
      padding-bottom: 0.5rem;
    }

    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .category-manager-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .category-manager-item.custom {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
    }

    .category-manager-item:hover {
      background: #e9ecef;
    }

    .category-visual {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .category-manager-icon {
      font-size: 1.2rem;
    }

    .category-color-preview {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .category-manager-name {
      flex: 1;
      font-weight: 600;
      color: #495057;
    }

    .category-manager-actions {
      display: flex;
      gap: 0.5rem;
    }

    .category-badge-system {
      background: #6c757d;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .btn-category-delete {
      background: #e74c3c;
      color: white;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-category-delete:disabled {
      background: #95a5a6;
      cursor: not-allowed;
    }

    .btn-category-delete:hover:not(:disabled) {
      background: #c0392b;
      transform: scale(1.1);
    }

    .add-category-form {
      margin-top: 1rem;
    }

    .add-category-form h5 {
      margin-bottom: 0.75rem;
      color: #495057;
    }

    .category-create-form {
      display: flex;
      gap: 1rem;
    }

    .category-create-form .form-control {
      flex: 1;
    }

    /* Empty States */
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
      font-style: italic;
      background: #f8f9fa;
      border-radius: 8px;
      border: 2px dashed #dee2e6;
    }

    /* Error Message */
    .error-message {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #fdf2f2;
      border-radius: 4px;
      border-left: 3px solid #e74c3c;
    }

    .create-tag-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e1e5e9;
    }

    .tag-create-form {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .tag-create-form .form-control {
      flex: 1;
    }

    .tag-cloud-section h4 {
      margin-bottom: 1rem;
      color: #333;
    }

    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .tag-cloud-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8f9fa;
      padding: 0.5rem 0.8rem;
      border-radius: 20px;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .tag-cloud-item:hover {
      border-color: #667eea;
    }

    .tag-name {
      cursor: pointer;
      font-weight: 500;
      color: #495057;
    }

    .tag-count {
      background: #667eea;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .btn-tag-delete {
      background: #e74c3c;
      color: white;
      border: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-tag-delete:disabled {
      background: #95a5a6;
      cursor: not-allowed;
    }

    .selected-tags-actions {
      padding-top: 1.5rem;
      border-top: 1px solid #e1e5e9;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    /* NEW BEAUTIFUL DASHBOARD STYLES */
    .view-toggle-container {
      margin-bottom: 2rem;
    }

    .view-toggle {
      display: inline-flex;
      background: white;
      padding: 0.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e1e5e9;
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
      color: #666;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 140px;
    }

    .toggle-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
      transform: translateY(-2px);
    }

    .toggle-btn:hover:not(.active) {
      background: #f8f9fa;
      color: #333;
      transform: translateY(-1px);
    }

    .toggle-icon {
      font-size: 1.2rem;
    }

    .toggle-text {
      font-size: 0.95rem;
    }

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
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #f0f0f0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--card-color), transparent);
    }

    .stat-card.primary { --card-color: #667eea; }
    .stat-card.success { --card-color: #28a745; }
    .stat-card.warning { --card-color: #ffc107; }
    .stat-card.info { --card-color: #17a2b8; }
    .stat-card.danger { --card-color: #e74c3c; }
    .stat-card.dark { --card-color: #343a40; }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
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
      color: #2d3748;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #718096;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-trend {
      font-size: 0.85rem;
      color: #a0aec0;
      font-weight: 500;
    }

    .progress-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: var(--card-color);
      border-radius: 3px;
      transition: width 1s ease-in-out;
    }

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
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #f0f0f0;
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
      color: #2d3748;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .chart-actions {
      display: flex;
      gap: 0.5rem;
    }

    .chart-action-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      color: #667eea;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chart-action-btn:hover {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

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
      background: conic-gradient(#667eea var(--progress), #e2e8f0 0deg);
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
      background: white;
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
      color: #2d3748;
    }

    .radial-label {
      display: block;
      font-size: 0.8rem;
      color: #718096;
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
      background: #f7fafc;
      border-radius: 12px;
    }

    .breakdown-item.completed .breakdown-dot {
      background: #28a745;
    }

    .breakdown-item.pending .breakdown-dot {
      background: #e2e8f0;
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
      color: #2d3748;
    }

    .breakdown-label {
      display: block;
      font-size: 0.85rem;
      color: #718096;
    }

    .priority-widget {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .priority-item {
      padding: 1rem;
      background: #f7fafc;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .priority-item:hover {
      background: #edf2f7;
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
      color: #718096;
    }

    .priority-percentage {
      font-size: 1rem;
      font-weight: 700;
      color: #2d3748;
    }

    .priority-bar {
      height: 6px;
      background: #e2e8f0;
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
      color: #a0aec0;
    }

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
      background: #f7fafc;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .category-item:hover {
      background: #edf2f7;
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
      color: #2d3748;
      flex: 1;
    }

    .category-count {
      font-weight: 700;
      color: #2d3748;
    }

    .category-bar {
      width: 80px;
      height: 6px;
      background: #e2e8f0;
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
      color: #718096;
    }

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
      background: #f7fafc;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .activity-item:hover {
      background: #edf2f7;
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
      background: #28a745;
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
      color: #2d3748;
      margin-bottom: 0.25rem;
    }

    .activity-details {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #718096;
    }

    .activity-type {
      font-weight: 600;
    }

    .activity-time {
      color: #a0aec0;
    }

    .activity-category, .activity-priority {
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .activity-category {
      background: #e2e8f0;
      color: #4a5568;
    }

    .activity-priority.high {
      background: #fed7d7;
      color: #c53030;
    }

    .activity-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .bottom-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

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
      background: #f7fafc;
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
      color: #718096;
      margin-bottom: 0.25rem;
    }

    .insight-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #2d3748;
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

    .recurrence-info {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .recurrence-badge {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 0.3rem 0.6rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .streak-badge {
      background: #ffd700;
      color: #333;
      padding: 0.3rem 0.6rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .streak-badge.hot-streak {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      animation: pulse 2s infinite;
    }

    .recurrence-options {
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #555;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.recurrence-settings {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .completion-widget {
        flex-direction: column;
        text-align: center;
      }
      
      .view-toggle {
        flex-direction: column;
      }
      
      .toggle-btn {
        min-width: auto;
        justify-content: center;
      }
      
      .tasks-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .tasks-header h1 {
        font-size: 2rem;
      }
      
      .task-header {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .task-actions-bottom {
        flex-wrap: wrap;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .filters-grid {
        grid-template-columns: 1fr;
      }
      
      .filters-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .management-tabs {
        flex-direction: column;
      }
      
      .tab-button {
        border-bottom: 1px solid #e1e5e9;
        border-left: 3px solid transparent;
      }
      
      .tab-button.active {
        border-left-color: #667eea;
        border-bottom-color: #e1e5e9;
      }
      
      .category-create-form {
        flex-direction: column;
      }
      
      .tag-create-form {
        flex-direction: column;
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
  activeView: 'list' | 'stats' = 'list';
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

      // Tag filter with AND/OR logic
      if (this.filteredTags.length > 0 && task.tags) {
        if (this.tagFilterLogic === 'AND') {
          const hasAllTags = this.filteredTags.every(tag => task.tags!.includes(tag));
          if (!hasAllTags) return false;
        } else {
          const hasAnyTag = this.filteredTags.some(tag => task.tags!.includes(tag));
          if (!hasAnyTag) return false;
        }
      } else if (this.filteredTags.length > 0 && !task.tags) {
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
           this.filteredTags.length > 0 ||
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

  // UPDATED: Calculate habit streak using new flat recurrence fields
  calculateHabitStreak(task: Task): number {
    if (!task.isRecurring || task.recurrencePattern === 'none' || !task.completedInstances) return 0;
    
    const completedDates = task.completedInstances
      .map((instance: string) => new Date(instance))
      .sort((a: Date, b: Date) => b.getTime() - a.getTime());
    
    if (completedDates.length === 0) return 0;
    
    // Start with the most recent completion
    let currentDate = new Date(completedDates[0]);
    let streak = 1;
    
    // Check previous days for consecutive completions
    for (let i = 1; i < completedDates.length; i++) {
      const previousDay = new Date(currentDate);
      previousDay.setDate(previousDay.getDate() - 1);
      
      const completedDate = new Date(completedDates[i]);
      
      // Compare dates without time
      if (completedDate.toDateString() === previousDay.toDateString()) {
        streak++;
        currentDate = completedDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // UPDATED: Get recurrence text using new flat recurrence fields
  getRecurrenceText(task: Task): string {
    if (!task.isRecurring || task.recurrencePattern === 'none') return '';
    
    const pattern = task.recurrencePattern;
    const interval = task.recurrenceInterval;
    
    switch (pattern) {
      case 'daily':
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case 'weekly':
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case 'monthly':
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      case 'yearly':
        return interval === 1 ? 'Yearly' : `Every ${interval} years`;
      default:
        return '';
    }
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
  
  // UPDATED: Fixed task ID handling (numbers instead of strings)
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
  
  // UPDATED: Fixed task ID handling (numbers instead of strings)
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