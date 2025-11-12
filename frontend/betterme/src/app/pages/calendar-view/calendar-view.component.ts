import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, CreateTaskRequest, UpdateTaskRequest, RecurrencePattern } from '../../models/task.model';
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

interface EditModalData {
  taskId: number;
  task: Task | null;
  isOpen: boolean;
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
    <div class="calendar-page">
      <!-- Background Decoration -->
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="container">
        <div class="calendar-container">
          <!-- Header Section -->
          <div class="calendar-header glass-card">
            <div class="header-content">
              <div class="calendar-nav-section">
                <div class="calendar-nav">
                  <button class="nav-btn" (click)="previousPeriod()">
                    <span class="nav-icon">‹</span>
                  </button>
                  <h1 class="calendar-title gradient-text">
                    @if (viewMode === 'year') {
                      {{ currentYear }}
                    } @else {
                      {{ currentMonth }} {{ currentYear }}
                    }
                  </h1>
                  <button class="nav-btn" (click)="nextPeriod()">
                    <span class="nav-icon">›</span>
                  </button>
                </div>
                
                <div class="view-options">
                  <button 
                    class="view-option" 
                    [class.active]="viewMode === 'month'"
                    (click)="setViewMode('month')"
                  >
                    <span class="view-icon">📅</span>
                    Month
                  </button>
                  <button 
                    class="view-option" 
                    [class.active]="viewMode === 'week'"
                    (click)="setViewMode('week')"
                  >
                    <span class="view-icon">📆</span>
                    Week
                  </button>
                  <button 
                    class="view-option" 
                    [class.active]="viewMode === 'year'"
                    (click)="setViewMode('year')"
                  >
                    <span class="view-icon">🗓️</span>
                    Year
                  </button>
                </div>
              </div>

              <div class="calendar-stats">
                <div class="stat-badge">
                  <span class="stat-icon">📊</span>
                  <span class="stat-text">{{ getTotalTasks() }} Total Tasks</span>
                </div>
                <div class="stat-badge">
                  <span class="stat-icon">✅</span>
                  <span class="stat-text">{{ getCompletedTasksCount() }} Completed</span>
                </div>
                <div class="stat-badge">
                  <span class="stat-icon">⏳</span>
                  <span class="stat-text">{{ getPendingTasksCount() }} Pending</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Calendar Content -->
          <div class="calendar-content">
            <!-- Month View -->
            @if (viewMode === 'month') {
              <div class="month-view glass-card">
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
                    >
                      <div class="day-header">
                        <span class="day-number">{{ day.date.getDate() }}</span>
                        @if (day.isToday) {
                          <span class="today-badge">Today</span>
                        }
                      </div>
                      
                      @if (day.tasks.length > 0) {
                        <div class="task-indicators">
                          @for (task of getTopTasks(day.tasks, 3); track task.id) {
                            <div 
                              class="task-indicator"
                              [class.completed]="task.completed"
                              [class.loading]="updatingTaskIds.has(task.id)"
                              [style.background]="task.completed ? '#4ade80' : getPriorityColor(task.priority)"
                              [title]="getTaskTooltip(task)"
                              (click)="toggleTaskCompletionFromCalendar(task.id, $event)"
                            >
                              @if (updatingTaskIds.has(task.id)) {
                                <span class="loading-spinner"></span>
                              }
                            </div>
                          }
                          @if (day.tasks.length > 3) {
                            <div class="more-tasks">+{{ day.tasks.length - 3 }}</div>
                          }
                        </div>
                      }
                      
                      <!-- Action buttons -->
                      <div class="day-actions" *ngIf="day.isCurrentMonth">
                        <button class="action-btn view-tasks-btn" 
                                (click)="selectDay(day)"
                                [disabled]="day.tasks.length === 0"
                                title="View tasks">
                          <span class="action-icon">👁️</span>
                        </button>
                        
                        <button class="action-btn add-task-btn" 
                                (click)="onDayClick(day, $event)"
                                title="Add task">
                          <span class="action-icon">+</span>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Week View -->
            @if (viewMode === 'week') {
              <div class="week-view glass-card">
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
                            [class.loading]="updatingTaskIds.has(task.id)"
                          >
                            <div class="drag-handle" cdkDragHandle>
                              <span class="drag-icon">⣿</span>
                            </div>
                            
                            <div 
                              class="week-task-content"
                              (click)="toggleTaskCompletionFromCalendar(task.id, $event)"
                            >
                              <div class="week-task-title">
                                @if (task.completed) {
                                  <span class="completion-check">✓</span>
                                }
                                {{ task.title }}
                                @if (updatingTaskIds.has(task.id)) {
                                  <span class="loading-spinner-small"></span>
                                }
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
                      
                      <div class="task-drag-placeholder" *cdkDragPlaceholder></div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Year View -->
            @if (viewMode === 'year') {
              <div class="year-view">
                <div class="year-grid">
                  @for (monthData of getYearViewMonths(); track monthData.month; let i = $index) {
                    <div 
                      class="year-month glass-card"
                      [class.has-completed-tasks]="getCompletedTasksForMonth(monthData.tasks) > 0"
                      [class.all-tasks-completed]="getCompletedTasksForMonth(monthData.tasks) === monthData.tasks.length && monthData.tasks.length > 0"
                      (click)="onYearMonthClick(monthData, $event)"
                    >
                      <div class="month-header">
                        <h4>{{ monthData.month }}</h4>
                        <div class="month-stats">
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
                            [class.loading]="updatingTaskIds.has(task.id)"
                            [style.background]="task.completed ? '#4ade80' : getPriorityColor(task.priority)"
                            (click)="toggleTaskCompletionFromCalendar(task.id, $event)"
                          >
                            <div class="year-task-content">
                              <div class="year-task-title">
                                @if (task.completed) {
                                  <span class="completion-check">✓</span>
                                } @else {
                                  <span class="pending-indicator">⏳</span>
                                }
                                {{ task.title }}
                              </div>
                            </div>
                          </div>
                        }
                        @if (monthData.tasks.length > 5) {
                          <div class="more-tasks-year">
                            +{{ monthData.tasks.length - 5 }} more tasks
                          </div>
                        }
                        @if (monthData.tasks.length === 0) {
                          <div class="empty-month">
                            <span class="empty-month-text">No tasks</span>
                            <span class="empty-month-hint">Click to add</span>
                          </div>
                        }
                      </div>

                      @if (monthData.tasks.length > 0) {
                        <div class="month-completion-summary">
                          <div class="completion-badge" [class.full-completion]="getCompletionPercentage(monthData.tasks) === 100">
                            {{ getCompletionPercentage(monthData.tasks) }}%
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Selected Day Details Modal -->
      @if (selectedDay) {
        <div class="modal-overlay" (click)="selectedDay = null">
          <div class="modal-content day-details-modal glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
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
                <div class="day-task-item" 
                     [class.completed]="task.completed"
                     [class.loading]="updatingTaskIds.has(task.id)">
                  <div class="task-checkbox">
                    <input 
                      type="checkbox" 
                      [checked]="task.completed"
                      (change)="toggleTaskCompletion(task.id)"
                      [disabled]="updatingTaskIds.has(task.id)"
                    >
                  </div>
                  
                  <div class="task-content">
                    <div class="task-title">
                      {{ task.title }}
                      @if (updatingTaskIds.has(task.id)) {
                        <span class="loading-spinner-small"></span>
                      }
                    </div>
                    <div class="task-meta">
                      @if (task.category) {
                        <span class="task-category">{{ task.category }}</span>
                      }
                      <span class="task-priority" [style.color]="getPriorityColor(task.priority)">
                        {{ getPriorityText(task.priority) }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="task-actions">
                    <button class="btn-small" 
                            (click)="editTask(task.id)"
                            [disabled]="updatingTaskIds.has(task.id)">
                      Edit
                    </button>
                  </div>
                </div>
              }
              
              @if (selectedDay.tasks.length === 0) {
                <div class="no-tasks">No tasks for this day</div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Create Task Modal -->
      @if (showCreateTaskModal && selectedDateForNewTask) {
        <div class="modal-overlay" (click)="closeCreateTaskModal()">
          <div class="modal-content create-task-modal glass-card" (click)="$event.stopPropagation()">
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

      <!-- Edit Task Modal -->
      @if (editModalData.isOpen) {
        <div class="modal-overlay" (click)="closeEditModal()">
          <div class="modal-content edit-task-modal glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Edit Task</h3>
              <button class="close-btn" (click)="closeEditModal()">×</button>
            </div>
            
            <div class="modal-body">
              @if (isEditing && !editModalData.task) {
                <div class="loading">
                  <div class="loading-spinner"></div>
                  Loading task...
                </div>
              }

              @if (editError) {
                <div class="error-message">{{ editError }}</div>
              }

              @if (editModalData.task || !isEditing) {
                <form (ngSubmit)="onUpdateTask()">
                  <div class="form-group">
                    <label class="form-label">Title</label>
                    <input 
                      type="text" 
                      class="form-control"
                      placeholder="Task title"
                      [(ngModel)]="editFormData.title"
                      name="title"
                      required
                      [disabled]="isEditing"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea 
                      class="form-control"
                      placeholder="Task description"
                      [(ngModel)]="editFormData.description"
                      name="description"
                      rows="3"
                      [disabled]="isEditing"
                    ></textarea>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Due Date</label>
                      <input 
                        type="date" 
                        class="form-control"
                        [value]="editFormData.dueDate"
                        (input)="editFormData.dueDate = $any($event.target).value"
                        name="dueDate"
                        [disabled]="isEditing"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Priority</label>
                      <select 
                        class="form-control"
                        [(ngModel)]="editFormData.priority"
                        name="priority"
                        [disabled]="isEditing"
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
                        [(ngModel)]="editFormData.completed"
                        name="completed"
                        [disabled]="isEditing"
                      />
                      <span class="checkmark"></span>
                      Mark as completed
                    </label>
                  </div>

                  <div class="form-actions">
                    <button 
                      type="submit" 
                      class="btn btn-primary"
                      [disabled]="isEditing"
                    >
                      {{ isEditing ? 'Updating...' : 'Update Task' }}
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-secondary"
                      (click)="closeEditModal()"
                      [disabled]="isEditing"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-danger"
                      (click)="onDeleteTask()"
                      [disabled]="isEditing"
                    >
                      Delete Task
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .calendar-page {
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
      padding: 2rem 1rem;
    }

    .calendar-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .calendar-header {
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 2rem;
    }

    .calendar-nav-section {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .calendar-nav {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .nav-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .nav-icon {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .calendar-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0;
      min-width: 300px;
      text-align: center;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .view-options {
      display: flex;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .view-option {
      padding: 0.75rem 1.5rem;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .view-option.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
    }

    .view-option:hover:not(.active) {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    .view-icon {
      font-size: 1.1rem;
    }

    .calendar-stats {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.75rem 1.25rem;
      border-radius: 20px;
      color: white;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .stat-icon {
      font-size: 1.1rem;
    }

    .calendar-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Month View Styles */
    .month-view {
      padding: 2rem;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .weekday-header {
      background: rgba(255, 255, 255, 0.15);
      padding: 1.5rem 1rem;
      text-align: center;
      font-weight: 700;
      color: white;
      font-size: 1.1rem;
    }

    .calendar-day {
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      min-height: 140px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid transparent;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .calendar-day:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .calendar-day.current-month {
      background: rgba(255, 255, 255, 0.08);
    }

    .calendar-day:not(.current-month) {
      background: rgba(255, 255, 255, 0.02);
      color: rgba(255, 255, 255, 0.4);
    }

    .calendar-day.today {
      background: linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(34, 211, 238, 0.2));
      border-color: rgba(74, 222, 128, 0.5);
    }

    .calendar-day.has-tasks {
      border-bottom: 3px solid #667eea;
    }

    .calendar-day.has-completed-tasks {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(74, 222, 128, 0.1) 100%);
    }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .day-number {
      font-weight: 700;
      font-size: 1.2rem;
      color: white;
    }

    .today-badge {
      background: #4ade80;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .task-indicators {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: auto;
    }

    .task-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .task-indicator.completed {
      border-color: white;
      box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
      animation: completePulse 0.5s ease;
    }

    .task-indicator.loading {
      opacity: 0.6;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .more-tasks {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      margin-left: 4px;
    }

    .day-actions {
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
    }

    .calendar-day:hover .day-actions {
      opacity: 1;
      transform: translateY(0);
    }

    .action-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 6px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      color: white;
    }

    .action-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .action-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .view-tasks-btn {
      background: #667eea;
    }

    .add-task-btn {
      background: #4ade80;
    }

    /* Loading Spinners */
    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-spinner-small {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-left: 0.5rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes completePulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    /* Week View Styles */
    .week-view {
      padding: 2rem;
    }

    .week-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: rgba(255, 255, 255, 0.15);
      border-radius: 16px 16px 0 0;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .week-day-header {
      padding: 1.5rem 1rem;
      text-align: center;
      border-right: 1px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .week-day-header:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .week-day-header:last-child {
      border-right: none;
    }

    .week-day-name {
      font-weight: 700;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }

    .week-date {
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
      margin-bottom: 0.5rem;
    }

    .day-stats {
      display: flex;
      gap: 0.25rem;
      font-size: 0.9rem;
      justify-content: center;
      color: rgba(255, 255, 255, 0.8);
    }

    .completed-count {
      color: #4ade80;
      font-weight: 700;
    }

    .total-count {
      color: rgba(255, 255, 255, 0.6);
    }

    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-top: none;
      border-radius: 0 0 16px 16px;
      min-height: 500px;
    }

    .week-day-column {
      border-right: 1px solid rgba(255, 255, 255, 0.2);
      min-height: 500px;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.05);
      cursor: pointer;
      position: relative;
    }

    .week-day-column:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .week-day-column:last-child {
      border-right: none;
    }

    .week-day-tasks {
      padding: 1rem;
      height: 100%;
    }

    .week-task-item {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem;
      margin-bottom: 0.75rem;
      border-radius: 12px;
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .week-task-item.completed {
      opacity: 0.8;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(74, 222, 128, 0.2) 100%);
    }

    .week-task-item.loading {
      opacity: 0.6;
      pointer-events: none;
    }

    .week-task-item.completed .week-task-title {
      text-decoration: line-through;
      color: rgba(255, 255, 255, 0.7);
    }

    .week-task-item:hover:not(.loading) {
      transform: translateX(4px);
      background: rgba(255, 255, 255, 0.15);
    }

    .drag-handle {
      cursor: grab;
      padding: 0.5rem;
      margin-right: 0.75rem;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .drag-handle:hover {
      background: #667eea;
    }

    .drag-icon {
      font-size: 0.8rem;
      opacity: 0.7;
      color: white;
    }

    .week-task-content {
      flex: 1;
      cursor: pointer;
    }

    .week-task-title {
      font-weight: 600;
      color: white;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .completion-check {
      color: #4ade80;
      font-weight: bold;
    }

    .week-task-meta {
      display: flex;
      gap: 0.75rem;
      font-size: 0.85rem;
      align-items: center;
    }

    .week-task-time {
      color: rgba(255, 255, 255, 0.7);
    }

    .completed-badge {
      background: #4ade80;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .drop-zone {
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      margin: 0.5rem;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.05);
      cursor: pointer;
      height: calc(100% - 1rem);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drop-zone:hover {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .drop-zone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .drop-zone-plus {
      font-size: 2rem;
      font-weight: bold;
    }

    .drop-zone-text {
      font-size: 0.9rem;
      font-weight: 600;
    }

    .task-drag-placeholder {
      opacity: 0.3;
      background: #667eea;
      border-radius: 12px;
      min-height: 60px;
      margin-bottom: 0.75rem;
    }

    /* Year View Styles */
    .year-view {
      padding: 0;
    }

    .year-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .year-month {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 280px;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .year-month:hover {
      border-color: #667eea;
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.15);
    }

    .year-month.has-completed-tasks {
      border-left: 4px solid #4ade80;
    }

    .year-month.all-tasks-completed {
      border-color: #4ade80;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(74, 222, 128, 0.15) 100%);
    }

    .month-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .month-header h4 {
      margin: 0;
      color: white;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .completion-progress {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .progress-bar {
      width: 80px;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #4ade80;
      border-radius: 4px;
      transition: width 0.5s ease-in-out;
    }

    .progress-fill.full-completion {
      background: linear-gradient(90deg, #4ade80, #22d3ee);
    }

    .completion-text {
      font-size: 0.8rem;
      font-weight: 600;
      color: white;
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
      color: white;
      font-size: 0.85rem;
      transition: all 0.3s ease;
      border: 1px solid transparent;
      cursor: pointer;
    }

    .year-task-item.completed {
      background: #4ade80 !important;
      border-color: #4ade80;
    }

    .year-task-item.pending {
      background: #667eea;
      border-color: #667eea;
    }

    .year-task-item.loading {
      opacity: 0.6;
      cursor: wait;
    }

    .year-task-item:hover:not(.loading) {
      transform: translateX(4px);
      opacity: 0.9;
    }

    .year-task-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .year-task-title {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .more-tasks-year {
      text-align: center;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px dashed rgba(255, 255, 255, 0.2);
    }

    .empty-month {
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      justify-content: center;
    }

    .empty-month-text {
      font-size: 0.9rem;
    }

    .empty-month-hint {
      font-size: 0.8rem;
      color: #667eea;
    }

    .month-completion-summary {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .completion-badge {
      background: #4ade80;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 700;
      text-align: center;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.3);
    }

    .completion-badge.full-completion {
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      animation: pulse 2s infinite;
    }

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

    /* Form Styles */
    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: white;
    }

    .form-control {
      width: 100%;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      background: rgba(255, 255, 255, 0.15);
    }

    .form-control::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    textarea.form-control {
      resize: vertical;
      min-height: 100px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      color: white;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #667eea;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      flex: 1;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #c0392b;
      transform: translateY(-2px);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    /* Day Details Modal */
    .day-details-modal {
      max-width: 500px;
    }

    .day-summary {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .completed-summary {
      color: #4ade80;
      font-weight: 600;
    }

    .day-tasks-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .day-task-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    .day-task-item.completed {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(74, 222, 128, 0.15) 100%);
    }

    .day-task-item.loading {
      opacity: 0.6;
      pointer-events: none;
    }

    .day-task-item.completed .task-title {
      text-decoration: line-through;
      color: rgba(255, 255, 255, 0.7);
    }

    .day-task-item:hover:not(.loading) {
      background: rgba(255, 255, 255, 0.15);
    }

    .task-checkbox input {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #667eea;
    }

    .task-content {
      flex: 1;
    }

    .task-title {
      font-weight: 600;
      color: white;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .task-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
      align-items: center;
    }

    .task-category {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      padding: 0.3rem 0.75rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .task-priority {
      font-weight: 600;
    }

    .task-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-small {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.3s ease;
      color: white;
    }

    .btn-small:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      border-color: #667eea;
    }

    .no-tasks {
      text-align: center;
      padding: 3rem 2rem;
      color: rgba(255, 255, 255, 0.6);
      font-style: italic;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: center;
      padding: 2rem;
      color: white;
      font-weight: 600;
    }

    .error-message {
      background: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      text-align: center;
      border: 1px solid rgba(231, 76, 60, 0.3);
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .year-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem 0.5rem;
      }

      .calendar-header {
        padding: 1.5rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }

      .calendar-nav-section {
        flex-direction: column;
        gap: 1.5rem;
      }

      .calendar-title {
        font-size: 2rem;
        min-width: auto;
      }

      .view-options {
        width: 100%;
        justify-content: center;
      }

      .calendar-stats {
        justify-content: center;
      }

      .month-view,
      .week-view {
        padding: 1.5rem;
      }

      .calendar-grid {
        grid-template-columns: repeat(7, 1fr);
      }

      .calendar-day {
        min-height: 100px;
        padding: 0.75rem 0.5rem;
      }

      .week-header,
      .week-grid {
        grid-template-columns: 1fr;
      }

      .week-day-header,
      .week-day-column {
        border-right: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .week-day-header:last-child,
      .week-day-column:last-child {
        border-bottom: none;
      }

      .year-grid {
        grid-template-columns: 1fr;
      }

      .modal-overlay {
        padding: 1rem;
      }

      .modal-content {
        margin: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .day-actions {
        position: static;
        opacity: 1;
        transform: none;
        margin-top: 0.5rem;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .calendar-title {
        font-size: 1.5rem;
      }

      .nav-btn {
        width: 40px;
        height: 40px;
      }

      .view-option {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }

      .stat-badge {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }

      .calendar-day {
        min-height: 80px;
      }

      .day-number {
        font-size: 1rem;
      }

      .task-indicator {
        width: 8px;
        height: 8px;
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
  
  showCreateTaskModal = false;
  selectedDateForNewTask: Date | null = null;
  
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

  editModalData: EditModalData = {
    taskId: 0,
    task: null,
    isOpen: false
  };

  editFormData = {
    title: '',
    description: '',
    dueDate: '',
    priority: 2,
    completed: false,
    isRecurring: false,
    recurrencePattern: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrenceInterval: 1
  };

  isEditing = false;
  editError = '';

  updatingTaskIds = new Set<number>();

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

    getTotalTasks(): number {
    return this.tasks.length;
  }

  getCompletedTasksCount(): number {
    return this.tasks.filter(task => task.completed).length;
  }

  getPendingTasksCount(): number {
    return this.tasks.filter(task => !task.completed).length;
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

  // Add this method to handle the disabled state
  isDaySelectable(day: CalendarDay): boolean {
    return day.tasks.length > 0;
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
      recurrencePattern: this.newTaskIsRecurring ? this.newTaskRecurrencePattern as RecurrencePattern : 'none',
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
  // Prevent multiple clicks
  if (this.updatingTaskIds.has(taskId)) {
    return;
  }
  
  this.updatingTaskIds.add(taskId);
  
  this.taskService.toggleTaskCompletion(taskId).subscribe({
    next: (updatedTask: Task) => {
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
        
        // Force refresh all views
        this.generateCalendar();
        this.generateWeekView();
        
        // Update selectedDay with fresh data
        if (this.selectedDay) {
          this.selectedDay.tasks = this.getTasksForDate(this.selectedDay.date);
        }
        
        // Force change detection
        this.tasks = [...this.tasks];
      }
      this.updatingTaskIds.delete(taskId);
    },
    error: (error: any) => {
      console.error('Error updating task:', error);
      this.updatingTaskIds.delete(taskId);
    }
  });
}
  toggleTaskCompletionFromCalendar(taskId: number, event: Event): void {
  event.preventDefault();
  event.stopPropagation(); // Prevent triggering drag events
  
  // Prevent multiple clicks on the same task
  if (this.updatingTaskIds.has(taskId)) {
    return;
  }
  
  this.updatingTaskIds.add(taskId);
  
  // Call the service to update the backend - NO IMMEDIATE VISUAL TOGGLE
  this.taskService.toggleTaskCompletion(taskId).subscribe({
    next: (updatedTask: Task) => {
      // Update the task in the local array with the actual server response
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
        
        // Force refresh all views
        this.generateCalendar();
        this.generateWeekView();
        
        // Update selectedDay if it exists
        if (this.selectedDay) {
          this.selectedDay.tasks = this.getTasksForDate(this.selectedDay.date);
        }
        
        // Force change detection
        this.tasks = [...this.tasks];
      }
      this.updatingTaskIds.delete(taskId);
    },
    error: (error: any) => {
      console.error('Error updating task completion:', error);
      this.updatingTaskIds.delete(taskId);
    }
  });
}

  // Add these new methods for the edit modal
  editTask(taskId: number): void {
    this.editModalData.taskId = taskId;
    this.editModalData.isOpen = true;
    this.loadTaskForEditing(taskId);
  }

  loadTaskForEditing(taskId: number): void {
    this.isEditing = true;
    this.editError = '';

    this.taskService.getTaskById(taskId).subscribe({
      next: (task: Task) => {
        this.editModalData.task = task;
        this.editFormData = {
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          priority: task.priority,
          completed: task.completed,
          isRecurring: task.isRecurring || false,
          recurrencePattern: (task.recurrencePattern as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily',
          recurrenceInterval: task.recurrenceInterval || 1
        };
        this.isEditing = false;
      },
      error: (error: any) => {
        this.editError = 'Failed to load task for editing';
        this.isEditing = false;
        console.error('Error loading task for editing:', error);
      }
    });
  }

  onUpdateTask(): void {
    if (!this.editFormData.title.trim()) {
      this.editError = 'Task title is required';
      return;
    }

    this.isEditing = true;
    this.editError = '';

    const updateData: UpdateTaskRequest = {
      title: this.editFormData.title.trim(),
      description: this.editFormData.description,
      dueDate: this.editFormData.dueDate || null,
      priority: this.editFormData.priority,
      completed: this.editFormData.completed,
      isRecurring: this.editFormData.isRecurring,
      recurrencePattern: this.editFormData.isRecurring ? this.editFormData.recurrencePattern : 'none',
      recurrenceInterval: this.editFormData.isRecurring ? this.editFormData.recurrenceInterval : 1
    };

    this.taskService.updateTask(this.editModalData.taskId, updateData).subscribe({
      next: (updatedTask: Task) => {
        // Update the task in the local array
        const index = this.tasks.findIndex(t => t.id === this.editModalData.taskId);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        
        this.isEditing = false;
        this.closeEditModal();
        
        // Force refresh all views
        this.generateCalendar();
        this.generateWeekView();
        
        // Also update selectedDay if it's open with fresh data
        if (this.selectedDay) {
          this.selectedDay.tasks = this.getTasksForDate(this.selectedDay.date);
        }
        
        // Force change detection
        this.tasks = [...this.tasks];
      },
      error: (error: any) => {
        this.editError = 'Failed to update task. Please try again.';
        this.isEditing = false;
        console.error('Error updating task:', error);
      }
    });
  }

  onDeleteTask(): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(this.editModalData.taskId).subscribe({
        next: () => {
          // Remove the task from the local array
          this.tasks = this.tasks.filter(t => t.id !== this.editModalData.taskId);
          
          // Close the edit modal first
          this.closeEditModal();
          
          // Force refresh all calendar views
          this.generateCalendar();
          this.generateWeekView();
          
          // Also update selectedDay if it's open - completely refresh it
          if (this.selectedDay) {
            // Get fresh tasks for the selected day
            const freshTasks = this.getTasksForDate(this.selectedDay.date);
            
            if (freshTasks.length === 0) {
              // If no tasks left, close the day details
              this.selectedDay = null;
            } else {
              // Otherwise update the selectedDay with fresh data
              this.selectedDay.tasks = freshTasks;
            }
          }
          
          // Force Angular change detection by creating new arrays
          this.tasks = [...this.tasks];
        },
        error: (error: any) => {
          this.editError = 'Failed to delete task. Please try again.';
          console.error('Error deleting task:', error);
        }
      });
    }
  }

  closeEditModal(): void {
    this.editModalData = {
      taskId: 0,
      task: null,
      isOpen: false
    };
    this.editFormData = {
      title: '',
      description: '',
      dueDate: '',
      priority: 2,
      completed: false,
      isRecurring: false,
      recurrencePattern: 'daily',
      recurrenceInterval: 1
    };
    this.editError = '';
    this.isEditing = false;
  }

  onRecurrenceToggle(): void {
    if (!this.editFormData.isRecurring) {
      this.editFormData.recurrencePattern = 'daily';
      this.editFormData.recurrenceInterval = 1;
    }
  }
}