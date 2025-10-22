import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, CreateTaskRequest } from '../../models/task.model';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, CdkDragPlaceholder, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

interface Category {
  name: string;
  color: string;
  icon: string;
  custom?: boolean;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CdkDrag,
    CdkDropList, 
    CdkDropListGroup,
    CdkDragPlaceholder
  ],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <div class="calendar-nav">
          <button class="nav-btn" (click)="previousPeriod()">‹</button>
          <h2 class="calendar-title">
            @if (viewMode === 'year') {
              {{ currentYear }}
            } @else {
              {{ currentMonth }} {{ currentYear }}
            }
          </h2>
          <button class="nav-btn" (click)="nextPeriod()">›</button>
        </div>
        
        <div class="view-options">
          <button 
            class="view-option" 
            [class.active]="viewMode === 'month'"
            (click)="setViewMode('month')"
          >
            Month
          </button>
          <button 
            class="view-option" 
            [class.active]="viewMode === 'week'"
            (click)="setViewMode('week')"
          >
            Week
          </button>
          <button 
            class="view-option" 
            [class.active]="viewMode === 'year'"
            (click)="setViewMode('year')"
          >
            Year
          </button>
        </div>
      </div>

      <!-- Month View -->
      @if (viewMode === 'month') {
        <div class="month-view">
          <div class="calendar-grid">
            <div class="weekday-header" *ngFor="let day of weekdays">
              {{ day }}
            </div>
            
            @for (day of calendarDays; track day.date.getTime()) {
              <div 
                class="calendar-day" 
                [class.current-month]="day.isCurrentMonth"
                [class.today]="day.isToday"
                [class.has-tasks]="day.tasks.length > 0"
                [class.has-completed-tasks]="hasCompletedTasks(day.tasks)"
                (click)="onDayClick(day, $event)"
              >
                <div class="day-number">{{ day.date.getDate() }}</div>
                
                @if (day.tasks.length > 0) {
                  <div class="task-indicators">
                    @for (task of getTopTasks(day.tasks, 3); track task.id) {
                      <div 
                        class="task-indicator"
                        [class.completed]="task.completed"
                        [style.background]="task.completed ? '#28a745' : getPriorityColor(task.priority)"
                        [title]="getTaskTooltip(task)"
                        (click)="toggleTaskCompletionFromCalendar(task.id, $event)"
                      ></div>
                    }
                    @if (day.tasks.length > 3) {
                      <div class="more-tasks">+{{ day.tasks.length - 3 }}</div>
                    }
                  </div>
                } @else {
                  <div class="add-task-hint" *ngIf="day.isCurrentMonth">
                    <span class="plus-icon">+</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Week View -->
      @if (viewMode === 'week') {
        <div class="week-view">
          <div class="week-header">
            @for (day of currentWeekDays; track day; let i = $index) {
              <div 
                class="week-day-header"
                [class.current-month]="isCurrentMonthWeek(day)"
                (click)="onWeekDayClick(day, $event)"
              >
                <div class="week-day-name">{{ getWeekdayName(day) }}</div>
                <div class="week-date">{{ day.getDate() }}</div>
                <div class="day-stats">
                  <span class="completed-count">{{ getCompletedTasksForDate(day) }}</span>
                  <span class="total-count">/{{ getTasksForDate(day).length }}</span>
                </div>
                <div class="add-task-hint-week">
                  <span class="plus-icon">+</span>
                </div>
              </div>
            }
          </div>
          
          <div class="week-grid" cdkDropListGroup>
            @for (day of currentWeekDays; track day; let i = $index) {
              <div 
                class="week-day-column"
                cdkDropList
                [cdkDropListData]="{ day: day, tasks: getTasksForDate(day) }"
                [id]="'day-' + i"
                (cdkDropListDropped)="onTaskDrop($event)"
                (click)="onWeekDayColumnClick(day, $event)"
              >
                <div class="week-day-tasks">
                  @for (task of getTasksForDate(day); track task.id) {
                    <div 
                      class="week-task-item"
                      cdkDrag
                      [class.completed]="task.completed"
                      (click)="toggleTaskCompletionFromCalendar(task.id, $event)"
                    >
                      <div class="week-task-content">
                        <div class="week-task-title">
                          @if (task.completed) {
                            <span class="completion-check">✓</span>
                          }
                          {{ task.title }}
                        </div>
                        <div class="week-task-meta">
                          <span class="week-task-time">{{ formatTime(task.dueDate) }}</span>
                          @if (task.completed) {
                            <span class="completed-badge">Completed</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                  
                  @if (getTasksForDate(day).length === 0) {
                    <div class="drop-zone">
                      <div class="drop-zone-content">
                        <div class="drop-zone-plus">+</div>
                        <div class="drop-zone-text">Drop tasks here or click to add</div>
                      </div>
                    </div>
                  }
                </div>
                
                <!-- Drag placeholder using the directive -->
                <div class="task-drag-placeholder" *cdkDragPlaceholder></div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Enhanced Year View -->
      @if (viewMode === 'year') {
        <div class="year-view">
          <div class="year-grid">
            @for (monthData of getYearViewMonths(); track monthData.month; let i = $index) {
              <div 
                class="year-month"
                [class.has-completed-tasks]="getCompletedTasksForMonth(monthData.tasks) > 0"
                [class.all-tasks-completed]="getCompletedTasksForMonth(monthData.tasks) === monthData.tasks.length && monthData.tasks.length > 0"
                (click)="onYearMonthClick(monthData, $event)"
              >
                <div class="month-header">
                  <h4>{{ monthData.month }}</h4>
                  <div class="month-stats">
                    <!-- Enhanced completion stats -->
                    <div class="completion-progress">
                      <div class="progress-bar">
                        <div 
                          class="progress-fill" 
                          [style.width.%]="getCompletionPercentage(monthData.tasks)"
                          [class.full-completion]="getCompletionPercentage(monthData.tasks) === 100"
                        ></div>
                      </div>
                      <span class="completion-text">
                        {{ getCompletedTasksForMonth(monthData.tasks) }}/{{ monthData.tasks.length }}
                      </span>
                    </div>
                  </div>
                  <div class="add-task-hint-year">
                    <span class="plus-icon">+</span>
                  </div>
                </div>
                
                <div class="month-tasks">
                  @for (task of monthData.tasks.slice(0, 5); track task.id) {
                    <div 
                      class="year-task-item"
                      [class.completed]="task.completed"
                      [class.pending]="!task.completed"
                      [style.background]="task.completed ? '#28a745' : getPriorityColor(task.priority)"
                      [style.opacity]="task.completed ? '1' : '0.9'"
                      (click)="toggleTaskCompletionFromCalendar(task.id, $event)"
                    >
                      <div class="year-task-content">
                        <div class="year-task-title">
                          @if (task.completed) {
                            <span class="completion-check">✅</span>
                          } @else {
                            <span class="pending-indicator">⏳</span>
                          }
                          {{ task.title }}
                        </div>
                        <div class="year-task-status">
                          @if (task.completed) {
                            <span class="status-completed">Completed</span>
                          } @else {
                            <span class="status-pending">Pending</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                  @if (monthData.tasks.length > 5) {
                    <div class="more-tasks-year">
                      +{{ monthData.tasks.length - 5 }} more
                      <span class="more-tasks-stats">
                        ({{ getCompletedTasksForMonth(monthData.tasks.slice(5)) }} completed)
                      </span>
                    </div>
                  }
                  @if (monthData.tasks.length === 0) {
                    <div class="empty-month">
                      <span class="empty-month-text">No tasks</span>
                      <span class="empty-month-hint">Click to add task</span>
                    </div>
                  }
                </div>

                <!-- Month completion summary -->
                @if (monthData.tasks.length > 0) {
                  <div class="month-completion-summary">
                    <div class="completion-badge" [class.full-completion]="getCompletionPercentage(monthData.tasks) === 100">
                      {{ getCompletionPercentage(monthData.tasks) }}%
                    </div>
                    <span class="summary-text">
                      @if (getCompletionPercentage(monthData.tasks) === 100) {
                        🎉 All tasks completed!
                      } @else if (getCompletionPercentage(monthData.tasks) >= 75) {
                        🔥 Almost there!
                      } @else if (getCompletionPercentage(monthData.tasks) >= 50) {
                        📈 Good progress!
                      } @else if (getCompletionPercentage(monthData.tasks) > 0) {
                        🚀 Getting started!
                      } @else {
                        💪 Ready to begin!
                      }
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Selected Day Details -->
      @if (selectedDay) {
        <div class="day-details">
          <div class="day-details-header">
            <h3>Tasks for {{ formatDate(selectedDay.date) }}</h3>
            <div class="day-summary">
              <span class="completed-summary">
                {{ getCompletedTasks(selectedDay.tasks) }} of {{ selectedDay.tasks.length }} completed
              </span>
            </div>
            <button class="close-btn" (click)="selectedDay = null">×</button>
          </div>
          
          <div class="day-tasks-list">
            @for (task of selectedDay.tasks; track task.id) {
              <div class="day-task-item" [class.completed]="task.completed">
                <div class="task-checkbox">
                  <input 
                    type="checkbox" 
                    [checked]="task.completed"
                    (change)="toggleTaskCompletion(task.id)"
                  >
                </div>
                
                <div class="task-content">
                  <div class="task-title">
                    @if (task.completed) {
                      <span class="completion-check">✓</span>
                    }
                    {{ task.title }}
                  </div>
                  <div class="task-meta">
                    @if (task.category) {
                      <span class="task-category">{{ task.category }}</span>
                    }
                    <span class="task-priority" [style.color]="getPriorityColor(task.priority)">
                      {{ getPriorityText(task.priority) }}
                    </span>
                    @if (task.completed) {
                      <span class="completed-badge">Completed</span>
                    }
                  </div>
                </div>
                
                <div class="task-actions">
                  <button class="btn-small" (click)="editTask(task.id)">Edit</button>
                </div>
              </div>
            }
            
            @if (selectedDay.tasks.length === 0) {
              <div class="no-tasks">No tasks for this day</div>
            }
          </div>
        </div>
      }

      <!-- Enhanced Create Task Modal -->
      @if (showCreateTaskModal && selectedDateForNewTask) {
        <div class="modal-overlay" (click)="closeCreateTaskModal()">
          <div class="modal-content create-task-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create New Task</h3>
              <div class="selected-date">
                <strong>Date:</strong> {{ formatDateForModal(selectedDateForNewTask) }}
              </div>
              <button class="close-btn" (click)="closeCreateTaskModal()">×</button>
            </div>
            
            <div class="modal-body">
              <form (ngSubmit)="createTaskFromModal()">
                <div class="form-group">
                  <input 
                    type="text" 
                    class="form-control"
                    placeholder="Task title"
                    [(ngModel)]="newTaskTitle"
                    name="title"
                    required
                    #titleInput
                    autofocus
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
                    [value]="getFormattedDueDate()"
                    (change)="onDueDateChange($event)"
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
                  <button type="submit" class="btn btn-primary" [disabled]="!newTaskTitle.trim()">
                    Create Task
                  </button>
                  <button type="button" class="btn btn-secondary" (click)="closeCreateTaskModal()">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- Month Selection Modal for Year View -->
      @if (showMonthSelectionModal && selectedYearMonth) {
        <div class="modal-overlay" (click)="closeMonthSelectionModal()">
          <div class="modal-content month-selection-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Select Day in {{ selectedYearMonth.month }} {{ selectedYearMonth.year }}</h3>
              <button class="close-btn" (click)="closeMonthSelectionModal()">×</button>
            </div>
            
            <div class="modal-body">
              <div class="month-days-grid">
                <div class="month-days-weekdays">
                  @for (weekday of weekdays; track weekday) {
                    <div class="month-days-weekday">{{ weekday }}</div>
                  }
                </div>
                
                <div class="month-days-calendar">
                  @for (day of getMonthDaysForSelection(); track day.date.getTime()) {
                    <div 
                      class="month-day"
                      [class.current-month]="day.isCurrentMonth"
                      [class.today]="day.isToday"
                      [class.has-tasks]="day.tasks.length > 0"
                      (click)="onMonthDaySelect(day, $event)"
                    >
                      <div class="month-day-number">{{ day.date.getDate() }}</div>
                      @if (day.tasks.length > 0) {
                        <div class="month-day-tasks">
                          <div class="month-day-task-dot"></div>
                          @if (day.tasks.length > 1) {
                            <div class="month-day-task-count">+{{ day.tasks.length - 1 }}</div>
                          }
                        </div>
                      } @else {
                        <div class="add-task-hint-month">
                          <span class="plus-icon">+</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
              
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="closeMonthSelectionModal()">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .calendar-container {
      background: var(--bg-primary);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-color);
      transition: all var(--transition-normal);
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .calendar-nav {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .nav-btn {
      background: var(--accent-primary);
      color: var(--text-light);
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-normal);
    }

    .nav-btn:hover {
      background: var(--accent-hover);
      transform: scale(1.1);
      box-shadow: var(--shadow-accent);
    }

    .calendar-title {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.5rem;
      font-weight: 700;
      min-width: 200px;
      text-align: center;
    }

    .view-options {
      display: flex;
      gap: 0.5rem;
      background: var(--bg-secondary);
      padding: 0.25rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .view-option {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      color: var(--text-muted);
      transition: all var(--transition-normal);
    }

    .view-option.active {
      background: var(--bg-primary);
      color: var(--accent-primary);
      box-shadow: var(--shadow-sm);
    }

    .view-option:hover:not(.active) {
      color: var(--text-primary);
      background: var(--bg-tertiary);
    }

    /* Month View Styles */
    .month-view {
      margin-bottom: 2rem;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: var(--border-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }

    .weekday-header {
      background: var(--bg-secondary);
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 2px solid var(--border-color);
    }

    .calendar-day {
      background: var(--bg-primary);
      padding: 0.75rem;
      min-height: 120px;
      cursor: pointer;
      transition: all var(--transition-normal);
      border: 1px solid transparent;
      position: relative;
    }

    .calendar-day:hover {
      background: var(--bg-secondary);
      border-color: var(--accent-primary);
    }

    .calendar-day.current-month {
      background: var(--bg-primary);
    }

    .calendar-day:not(.current-month) {
      background: var(--bg-tertiary);
      color: var(--text-muted);
      cursor: not-allowed;
    }

    .calendar-day:not(.current-month):hover {
      background: var(--bg-tertiary) !important;
    }

    .calendar-day.today {
      background: var(--accent-primary);
      color: var(--text-light);
      border-color: var(--accent-primary);
    }

    .calendar-day.today .day-number {
      color: var(--text-light);
    }

    .calendar-day.has-tasks {
      border-bottom: 3px solid var(--accent-primary);
    }

    .calendar-day.has-completed-tasks {
      background: linear-gradient(135deg, var(--bg-primary) 0%, #f0f9f0 100%);
    }

    .day-number {
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
      color: var(--text-primary);
    }

    .task-indicators {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      margin-top: 0.25rem;
    }

    .task-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .task-indicator.completed {
      border: 1px solid white;
      box-shadow: 0 0 2px rgba(40, 167, 69, 0.5);
      animation: completePulse 0.5s ease;
    }

    .task-indicator:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-secondary);
      color: var(--text-primary);
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      white-space: nowrap;
      z-index: 1000;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      transform: scale(1.3);
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
    }

    .more-tasks {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-left: 2px;
    }

    /* Add Task Hint for Empty Days */
    .add-task-hint {
      text-align: center;
      margin-top: 0.5rem;
    }

    .plus-icon {
      color: var(--text-muted);
      font-size: 1.2rem;
      font-weight: bold;
      opacity: 0;
      transition: all var(--transition-normal);
    }

    .calendar-day:hover .plus-icon {
      opacity: 1;
      color: var(--accent-primary);
    }

    .calendar-day:not(.current-month) .add-task-hint {
      display: none;
    }

    /* Week View Styles with Drag & Drop */
    .week-view {
      margin-bottom: 2rem;
    }

    .week-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: var(--bg-secondary);
      border-radius: 8px 8px 0 0;
      border: 1px solid var(--border-color);
    }

    .week-day-header {
      padding: 1rem;
      text-align: center;
      border-right: 1px solid var(--border-color);
      cursor: pointer;
      transition: all var(--transition-normal);
      position: relative;
    }

    .week-day-header:hover {
      background: var(--bg-tertiary);
    }

    .week-day-header:last-child {
      border-right: none;
    }

    .week-day-name {
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .week-date {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .day-stats {
      display: flex;
      gap: 0.5rem;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      justify-content: center;
    }

    .completed-count {
      color: #28a745;
      font-weight: 600;
    }

    .total-count {
      color: var(--text-muted);
    }

    /* Add Task Hint for Week Day Headers */
    .add-task-hint-week {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }

    .week-day-header:hover .plus-icon {
      opacity: 1;
      color: var(--accent-primary);
    }

    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border: 1px solid var(--border-color);
      border-top: none;
      border-radius: 0 0 8px 8px;
      min-height: 400px;
    }

    .week-day-column {
      border-right: 1px solid var(--border-color);
      min-height: 400px;
      transition: all var(--transition-normal);
      background: var(--bg-primary);
      cursor: pointer;
      position: relative;
    }

    .week-day-column:hover {
      background: var(--bg-secondary);
    }

    .week-day-column:last-child {
      border-right: none;
    }

    .week-day-column.cdk-drop-list-dragging {
      background: var(--bg-tertiary);
    }

    .week-day-tasks {
      padding: 0.5rem;
      height: 100%;
    }

    .week-task-item {
      background: var(--bg-primary);
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 6px;
      border-left: 4px solid var(--accent-primary);
      box-shadow: var(--shadow-sm);
      cursor: grab;
      transition: all var(--transition-normal);
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .week-task-item.completed {
      opacity: 0.8;
      background: linear-gradient(135deg, var(--bg-primary) 0%, #f0f9f0 100%);
      animation: completeSlide 0.3s ease;
    }

    .week-task-item.completed .week-task-title {
      text-decoration: line-through;
      color: var(--text-muted);
    }

    .week-task-item:hover {
      transform: translateX(2px);
      box-shadow: var(--shadow-md);
      background: var(--bg-secondary);
      transform: translateX(5px);
      box-shadow: var(--shadow-lg);
    }

    .week-task-item:active {
      cursor: grabbing;
      transform: rotate(5deg);
      box-shadow: var(--shadow-lg);
    }

    .week-task-content {
      flex: 1;
    }

    .week-task-title {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
    }

    .completion-check {
      color: #28a745;
      font-weight: bold;
      margin-right: 0.5rem;
    }

    .week-task-meta {
      display: flex;
      gap: 0.5rem;
      font-size: 0.8rem;
      align-items: center;
    }

    .week-task-time {
      color: var(--text-muted);
    }

    .completed-badge {
      background: #28a745;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .task-drag-placeholder {
      opacity: 0.3;
      background: var(--accent-primary);
      border-radius: 6px;
      min-height: 50px;
      margin-bottom: 0.5rem;
    }

    .drop-zone {
      border: 2px dashed var(--border-color);
      border-radius: 6px;
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      margin: 0.5rem;
      transition: all var(--transition-normal);
      background: var(--bg-secondary);
      cursor: pointer;
      height: calc(100% - 1rem);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drop-zone:hover {
      border-color: var(--accent-primary);
      background: var(--bg-tertiary);
      color: var(--accent-primary);
    }

    .drop-zone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .drop-zone-plus {
      font-size: 2rem;
      font-weight: bold;
      color: var(--accent-primary);
    }

    .drop-zone-text {
      font-size: 0.9rem;
      font-weight: 600;
    }

    .week-day-column.cdk-drop-list-dragging .drop-zone {
      border-color: var(--accent-primary);
      background: var(--bg-tertiary);
      color: var(--accent-primary);
    }

    /* Drag & Drop Global Styles */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 6px;
      box-shadow: var(--shadow-lg);
      background: var(--bg-primary);
      padding: 0.75rem;
      border: 1px solid var(--border-color);
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .week-day-column.cdk-drop-list-dragging .week-task-item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* Enhanced Year View Styles */
    .year-view {
      margin-bottom: 2rem;
    }

    .year-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .year-month {
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all var(--transition-normal);
      min-height: 200px;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .year-month:hover {
      border-color: var(--accent-primary);
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
      background: var(--bg-secondary);
    }

    .year-month.has-completed-tasks {
      border-left: 4px solid #28a745;
      background: linear-gradient(135deg, var(--bg-primary) 0%, #f8fff9 100%);
    }

    .year-month.all-tasks-completed {
      border-color: #28a745;
      background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
      box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
    }

    .month-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border-color);
      position: relative;
    }

    .month-header h4 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.1rem;
      font-weight: 700;
    }

    .month-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }

    .completion-progress {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 120px;
    }

    .progress-bar {
      width: 60px;
      height: 8px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .progress-fill {
      height: 100%;
      background: #28a745;
      border-radius: 4px;
      transition: width 0.5s ease-in-out;
    }

    .progress-fill.full-completion {
      background: linear-gradient(90deg, #28a745, #20c997);
      box-shadow: 0 0 8px rgba(40, 167, 69, 0.5);
    }

    .completion-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
    }

    /* Add Task Hint for Year Month Headers */
    .add-task-hint-year {
      position: absolute;
      top: 0;
      right: 0;
    }

    .year-month:hover .plus-icon {
      opacity: 1;
      color: var(--accent-primary);
    }

    .month-tasks {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      margin-bottom: 1rem;
    }

    .year-task-item {
      padding: 0.75rem;
      border-radius: 8px;
      color: var(--text-light);
      font-size: 0.8rem;
      transition: all var(--transition-normal);
      border: 1px solid transparent;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .year-task-item.completed {
      background: #28a745 !important;
      border-color: #28a745;
      opacity: 1;
      transform: scale(1.02);
      animation: completeBounce 0.4s ease;
    }

    .year-task-item.pending {
      background: var(--accent-primary);
      border-color: var(--accent-primary);
      opacity: 0.9;
    }

    .year-task-item:hover {
      transform: translateX(3px);
      box-shadow: var(--shadow-md);
      transform: translateX(3px) scale(1.02);
      box-shadow: var(--shadow-md);
    }

    .year-task-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .year-task-title {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .completion-check {
      font-size: 0.9rem;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
    }

    .pending-indicator {
      font-size: 0.8rem;
      opacity: 0.9;
    }

    .year-task-status {
      font-size: 0.7rem;
      font-weight: 600;
      opacity: 0.9;
    }

    .status-completed {
      color: rgba(255, 255, 255, 0.9);
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }

    .status-pending {
      color: rgba(255, 255, 255, 0.8);
    }

    .more-tasks-year {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8rem;
      font-style: italic;
      padding: 0.75rem;
      background: var(--bg-tertiary);
      border-radius: 6px;
      border: 1px dashed var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .more-tasks-stats {
      font-size: 0.7rem;
      color: #28a745;
      font-weight: 600;
    }

    .empty-month {
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      justify-content: center;
      align-items: center;
    }

    .empty-month-text {
      font-size: 0.9rem;
    }

    .empty-month-hint {
      font-size: 0.8rem;
      color: var(--accent-primary);
      font-weight: 600;
    }

    /* Month Completion Summary */
    .month-completion-summary {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      justify-content: space-between;
    }

    .completion-badge {
      background: #28a745;
      color: white;
      padding: 0.4rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      min-width: 50px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
    }

    .completion-badge.full-completion {
      background: linear-gradient(135deg, #28a745, #20c997);
      box-shadow: 0 2px 12px rgba(40, 167, 69, 0.4);
      animation: pulse 2s infinite;
    }

    .summary-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
      flex: 1;
      text-align: right;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @keyframes completePulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.5); }
      100% { transform: scale(1); }
    }

    @keyframes completeSlide {
      0% { transform: translateX(0); }
      50% { transform: translateX(10px); }
      100% { transform: translateX(0); }
    }

    @keyframes completeBounce {
      0%, 20%, 53%, 80%, 100% { transform: translateX(0) scale(1); }
      40%, 43% { transform: translateX(0) scale(1.1); }
      70% { transform: translateX(0) scale(1.05); }
      90% { transform: translateX(0) scale(1.02); }
    }

    /* Month Selection Modal Styles */
    .month-selection-modal {
      max-width: 600px;
    }

    .month-days-grid {
      background: var(--bg-primary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .month-days-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .month-days-weekday {
      padding: 0.75rem;
      text-align: center;
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .month-days-calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: var(--border-color);
    }

    .month-day {
      background: var(--bg-primary);
      padding: 0.5rem;
      min-height: 60px;
      cursor: pointer;
      transition: all var(--transition-normal);
      border: 1px solid transparent;
      position: relative;
    }

    .month-day:hover {
      background: var(--bg-secondary);
      border-color: var(--accent-primary);
    }

    .month-day.current-month {
      background: var(--bg-primary);
    }

    .month-day:not(.current-month) {
      background: var(--bg-tertiary);
      color: var(--text-muted);
    }

    .month-day.today {
      background: var(--accent-primary);
      color: var(--text-light);
    }

    .month-day.today .month-day-number {
      color: var(--text-light);
    }

    .month-day.has-tasks {
      border-bottom: 2px solid var(--accent-primary);
    }

    .month-day-number {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .month-day-tasks {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-top: 0.25rem;
    }

    .month-day-task-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-primary);
    }

    .month-day-task-count {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .add-task-hint-month {
      text-align: center;
      margin-top: 0.25rem;
    }

    .month-day:hover .plus-icon {
      opacity: 1;
      color: var(--accent-primary);
    }

    /* Day Details Styles */
    .day-details {
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid var(--border-color);
      transition: all var(--transition-normal);
    }

    .day-details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .day-details-header h3 {
      margin: 0;
      color: var(--text-primary);
    }

    .day-summary {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .completed-summary {
      color: #28a745;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
      padding: 0.25rem;
      border-radius: 4px;
      transition: all var(--transition-normal);
    }

    .close-btn:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .day-tasks-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .day-task-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-primary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      transition: all var(--transition-normal);
    }

    .day-task-item.completed {
      background: linear-gradient(135deg, var(--bg-primary) 0%, #f0f9f0 100%);
    }

    .day-task-item.completed .task-title {
      text-decoration: line-through;
      color: var(--text-muted);
    }

    .day-task-item:hover {
      box-shadow: var(--shadow-md);
      background: var(--bg-secondary);
    }

    .task-checkbox input {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--accent-primary);
    }

    .task-content {
      flex: 1;
    }

    .task-title {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
    }

    .task-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      align-items: center;
    }

    .task-category {
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .task-priority {
      font-weight: 600;
    }

    .task-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-small {
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all var(--transition-normal);
      color: var(--text-primary);
    }

    .btn-small:hover {
      background: var(--bg-secondary);
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }

    .no-tasks {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
      font-style: italic;
    }

    /* Enhanced Create Task Modal Styles */
    .create-task-modal {
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .create-task-modal .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .create-task-modal .modal-header h3 {
      margin: 0;
      color: var(--text-primary);
      flex: 1;
    }

    .selected-date {
      background: var(--bg-secondary);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      margin: 0 1rem;
      font-size: 0.9rem;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .create-task-modal .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 1rem;
      transition: all var(--transition-normal);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    .tag-input-container {
      position: relative;
    }

    .tag-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .tag-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .tag-badge {
      background: var(--accent-primary);
      color: var(--text-light);
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
      color: var(--text-light);
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

    .recurrence-options {
      margin-top: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--accent-primary);
    }

    .recurrence-settings {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .recurrence-hint {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: var(--bg-tertiary);
      border-radius: 4px;
      font-size: 0.9rem;
      color: var(--text-muted);
      text-align: center;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition-normal);
      flex: 1;
    }

    .btn-primary {
      background: var(--accent-primary);
      color: var(--text-light);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-accent);
    }

    .btn-primary:disabled {
      background: var(--text-muted);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-secondary {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--bg-tertiary);
      border-color: var(--accent-primary);
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .year-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .calendar-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .calendar-nav {
        justify-content: center;
      }

      .view-options {
        justify-content: center;
      }

      .calendar-grid {
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5px;
      }

      .calendar-day {
        min-height: 80px;
        padding: 0.5rem;
      }

      .week-header,
      .week-grid {
        grid-template-columns: 1fr;
      }

      .week-day-header,
      .week-day-column {
        border-right: none;
        border-bottom: 1px solid var(--border-color);
      }

      .week-day-header:last-child,
      .week-day-column:last-child {
        border-bottom: none;
      }

      .year-grid {
        grid-template-columns: 1fr;
      }

      .day-stats, .month-stats {
        flex-direction: column;
        gap: 0.1rem;
      }
      
      .week-day-header {
        padding: 0.5rem;
      }

      .modal-content {
        margin: 1rem;
        max-height: 90vh;
      }
      
      .modal-actions {
        flex-direction: column;
      }

      .add-task-hint-week {
        top: 0.25rem;
        right: 0.25rem;
      }

      .month-days-weekday {
        padding: 0.5rem;
        font-size: 0.8rem;
      }

      .month-day {
        min-height: 50px;
        padding: 0.25rem;
      }

      .month-day-number {
        font-size: 0.8rem;
      }

      .create-task-modal {
        margin: 1rem;
        max-height: 95vh;
      }

      .create-task-modal .modal-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .selected-date {
        margin: 0;
        text-align: center;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .month-header {
        flex-direction: column;
        gap: 0.75rem;
        align-items: stretch;
      }
      
      .month-stats {
        align-items: stretch;
      }
      
      .completion-progress {
        justify-content: space-between;
      }
      
      .month-completion-summary {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
      }
      
      .summary-text {
        text-align: center;
      }
    }
  `]
})
export class CalendarViewComponent implements OnInit {
  private taskService = inject(TaskService);

  tasks: Task[] = [];
  currentDate: Date = new Date();
  viewMode: 'month' | 'week' | 'year' = 'month';
  selectedDay: CalendarDay | null = null;
  
  // Enhanced task creation properties
  showCreateTaskModal = false;
  selectedDateForNewTask: Date | null = null;
  
  // Task form fields (same as in TasksComponent)
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskDueDate: string = '';
  newTaskPriority: number = 2;
  newTaskCategory: string = '';
  newTaskTagInput: string = '';
  newTaskTags: string[] = [];
  newTaskIsRecurring: boolean = false;
  newTaskRecurrencePattern: string = 'daily';
  newTaskRecurrenceInterval: number = 1;

  // Categories (same as in TasksComponent)
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
  
  // Month selection properties
  showMonthSelectionModal = false;
  selectedYearMonth: { month: string, year: number, monthIndex: number } | null = null;
  monthSelectionDays: CalendarDay[] = [];
  
  weekdays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  calendarDays: CalendarDay[] = [];
  currentWeekDays: Date[] = [];

  ngOnInit(): void {
    this.loadTasks();
    this.generateCalendar();
    this.generateWeekView();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks;
        this.generateCalendar();
        this.generateWeekView();
      },
      error: (error: any) => {
        console.error('Error loading tasks for calendar:', error);
      }
    });
  }

  get currentMonth(): string {
    return this.currentDate.toLocaleDateString('en-US', { month: 'long' });
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  setViewMode(mode: 'month' | 'week' | 'year'): void {
    this.viewMode = mode;
    if (mode === 'year') {
      this.currentDate = new Date(this.currentYear, 0, 1);
    }
  }

  previousPeriod(): void {
    if (this.viewMode === 'year') {
      this.currentDate = new Date(this.currentYear - 1, 0, 1);
    } else {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
      this.generateCalendar();
      this.generateWeekView();
    }
  }

  nextPeriod(): void {
    if (this.viewMode === 'year') {
      this.currentDate = new Date(this.currentYear + 1, 0, 1);
    } else {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
      this.generateCalendar();
      this.generateWeekView();
    }
  }

  generateCalendar(): void {
    this.calendarDays = [];
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const date = new Date(currentDate);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const tasks = this.getTasksForDate(date);
      
      this.calendarDays.push({
        date,
        isCurrentMonth,
        isToday,
        tasks
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  generateWeekView(): void {
    this.currentWeekDays = [];
    const currentDate = new Date(this.currentDate);
    
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      this.currentWeekDays.push(date);
    }
  }

  getTasksForDate(date: Date): Task[] {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return this.tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      
      return taskDate.getTime() === targetDate.getTime();
    });
  }

  hasCompletedTasks(tasks: Task[]): boolean {
    return tasks.some(task => task.completed);
  }

  getCompletedTasks(tasks: Task[]): number {
    return tasks.filter(task => task.completed).length;
  }

  getCompletedTasksForDate(date: Date): number {
    return this.getTasksForDate(date).filter(task => task.completed).length;
  }

  getCompletedTasksForMonth(tasks: Task[]): number {
    return tasks.filter(task => task.completed).length;
  }

  // NEW: Get completion percentage for progress bars
  getCompletionPercentage(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }

  getTaskTooltip(task: Task): string {
    const status = task.completed ? '✓ Completed' : '○ Pending';
    const priority = this.getPriorityText(task.priority);
    return `${task.title} - ${status} - ${priority} Priority`;
  }

  getTopTasks(tasks: Task[], limit: number): Task[] {
    const completed = tasks.filter(t => t.completed).slice(0, Math.ceil(limit / 2));
    const pending = tasks.filter(t => !t.completed).slice(0, limit - completed.length);
    return [...completed, ...pending].slice(0, limit);
  }

  getPriorityColor(priority: number): string {
    switch (priority) {
      case 3: return '#e74c3c';
      case 2: return '#f39c12';
      case 1: return '#27ae60';
      default: return '#667eea';
    }
  }

  getPriorityText(priority: number): string {
    switch (priority) {
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'Normal';
    }
  }

  getWeekdayName(date: Date): string {
    return this.weekdays[date.getDay()];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string | null | undefined): string {
    if (!dateString) return 'All day';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
  }

  // Enhanced task creation methods
  onDayClick(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isCurrentMonth) return;
    
    this.selectedDateForNewTask = new Date(day.date);
    this.initializeTaskForm();
    this.showCreateTaskModal = true;
  }

  onWeekDayClick(day: Date, event: Event): void {
    event.stopPropagation();
    if (!this.isCurrentMonthWeek(day)) return;
    
    this.selectedDateForNewTask = new Date(day);
    this.initializeTaskForm();
    this.showCreateTaskModal = true;
  }

  onWeekDayColumnClick(day: Date, event: Event): void {
    if ((event.target as HTMLElement).classList.contains('week-day-column') || 
        (event.target as HTMLElement).classList.contains('drop-zone')) {
      event.stopPropagation();
      if (!this.isCurrentMonthWeek(day)) return;
      
      this.selectedDateForNewTask = new Date(day);
      this.initializeTaskForm();
      this.showCreateTaskModal = true;
    }
  }

  onYearMonthClick(monthData: { month: string, year: number, tasks: Task[] }, event: Event): void {
    event.stopPropagation();
    
    const monthIndex = this.months.findIndex(m => m === monthData.month);
    this.selectedYearMonth = {
      month: monthData.month,
      year: monthData.year,
      monthIndex: monthIndex
    };
    
    this.showMonthSelectionModal = true;
    this.generateMonthSelectionDays();
  }

  onMonthDaySelect(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isCurrentMonth) return;
    
    this.selectedDateForNewTask = new Date(day.date);
    this.initializeTaskForm();
    this.showCreateTaskModal = true;
    this.closeMonthSelectionModal();
  }

  // Initialize the task form with default values
  private initializeTaskForm(): void {
    if (this.selectedDateForNewTask) {
      this.newTaskDueDate = this.selectedDateForNewTask.toISOString().split('T')[0];
    }
    
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskPriority = 2;
    this.newTaskCategory = 'Other';
    this.newTaskTags = [];
    this.newTaskTagInput = '';
    this.newTaskIsRecurring = false;
    this.newTaskRecurrencePattern = 'daily';
    this.newTaskRecurrenceInterval = 1;
  }

  // Get formatted due date for the date input
  getFormattedDueDate(): string {
    return this.newTaskDueDate;
  }

  // Handle due date changes
  onDueDateChange(event: any): void {
    this.newTaskDueDate = event.target.value;
  }

  // Tag management methods
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

  // Create task with all the form data
  createTaskFromModal(): void {
    if (!this.newTaskTitle.trim()) {
      return;
    }

    const newTask: CreateTaskRequest = {
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription,
      dueDate: this.newTaskDueDate,
      priority: this.newTaskPriority,
      category: this.newTaskCategory || 'Other',
      tags: this.newTaskTags,
      isRecurring: this.newTaskIsRecurring,
      recurrencePattern: this.newTaskIsRecurring ? this.newTaskRecurrencePattern : 'none',
      recurrenceInterval: this.newTaskIsRecurring ? this.newTaskRecurrenceInterval : 1
    };

    this.taskService.createTask(newTask).subscribe({
      next: (createdTask) => {
        this.tasks.push(createdTask);
        this.generateCalendar();
        this.generateWeekView();
        this.closeCreateTaskModal();
      },
      error: (error) => {
        console.error('Error creating task:', error);
      }
    });
  }

  closeCreateTaskModal(): void {
    this.showCreateTaskModal = false;
    this.selectedDateForNewTask = null;
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskDueDate = '';
    this.newTaskPriority = 2;
    this.newTaskCategory = '';
    this.newTaskTags = [];
    this.newTaskTagInput = '';
    this.newTaskIsRecurring = false;
    this.newTaskRecurrencePattern = 'daily';
    this.newTaskRecurrenceInterval = 1;
  }

  formatDateForModal(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Month selection methods
  generateMonthSelectionDays(): void {
    if (!this.selectedYearMonth) return;
    
    this.monthSelectionDays = [];
    
    const year = this.selectedYearMonth.year;
    const month = this.selectedYearMonth.monthIndex;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const date = new Date(currentDate);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const tasks = this.getTasksForDate(date);
      
      this.monthSelectionDays.push({
        date,
        isCurrentMonth,
        isToday,
        tasks
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  getMonthDaysForSelection(): CalendarDay[] {
    return this.monthSelectionDays;
  }

  closeMonthSelectionModal(): void {
    this.showMonthSelectionModal = false;
    this.selectedYearMonth = null;
    this.monthSelectionDays = [];
  }

  isCurrentMonthWeek(day: Date): boolean {
    return day.getMonth() === this.currentDate.getMonth();
  }

  // Drag & Drop Methods for Week View
  getAllDropLists(): string[] {
    return this.currentWeekDays.map((_, index) => `day-${index}`);
  }

  onTaskDrop(event: CdkDragDrop<any>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data.tasks,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const previousTasks = [...event.previousContainer.data.tasks];
      const currentTasks = [...event.container.data.tasks];
      const task = previousTasks[event.previousIndex];
      
      const newDueDate = event.container.data.day;
      this.updateTaskDueDate(task.id, newDueDate);
      
      transferArrayItem(
        previousTasks,
        currentTasks,
        event.previousIndex,
        event.currentIndex
      );

      event.previousContainer.data.tasks = previousTasks;
      event.container.data.tasks = currentTasks;
    }
  }

  // Year View Methods
  getYearViewMonths(): { month: string, year: number, tasks: Task[] }[] {
    const currentYear = this.currentDate.getFullYear();
    
    return this.months.map((month, index) => {
      const monthTasks = this.tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.getFullYear() === currentYear && 
               taskDate.getMonth() === index;
      });
      
      return {
        month,
        year: currentYear,
        tasks: monthTasks
      };
    });
  }

  // Common method to update task due date
  updateTaskDueDate(taskId: number, newDueDate: Date): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      const formattedDate = newDueDate.toISOString().split('T')[0];
      
      this.taskService.updateTask(taskId, {
        ...task,
        dueDate: formattedDate
      }).subscribe({
        next: (updatedTask) => {
          const index = this.tasks.findIndex(t => t.id === taskId);
          if (index !== -1) {
            this.tasks[index] = updatedTask;
            this.generateCalendar();
            this.generateWeekView();
          }
        },
        error: (error) => {
          console.error('Error updating task date:', error);
          this.generateCalendar();
          this.generateWeekView();
        }
      });
    }
  }

  toggleTaskCompletion(taskId: number): void {
    this.taskService.toggleTaskCompletion(taskId).subscribe({
      next: (updatedTask: Task) => {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          this.generateCalendar();
          this.generateWeekView();
        }
      },
      error: (error: any) => {
        console.error('Error updating task:', error);
      }
    });
  }

  toggleTaskCompletionFromCalendar(taskId: number, event: Event): void {
    event.stopPropagation(); // Prevent triggering day/month click events
    
    this.taskService.toggleTaskCompletion(taskId).subscribe({
      next: (updatedTask: Task) => {
        // Update the task in the local array
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          
          // Regenerate calendar views to reflect the change
          this.generateCalendar();
          this.generateWeekView();
        }
      },
      error: (error: any) => {
        console.error('Error updating task completion:', error);
      }
    });
  }

  editTask(taskId: number): void {
    console.log('Edit task:', taskId);
  }
}