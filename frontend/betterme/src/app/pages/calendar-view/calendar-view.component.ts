import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, CreateTaskRequest, UpdateTaskRequest, RecurrencePattern, TaskDifficulty } from '../../models/task.model';
import { CdkDrag, CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { FileUploadComponent, Attachment } from '../../components/file-upload/file-upload.component';
import { firstValueFrom } from 'rxjs';

// Productivity Interfaces
interface EisenhowerCategory {
  id: 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important';
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface TimeBlock {
  id: number;
  taskId: number;
  startTime: string;
  endTime: string;
  date: string;
  duration: number;
  completed: boolean;
  title?: string;
}

interface ProductivitySettings {
  enableEatTheFrog: boolean;
  defaultTimeBlockDuration: number;
  reminderNotifications: boolean;
  reminderTime: number;
  workingHours: {
    start: string;
    end: string;
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  timeBlocks: TimeBlock[];
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
    FileUploadComponent
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
          <!-- Header Section with Productivity Features -->
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
                    [class.active]="viewMode === 'year'"
                    (click)="setViewMode('year')"
                  >
                    <span class="view-icon">🗓️</span>
                    Year
                  </button>
                </div>
              </div>

              <!-- Productivity Quick Actions -->
              <div class="productivity-actions">
                <button class="productivity-btn" (click)="showEisenhowerMatrix()" title="Eisenhower Matrix">
                  <span class="btn-icon">🎯</span>
                  Priority Matrix
                </button>
                <button class="productivity-btn" (click)="showTimeBlocking()" title="Time Blocking">
                  <span class="btn-icon">⏰</span>
                  Time Blocks
                </button>
                <button class="productivity-btn frog-btn" *ngIf="eatTheFrogTask" (click)="focusOnFrogTask()" title="Eat the Frog - Tackle most important task">
                  <span class="btn-icon">🐸</span>
                  Eat the Frog
                </button>
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
                <div class="stat-badge" *ngIf="eatTheFrogTask">
                  <span class="stat-icon">🐸</span>
                  <span class="stat-text">1 Frog</span>
                </div>
              </div>
            </div>

            <!-- Eat the Frog Banner -->
            <div class="frog-banner" *ngIf="eatTheFrogTask && productivitySettings.enableEatTheFrog">
              <div class="frog-content">
                <span class="frog-icon">🐸</span>
                <div class="frog-text">
                  <strong>Eat the Frog:</strong> {{ eatTheFrogTask.title }}
                  <span class="frog-priority" [style.background]="getPriorityColor(eatTheFrogTask.priority)">
                    {{ getPriorityText(eatTheFrogTask.priority) }} Priority
                  </span>
                </div>
                <button class="frog-action-btn" (click)="startFrogTask()">Start Now</button>
              </div>
            </div>
          </div>

          <!-- Main Calendar Content -->
          <div class="calendar-content">
            <!-- Month View with Time Blocks -->
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
                      [class.has-time-blocks]="day.timeBlocks.length > 0"
                    >
                      <div class="day-header">
                        <span class="day-number">{{ day.date.getDate() }}</span>
                        @if (day.isToday) {
                          <span class="today-badge">Today</span>
                        }
                      </div>
                      
                      <!-- Time Blocks Visualization -->
                      @if (day.timeBlocks.length > 0) {
                        <div class="time-block-indicators">
                          @for (block of getTopTimeBlocks(day.timeBlocks, 2); track block.id) {
                            <div 
                              class="time-block-indicator"
                              [style.background]="getTimeBlockColor(block)"
                              [title]="getTimeBlockTooltip(block)"
                            ></div>
                          }
                        </div>
                      }
                      
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
                                (click)="selectDay(day); $event.stopPropagation()"
                                [disabled]="day.tasks.length === 0"
                                title="View tasks">
                          <span class="action-icon">👁️</span>
                        </button>
                        
                        <button class="action-btn add-task-btn" 
                                (click)="onDayClick(day, $event); $event.stopPropagation()"
                                title="Add task"
                                type="button">
                          <span class="action-icon">+</span>
                        </button>

                        <button class="action-btn time-block-btn" 
                                (click)="addTimeBlockToDay(day); $event.stopPropagation()"
                                title="Add time block">
                          <span class="action-icon">⏰</span>
                        </button>
                      </div>
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

      <!-- Eisenhower Matrix Modal -->
      @if (showEisenhowerModal) {
        <div class="modal-overlay" (click)="showEisenhowerModal = false">
          <div class="modal-content eisenhower-modal glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>🎯 Eisenhower Matrix</h3>
              <button class="close-btn" (click)="showEisenhowerModal = false">×</button>
            </div>
            
            <div class="eisenhower-grid">
              @for (category of eisenhowerMatrix; track category.id) {
                <div class="eisenhower-quadrant" [style.border-color]="category.color">
                  <div class="quadrant-header" [style.background]="category.color">
                    <span class="quadrant-icon">{{ category.icon }}</span>
                    <h4>{{ category.name }}</h4>
                    <span class="quadrant-count">{{ getTasksByEisenhowerCategory(category.id).length }}</span>
                  </div>
                  
                  <div class="quadrant-content">
                    <p class="quadrant-description">{{ category.description }}</p>
                    
                    <div class="quadrant-tasks" cdkDropList
                         [id]="category.id"
                         [cdkDropListData]="category.id"
                         (cdkDropListDropped)="onEisenhowerDrop($event)">
                         
                      @for (task of getTasksByEisenhowerCategory(category.id); track task.id) {
                        <div class="quadrant-task" cdkDrag [cdkDragData]="task">
                          <div class="quadrant-task-content">
                            <div class="quadrant-task-title">{{ task.title }}</div>
                            <div class="quadrant-task-meta">
                              <span class="task-priority" [style.color]="getPriorityColor(task.priority)">
                                {{ getPriorityText(task.priority) }}
                              </span>
                              @if (task.dueDate) {
                                <span class="task-due">{{ formatTime(task.dueDate) }}</span>
                              }
                            </div>
                          </div>
                        </div>
                      }
                      
                      @if (getTasksByEisenhowerCategory(category.id).length === 0) {
                        <div class="empty-quadrant">
                          Drop tasks here
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
            
            <div class="eisenhower-legend">
              <div class="legend-item">
                <div class="legend-color" style="background: #e74c3c"></div>
                <span>Urgent & Important - Do First</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #f39c12"></div>
                <span>Urgent & Not Important - Schedule</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #3498db"></div>
                <span>Not Urgent & Important - Delegate</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #95a5a6"></div>
                <span>Not Urgent & Not Important - Eliminate</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Time Blocking Modal -->
      @if (showTimeBlockModal) {
        <div class="modal-overlay" (click)="closeTimeBlockModal()">
          <div class="modal-content time-block-modal glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>⏰ Schedule Time Block</h3>
              <button class="close-btn" (click)="closeTimeBlockModal()">×</button>
            </div>
            
            <div class="modal-body">
              <form (ngSubmit)="saveTimeBlock()">
                <div class="form-group">
                  <label class="form-label">Task</label>
                  <select class="form-control" [(ngModel)]="selectedTimeBlockTaskId" name="task" required>
                    <option value="">Select a task</option>
                    @for (task of getPendingTasks(); track task.id) {
                      <option [value]="task.id">{{ task.title }} ({{ getPriorityText(task.priority) }} Priority)</option>
                    }
                  </select>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-control" [(ngModel)]="newTimeBlockDate" name="date" required>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Duration (minutes)</label>
                    <select class="form-control" [(ngModel)]="newTimeBlockDuration" name="duration">
                      <option [value]="30">30 minutes</option>
                      <option [value]="60">1 hour</option>
                      <option [value]="90">1.5 hours</option>
                      <option [value]="120">2 hours</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Start Time</label>
                    <select class="form-control" [(ngModel)]="newTimeBlockStartTime" name="startTime" required>
                      @for (time of getAvailableTimeSlots(); track time) {
                        <option [value]="time">{{ time }}</option>
                      }
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">End Time</label>
                    <input type="text" class="form-control" [value]="calculateEndTime()" readonly>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="!selectedTimeBlockTaskId">
                    Schedule Time Block
                  </button>
                  <button type="button" class="btn btn-secondary" (click)="closeTimeBlockModal()">
                    Cancel
                  </button>
                </div>
              </form>
              
              <!-- Existing Time Blocks -->
              <div class="existing-time-blocks" *ngIf="timeBlocks.length > 0">
                <h4>Scheduled Time Blocks</h4>
                @for (block of timeBlocks.slice(0, 5); track block.id) {
                  <div class="time-block-item">
                    <div class="time-block-info">
                      <strong>{{ getTaskTitle(block.taskId) }}</strong>
                      <span>{{ getFormattedBlockDate(block.date) }} | {{ block.startTime }} - {{ block.endTime }}</span>
                    </div>
                    <button class="btn-small" (click)="completeTimeBlock(block.id)">✓ Complete</button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

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
                <span class="time-block-summary" *ngIf="selectedDay.timeBlocks.length > 0">
                  • {{ selectedDay.timeBlocks.length }} time blocks
                </span>
              </div>
              <button class="close-btn" (click)="selectedDay = null">×</button>
            </div>
            
            <!-- Time Blocks Section -->
            @if (selectedDay.timeBlocks.length > 0) {
              <div class="time-blocks-section">
                <h4>⏰ Time Blocks</h4>
                @for (block of selectedDay.timeBlocks; track block.id) {
                  <div class="time-block-card" [class.completed]="block.completed">
                    <div class="time-block-header">
                      <span class="time-range">{{ block.startTime }} - {{ block.endTime }}</span>
                      <span class="time-block-status" [class.completed]="block.completed">
                        {{ block.completed ? 'Completed' : 'Scheduled' }}
                      </span>
                    </div>
                    <div class="time-block-title">{{ block.title || 'Focus Time' }}</div>
                    <div class="time-block-actions">
                      <button class="btn-small" (click)="completeTimeBlock(block.id)">
                        {{ block.completed ? 'Undo' : 'Complete' }}
                      </button>
                      <button class="btn-small btn-danger" (click)="deleteTimeBlock(block.id)">Delete</button>
                    </div>
                  </div>
                }
              </div>
            }
            
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
                      <span class="eisenhower-category" [style.background]="getEisenhowerCategory(task)?.color">
                        {{ getEisenhowerCategory(task)?.name }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="task-actions">
                    <button class="btn-small" (click)="scheduleTimeBlock(task, selectedDay.date, $event)">
                      ⏰ Schedule
                    </button>
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
                  <label class="form-label">Description</label>
                  <textarea 
                    class="form-control"
                    placeholder="Add more details about your task..."
                    [(ngModel)]="newTaskDescription"
                    name="description"
                    rows="4"
                  ></textarea>
                </div>
                
                <!-- File Attachments -->
                <div class="form-group">
                  <label class="form-label">Attachments</label>
                  <app-file-upload
                    [taskId]="undefined"
                    (attachmentsChange)="onAttachmentsChange($event)"
                  ></app-file-upload>
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
                    @for (category of enhancedCategories; track category.name) {
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

                <div class="form-row">
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
                      <option [ngValue]="1">Low</option>
                      <option [ngValue]="2">Medium</option>
                      <option [ngValue]="3">High</option>
                    </select>
                  </div>
                </div>

                <!-- Smart Task Properties -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Estimated Duration (minutes)</label>
                    <input 
                      type="number" 
                      class="form-control"
                      placeholder="e.g., 30"
                      [(ngModel)]="newTaskEstimatedDuration"
                      name="estimatedDuration"
                      min="1"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Difficulty</label>
                    <select 
                      class="form-control"
                      [(ngModel)]="newTaskDifficulty"
                      name="difficulty"
                    >
                      <option value="easy">😊 Easy</option>
                      <option value="medium">😐 Medium</option>
                      <option value="hard">😰 Hard</option>
                    </select>
                  </div>
                </div>

                <!-- Parent Task Selection -->
                <div class="form-group">
                  <label class="form-label">Parent Task (optional)</label>
                  <select 
                    class="form-control"
                    [(ngModel)]="newTaskParentTaskId"
                    name="parentTaskId"
                    (change)="onParentTaskChange()"
                  >
                    <option [value]="null">None (Top-level task)</option>
                    @for (task of availableParentTasks; track task.id) {
                      <option [value]="task.id">{{ task.title }}</option>
                    }
                  </select>
                  <small class="form-help-text">Make this task a subtask of another task</small>
                </div>

                <!-- Subtasks Section -->
                <div class="form-group">
                  <label class="form-label">Subtasks</label>
                  <div class="subtasks-form-container">
                    <div class="subtask-input-container">
                      <input 
                        type="text" 
                        class="form-control"
                        placeholder="Add a subtask (press Enter to add)"
                        [(ngModel)]="newSubtaskInput"
                        name="subtaskInput"
                        (keydown.enter)="addSubtaskToForm($event)"
                      />
                      <button type="button" class="btn btn-secondary btn-sm" (click)="addSubtaskToForm()">
                        Add
                      </button>
                    </div>
                    @if (newTaskSubtasks.length > 0) {
                      <ul class="subtasks-list-form">
                        @for (subtask of newTaskSubtasks; track $index) {
                          <li class="subtask-item-form">
                            <span>{{ subtask }}</span>
                            <button type="button" class="btn-icon-small" (click)="removeSubtaskFromForm($index)">
                              ×
                            </button>
                          </li>
                        }
                      </ul>
                    }
                    @if (newTaskSubtasks.length === 0) {
                      <p class="form-help-text">No subtasks yet. Add subtasks to break down this task into smaller steps.</p>
                    }
                  </div>
                </div>

                <!-- Task Dependencies -->
                <div class="form-group">
                  <label class="form-label">Dependencies</label>
                  <div class="dependencies-form-container">
                    <select 
                      class="form-control"
                      [(ngModel)]="selectedDependencyTaskId"
                      name="dependencyTask"
                      (change)="addDependencyToForm()"
                    >
                      <option [value]="null">Select a task this depends on...</option>
                      @for (task of availableDependencyTasks; track task.id) {
                        <option [value]="task.id" [disabled]="newTaskDependsOnTaskIds.includes(task.id)">
                          {{ task.title }} {{ task.completed ? '(Completed)' : '(Pending)' }}
                        </option>
                      }
                    </select>
                    @if (newTaskDependsOnTaskIds.length > 0) {
                      <div class="dependencies-list-form">
                        <label class="form-label-small">This task depends on:</label>
                        <ul class="dependencies-list">
                          @for (depTaskId of newTaskDependsOnTaskIds; track depTaskId) {
                            <li class="dependency-item-form">
                              @if (getTaskById(depTaskId)) {
                                <span class="dependency-title">{{ getTaskById(depTaskId)!.title }}</span>
                                <span class="dependency-status" [class.completed]="getTaskById(depTaskId)!.completed">
                                  {{ getTaskById(depTaskId)!.completed ? '✓ Completed' : '○ Pending' }}
                                </span>
                              }
                              <button type="button" class="btn-icon-small" (click)="removeDependencyFromForm(depTaskId)">
                                ×
                              </button>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                    @if (newTaskDependsOnTaskIds.length === 0) {
                      <p class="form-help-text">No dependencies. This task can be started immediately.</p>
                    }
                  </div>
                </div>

                <!-- Recurrence -->
                <div class="form-group">
                  <label class="form-label">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="newTaskIsRecurring"
                      name="isRecurring"
                      (change)="onRecurrenceToggle()"
                    />
                    Make this task recurring
                  </label>
                </div>
                @if (newTaskIsRecurring) {
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Recurrence Pattern</label>
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
                      <input 
                        type="number" 
                        class="form-control"
                        [(ngModel)]="newTaskRecurrenceInterval"
                        name="recurrenceInterval"
                        min="1"
                      />
                    </div>
                  </div>
                }
                
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
                    <input 
                      type="text" 
                      class="form-control"
                      placeholder="Task title"
                      [(ngModel)]="editFormData.title"
                      name="editTitle"
                      required
                      #editTitleInput
                      autofocus
                      [disabled]="isEditing"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea 
                      class="form-control"
                      placeholder="Add more details about your task..."
                      [(ngModel)]="editFormData.description"
                      name="editDescription"
                      rows="4"
                      [disabled]="isEditing"
                    ></textarea>
                  </div>
                  
                  <!-- Enhanced Category Dropdown -->
                  <div class="form-group">
                    <label class="form-label">Category</label>
                    <select 
                      class="form-control"
                      [(ngModel)]="editFormData.category"
                      name="editCategory"
                      [disabled]="isEditing"
                    >
                      <option value="">Select Category</option>
                      @for (category of enhancedCategories; track category.name) {
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
                        placeholder="Add tags (press Enter to add)"
                        [(ngModel)]="editTaskTagInput"
                        name="editTagInput"
                        (keydown)="onEditTagInputKeydown($event)"
                        [disabled]="isEditing"
                      />
                    </div>
                    <div class="tag-preview">
                      @for (tag of editTaskTags; track tag) {
                        <span class="tag-badge">
                          {{ tag }}
                          <button type="button" (click)="removeEditTag(tag)" class="tag-remove" [disabled]="isEditing">×</button>
                        </span>
                      }
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Due Date</label>
                      <input 
                        type="date" 
                        class="form-control"
                        [value]="editFormData.dueDate"
                        (input)="editFormData.dueDate = $any($event.target).value"
                        name="editDueDate"
                        [disabled]="isEditing"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Priority</label>
                      <select 
                        class="form-control"
                        [(ngModel)]="editFormData.priority"
                        name="editPriority"
                        [disabled]="isEditing"
                      >
                        <option [ngValue]="1">Low</option>
                        <option [ngValue]="2">Medium</option>
                        <option [ngValue]="3">High</option>
                      </select>
                    </div>
                  </div>

                  <!-- Smart Task Properties -->
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Estimated Duration (minutes)</label>
                      <input 
                        type="number" 
                        class="form-control"
                        placeholder="e.g., 30"
                        [(ngModel)]="editFormData.estimatedDuration"
                        name="editEstimatedDuration"
                        min="1"
                        [disabled]="isEditing"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Difficulty</label>
                      <select 
                        class="form-control"
                        [(ngModel)]="editFormData.difficulty"
                        name="editDifficulty"
                        [disabled]="isEditing"
                      >
                        <option value="easy">😊 Easy</option>
                        <option value="medium">😐 Medium</option>
                        <option value="hard">😰 Hard</option>
                      </select>
                    </div>
                  </div>

                  <!-- Parent Task Selection -->
                  <div class="form-group">
                    <label class="form-label">Parent Task (optional)</label>
                    <select 
                      class="form-control"
                      [(ngModel)]="editFormData.parentTaskId"
                      name="editParentTaskId"
                      (change)="onParentTaskChange()"
                      [disabled]="isEditing"
                    >
                      <option [value]="null">None (Top-level task)</option>
                      @for (task of availableParentTasks; track task.id) {
                        <option [value]="task.id">{{ task.title }}</option>
                      }
                    </select>
                    <small class="form-help-text">Make this task a subtask of another task</small>
                  </div>

                  <!-- Subtasks Section -->
                  <div class="form-group">
                    <label class="form-label">Subtasks</label>
                    <div class="subtasks-form-container">
                      <div class="subtask-input-container">
                        <input 
                          type="text" 
                          class="form-control"
                          placeholder="Add a subtask (press Enter to add)"
                          [(ngModel)]="editSubtaskInput"
                          name="editSubtaskInput"
                          (keydown.enter)="addSubtaskToForm($event, true)"
                          [disabled]="isEditing"
                        />
                        <button type="button" class="btn btn-secondary btn-sm" (click)="addSubtaskToForm(undefined, true)" [disabled]="isEditing">
                          Add
                        </button>
                      </div>
                      @if (editTaskSubtasks.length > 0) {
                        <ul class="subtasks-list-form">
                          @for (subtask of editTaskSubtasks; track $index) {
                            <li class="subtask-item-form">
                              <span>{{ subtask }}</span>
                              <button type="button" class="btn-icon-small" (click)="removeSubtaskFromForm($index, true)" [disabled]="isEditing">
                                ×
                              </button>
                            </li>
                          }
                        </ul>
                      }
                      @if (editTaskSubtasks.length === 0) {
                        <p class="form-help-text">No subtasks yet. Add subtasks to break down this task into smaller steps.</p>
                      }
                    </div>
                  </div>

                  <!-- Task Dependencies -->
                  <div class="form-group">
                    <label class="form-label">Dependencies</label>
                    <div class="dependencies-form-container">
                      <select 
                        class="form-control"
                        [(ngModel)]="selectedEditDependencyTaskId"
                        name="editDependencyTask"
                        (change)="addEditDependencyToForm()"
                        [disabled]="isEditing"
                      >
                        <option [value]="null">Select a task this depends on...</option>
                        @for (task of availableDependencyTasks; track task.id) {
                          <option [value]="task.id" [disabled]="editTaskDependsOnTaskIds.includes(task.id)">
                            {{ task.title }} {{ task.completed ? '(Completed)' : '(Pending)' }}
                          </option>
                        }
                      </select>
                      @if (editTaskDependsOnTaskIds.length > 0) {
                        <div class="dependencies-list-form">
                          <label class="form-label-small">This task depends on:</label>
                          <ul class="dependencies-list">
                            @for (depTaskId of editTaskDependsOnTaskIds; track depTaskId) {
                              <li class="dependency-item-form">
                                @if (getTaskById(depTaskId)) {
                                  <span class="dependency-title">{{ getTaskById(depTaskId)!.title }}</span>
                                  <span class="dependency-status" [class.completed]="getTaskById(depTaskId)!.completed">
                                    {{ getTaskById(depTaskId)!.completed ? '✓ Completed' : '○ Pending' }}
                                  </span>
                                }
                                <button type="button" class="btn-icon-small" (click)="removeEditDependencyFromForm(depTaskId)" [disabled]="isEditing">
                                  ×
                                </button>
                              </li>
                            }
                          </ul>
                        </div>
                      }
                      @if (editTaskDependsOnTaskIds.length === 0) {
                        <p class="form-help-text">No dependencies. This task can be started immediately.</p>
                      }
                    </div>
                  </div>

                  <!-- Recurrence -->
                  <div class="form-group">
                    <label class="form-label">
                      <input 
                        type="checkbox" 
                        [(ngModel)]="editFormData.isRecurring"
                        name="editIsRecurring"
                        [disabled]="isEditing"
                      />
                      Make this task recurring
                    </label>
                  </div>
                  @if (editFormData.isRecurring) {
                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">Recurrence Pattern</label>
                        <select 
                          class="form-control"
                          [(ngModel)]="editFormData.recurrencePattern"
                          name="editRecurrencePattern"
                          [disabled]="isEditing"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Interval</label>
                        <input 
                          type="number" 
                          class="form-control"
                          [(ngModel)]="editFormData.recurrenceInterval"
                          name="editRecurrenceInterval"
                          min="1"
                          [disabled]="isEditing"
                        />
                      </div>
                    </div>
                  }

                  <div class="form-actions">
                    <button 
                      type="submit" 
                      class="btn btn-primary"
                      [disabled]="isEditing || !editFormData.title.trim()"
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
      background: var(--bg-gradient);
      position: relative;
      overflow-x: hidden;
      transition: background 0.3s ease;
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
      transition: background 0.3s ease;
    }

    body.dark-mode .shape {
      background: rgba(255, 255, 255, 0.05);
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
      background: transparent;
    }

    body.dark-mode .container {
      background: transparent;
    }

    .calendar-container {
      max-width: 1400px;
      margin: 0 auto;
      background: transparent;
    }

    body.dark-mode .calendar-container {
      background: transparent;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    body.dark-mode .glass-card {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
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
      transition: background 0.3s ease;
    }

    body.dark-mode .calendar-title {
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
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

    .calendar-day.has-time-blocks {
      border-bottom: 3px solid #3498db;
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

    /* Time Block Indicators */
    .time-block-indicators {
      display: flex;
      gap: 2px;
      margin-bottom: 0.5rem;
    }

    .time-block-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
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

    .time-block-btn {
      background: #3498db;
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

    /* Productivity Features Styles */
    .productivity-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .productivity-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
    }

    .productivity-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .frog-btn {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      border-color: #27ae60;
    }

    .frog-btn:hover {
      background: linear-gradient(135deg, #229954, #27ae60);
    }

    .btn-icon {
      font-size: 1.1rem;
    }

    .frog-banner {
      background: linear-gradient(135deg, rgba(39, 174, 96, 0.2), rgba(46, 204, 113, 0.2));
      border: 1px solid rgba(39, 174, 96, 0.5);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      margin-top: 1rem;
    }

    .frog-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .frog-icon {
      font-size: 1.5rem;
    }

    .frog-text {
      flex: 1;
      color: white;
      font-weight: 600;
    }

    .frog-priority {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      margin-left: 1rem;
    }

    .frog-action-btn {
      background: #27ae60;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .frog-action-btn:hover {
      background: #229954;
      transform: scale(1.05);
    }

    /* Eisenhower Matrix Styles */
    .eisenhower-modal {
      max-width: 1000px;
    }

    .eisenhower-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 1rem;
      height: 500px;
    }

    .eisenhower-quadrant {
      border: 2px solid;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .quadrant-header {
      padding: 1rem;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .quadrant-header h4 {
      margin: 0;
      flex: 1;
    }

    .quadrant-count {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.8rem;
    }

    .quadrant-content {
      flex: 1;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      overflow-y: auto;
    }

    .quadrant-description {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 1rem;
    }

    .quadrant-tasks {
      min-height: 100px;
      height: 100%;
    }

    .quadrant-task {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      cursor: move;
      transition: all 0.3s ease;
    }

    .quadrant-task:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(4px);
    }

    .quadrant-task-title {
      font-weight: 600;
      color: white;
      margin-bottom: 0.25rem;
    }

    .quadrant-task-meta {
      display: flex;
      gap: 0.75rem;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .empty-quadrant {
      text-align: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.5);
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }

    .eisenhower-legend {
      display: flex;
      justify-content: space-around;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-top: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    /* Time Block Cards */
    .time-block-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.75rem;
      border-left: 4px solid #3498db;
    }

    .time-block-card.completed {
      opacity: 0.7;
      border-left-color: #4ade80;
    }

    .time-block-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .time-range {
      font-weight: 600;
      color: white;
    }

    .time-block-status {
      font-size: 0.8rem;
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
    }

    .time-block-status.completed {
      background: #4ade80;
      color: white;
    }

    .time-block-title {
      font-weight: 600;
      color: white;
      margin-bottom: 0.75rem;
    }

    .time-block-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Existing Time Blocks List */
    .existing-time-blocks {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .existing-time-blocks h4 {
      color: white;
      margin-bottom: 1rem;
    }

    .time-block-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .time-block-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .time-block-info strong {
      color: white;
    }

    .time-block-info span {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
      animation: fadeInOverlay 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: opacity, backdrop-filter;
    }

    @keyframes fadeInOverlay {
      from {
        opacity: 0;
        backdrop-filter: blur(0px) saturate(100%);
        -webkit-backdrop-filter: blur(0px) saturate(100%);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
      }
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-content {
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      width: 100%;
      animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      will-change: transform, opacity;
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

    /* Select dropdown styling - ensure text is visible for category, priority, and difficulty */
    select.form-control {
      color: #1a1a1a !important;
      background: #ffffff !important;
      cursor: pointer;
      font-weight: 500;
    }

    select.form-control:focus {
      background: #ffffff !important;
      color: #1a1a1a !important;
      border-color: #667eea;
    }

    select.form-control:hover {
      background: #ffffff !important;
      color: #1a1a1a !important;
    }

    select.form-control option {
      color: #1a1a1a !important;
      background: white !important;
      padding: 0.5rem;
    }

    select.form-control option:checked {
      color: #1a1a1a !important;
      background: #f0f4ff !important;
      font-weight: 600;
    }

    select.form-control option:disabled {
      color: #999 !important;
      background: #f5f5f5 !important;
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

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .tag-input-container {
      display: flex;
      gap: 0.5rem;
    }

    .tag-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .tag-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tag-remove {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }

    .tag-remove:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }

    .tag-remove:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-help-text {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .subtasks-form-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .subtask-input-container {
      display: flex;
      gap: 0.5rem;
    }

    .subtasks-list-form {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .subtask-item-form {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .dependencies-form-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .dependencies-list-form {
      margin-top: 1rem;
    }

    .form-label-small {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: white;
      font-size: 0.9rem;
    }

    .dependencies-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .dependency-item-form {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      gap: 1rem;
    }

    .dependency-title {
      flex: 1;
      color: white;
    }

    .dependency-status {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
    }

    .dependency-status.completed {
      color: #4ade80;
    }

    .btn-icon-small {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .btn-icon-small:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }

    .btn-icon-small:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .modal-content-large {
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
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

    .time-block-summary {
      color: #3498db;
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

    .eisenhower-category {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.3rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
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

    /* ============================================
       COMPREHENSIVE DARK MODE STYLES
       ============================================ */

    /* Header Dark Mode */
    body.dark-mode .calendar-header {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .header-content {
      background: transparent;
    }

    /* Navigation Dark Mode */
    body.dark-mode .nav-btn {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .nav-btn:hover {
      background: rgba(26, 26, 26, 0.5);
    }

    /* View Options Dark Mode */
    body.dark-mode .view-options {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .view-option {
      color: rgba(255, 255, 255, 0.8);
    }

    body.dark-mode .view-option.active {
      background: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .view-option:hover:not(.active) {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.95);
    }

    /* Stats Badges Dark Mode */
    body.dark-mode .stat-badge {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    /* Calendar Grid Dark Mode */
    body.dark-mode .calendar-grid {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .weekday-header {
      background: rgba(26, 26, 26, 0.4);
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .calendar-day {
      background: rgba(26, 26, 26, 0.3);
      border-color: transparent;
    }

    body.dark-mode .calendar-day.current-month {
      background: rgba(26, 26, 26, 0.4);
    }

    body.dark-mode .calendar-day:not(.current-month) {
      background: rgba(26, 26, 26, 0.2);
      color: rgba(255, 255, 255, 0.4);
    }

    body.dark-mode .calendar-day.today {
      background: linear-gradient(135deg, rgba(74, 222, 128, 0.3), rgba(34, 211, 238, 0.3));
      border-color: rgba(74, 222, 128, 0.5);
    }

    body.dark-mode .calendar-day.has-tasks {
      border-bottom-color: rgba(102, 126, 234, 0.6);
    }

    body.dark-mode .calendar-day.has-completed-tasks {
      background: linear-gradient(135deg, rgba(26, 26, 26, 0.4) 0%, rgba(74, 222, 128, 0.15) 100%);
    }

    body.dark-mode .calendar-day.has-time-blocks {
      border-bottom-color: rgba(52, 152, 219, 0.6);
    }

    body.dark-mode .day-number {
      color: rgba(255, 255, 255, 0.95);
    }

    /* Productivity Features Dark Mode */
    body.dark-mode .productivity-btn {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .productivity-btn:hover {
      background: rgba(26, 26, 26, 0.5);
      border-color: rgba(255, 255, 255, 0.2);
    }

    body.dark-mode .frog-banner {
      background: linear-gradient(135deg, rgba(39, 174, 96, 0.3), rgba(46, 204, 113, 0.3));
      border-color: rgba(39, 174, 96, 0.5);
    }

    body.dark-mode .frog-text {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .frog-priority {
      background: rgba(255, 255, 255, 0.15);
    }

    /* Year View Dark Mode */
    body.dark-mode .year-month {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .year-month:hover {
      background: rgba(26, 26, 26, 0.5);
      border-color: rgba(102, 126, 234, 0.6);
    }

    body.dark-mode .year-month.has-completed-tasks {
      border-left-color: rgba(74, 222, 128, 0.6);
    }

    body.dark-mode .year-month.all-tasks-completed {
      border-color: rgba(74, 222, 128, 0.6);
      background: linear-gradient(135deg, rgba(26, 26, 26, 0.4) 0%, rgba(74, 222, 128, 0.2) 100%);
    }

    body.dark-mode .month-header h4 {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .month-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .progress-bar {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .completion-text {
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .more-tasks-year {
      background: rgba(26, 26, 26, 0.3);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
    }

    body.dark-mode .empty-month {
      color: rgba(255, 255, 255, 0.5);
    }

    body.dark-mode .empty-month-hint {
      color: rgba(102, 126, 255, 0.8);
    }

    body.dark-mode .month-completion-summary {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    /* Modal Dark Mode */
    body.dark-mode .modal-overlay {
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
    }

    @keyframes fadeInOverlayDark {
      from {
        opacity: 0;
        backdrop-filter: blur(0px) saturate(100%);
        -webkit-backdrop-filter: blur(0px) saturate(100%);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
      }
    }

    body.dark-mode .modal-overlay {
      animation: fadeInOverlayDark 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    body.dark-mode .modal-content {
      background: rgba(26, 26, 26, 0.95);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .modal-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .modal-header h3 {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .close-btn {
      color: rgba(255, 255, 255, 0.7);
    }

    body.dark-mode .close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.95);
    }

    /* Form Controls Dark Mode */
    body.dark-mode .form-label {
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .form-control {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .form-control::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    body.dark-mode .form-control:focus {
      background: rgba(26, 26, 26, 0.5);
      border-color: rgba(102, 126, 234, 0.6);
    }

    body.dark-mode .form-control:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Select dropdowns - keep white background for visibility */
    body.dark-mode select.form-control {
      color: #1a1a1a !important;
      background: #ffffff !important;
    }

    body.dark-mode select.form-control:focus {
      background: #ffffff !important;
      color: #1a1a1a !important;
    }

    body.dark-mode select.form-control option {
      color: #1a1a1a !important;
      background: white !important;
    }

    /* Buttons Dark Mode */
    body.dark-mode .btn-primary {
      background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
      box-shadow: 0 4px 15px rgba(5, 150, 105, 0.5);
    }

    body.dark-mode .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      box-shadow: 0 8px 25px rgba(5, 150, 105, 0.7);
    }

    body.dark-mode .btn-secondary {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .btn-secondary:hover:not(:disabled) {
      background: rgba(26, 26, 26, 0.5);
      border-color: rgba(255, 255, 255, 0.2);
    }

    body.dark-mode .btn-danger {
      background: rgba(231, 76, 60, 0.8);
      color: white;
    }

    body.dark-mode .btn-danger:hover:not(:disabled) {
      background: rgba(192, 57, 43, 0.9);
    }

    body.dark-mode .btn-small {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .btn-small:hover:not(:disabled) {
      background: rgba(26, 26, 26, 0.5);
      border-color: rgba(102, 126, 234, 0.6);
    }

    /* Eisenhower Matrix Dark Mode */
    body.dark-mode .eisenhower-quadrant {
      border-color: inherit;
    }

    body.dark-mode .quadrant-content {
      background: rgba(26, 26, 26, 0.3);
    }

    body.dark-mode .quadrant-description {
      color: rgba(255, 255, 255, 0.7);
    }

    body.dark-mode .quadrant-task {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .quadrant-task:hover {
      background: rgba(26, 26, 26, 0.5);
    }

    body.dark-mode .quadrant-task-title {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .quadrant-task-meta {
      color: rgba(255, 255, 255, 0.7);
    }

    body.dark-mode .empty-quadrant {
      color: rgba(255, 255, 255, 0.5);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .eisenhower-legend {
      background: rgba(26, 26, 26, 0.3);
    }

    body.dark-mode .legend-item {
      color: rgba(255, 255, 255, 0.8);
    }

    /* Time Block Dark Mode */
    body.dark-mode .time-block-card {
      background: rgba(26, 26, 26, 0.4);
      border-left-color: rgba(52, 152, 219, 0.6);
    }

    body.dark-mode .time-block-card.completed {
      border-left-color: rgba(74, 222, 128, 0.6);
    }

    body.dark-mode .time-range {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .time-block-status {
      background: rgba(26, 26, 26, 0.4);
      color: rgba(255, 255, 255, 0.7);
    }

    body.dark-mode .time-block-status.completed {
      background: rgba(74, 222, 128, 0.8);
      color: white;
    }

    body.dark-mode .time-block-title {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .time-block-item {
      background: rgba(26, 26, 26, 0.3);
    }

    body.dark-mode .time-block-info strong {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .time-block-info span {
      color: rgba(255, 255, 255, 0.7);
    }

    body.dark-mode .existing-time-blocks {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .existing-time-blocks h4 {
      color: rgba(255, 255, 255, 0.95);
    }

    /* Day Details Modal Dark Mode */
    body.dark-mode .day-summary {
      color: rgba(255, 255, 255, 0.8);
    }

    body.dark-mode .completed-summary {
      color: rgba(74, 222, 128, 0.9);
    }

    body.dark-mode .time-block-summary {
      color: rgba(52, 152, 219, 0.9);
    }

    body.dark-mode .day-task-item {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .day-task-item.completed {
      background: linear-gradient(135deg, rgba(26, 26, 26, 0.4) 0%, rgba(74, 222, 128, 0.15) 100%);
    }

    body.dark-mode .day-task-item:hover:not(.loading) {
      background: rgba(26, 26, 26, 0.5);
    }

    body.dark-mode .task-title {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .task-category {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }

    body.dark-mode .eisenhower-category {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .no-tasks {
      color: rgba(255, 255, 255, 0.6);
    }

    body.dark-mode .time-blocks-section {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .time-blocks-section h4 {
      color: rgba(255, 255, 255, 0.95);
    }

    /* Time Block Modal Dark Mode */
    body.dark-mode .time-block-modal {
      background: rgba(26, 26, 26, 0.95);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .time-block-modal .modal-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .time-block-modal .modal-header h3 {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .time-block-modal .form-label {
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .time-block-modal .form-control {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .time-block-modal .form-control::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    body.dark-mode .time-block-modal .form-control:focus {
      background: rgba(26, 26, 26, 0.5);
      border-color: rgba(102, 126, 234, 0.6);
    }

    body.dark-mode .time-block-modal .form-control[readonly] {
      background: rgba(26, 26, 26, 0.3);
      color: rgba(255, 255, 255, 0.7);
      cursor: not-allowed;
    }

    /* Tags Dark Mode */
    body.dark-mode .tag-badge {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .tag-remove:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
    }

    body.dark-mode .form-help-text {
      color: rgba(255, 255, 255, 0.6);
    }

    /* Subtasks Dark Mode */
    body.dark-mode .subtask-item-form {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .subtask-item-form span {
      color: rgba(255, 255, 255, 0.9);
    }

    /* Dependencies Dark Mode */
    body.dark-mode .dependency-item-form {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .dependency-title {
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .dependency-status {
      color: rgba(255, 255, 255, 0.7);
    }

    body.dark-mode .dependency-status.completed {
      color: rgba(74, 222, 128, 0.9);
    }

    body.dark-mode .btn-icon-small {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .btn-icon-small:hover:not(:disabled) {
      background: rgba(26, 26, 26, 0.5);
    }

    /* Error Message Dark Mode */
    body.dark-mode .error-message {
      background: rgba(231, 76, 60, 0.2);
      border-color: rgba(231, 76, 60, 0.4);
      color: rgba(254, 202, 202, 0.9);
    }

    /* Loading Dark Mode */
    body.dark-mode .loading {
      color: rgba(255, 255, 255, 0.9);
    }

    /* Checkbox Dark Mode */
    body.dark-mode .task-checkbox input {
      accent-color: rgba(102, 126, 234, 0.8);
    }

    body.dark-mode .checkbox-label {
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .checkbox-label input[type="checkbox"] {
      accent-color: rgba(102, 126, 234, 0.8);
    }

    /* Selected Date Dark Mode */
    body.dark-mode .selected-date {
      color: rgba(255, 255, 255, 0.9);
    }

    /* Form Row Dark Mode */
    body.dark-mode .form-row {
      background: transparent;
    }

    /* Action Buttons Dark Mode */
    body.dark-mode .action-btn {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .action-btn:hover:not(:disabled) {
      background: rgba(26, 26, 26, 0.5);
    }

    body.dark-mode .view-tasks-btn {
      background: rgba(102, 126, 234, 0.8);
    }

    body.dark-mode .add-task-btn {
      background: rgba(74, 222, 128, 0.8);
    }

    body.dark-mode .time-block-btn {
      background: rgba(52, 152, 219, 0.8);
    }

    /* Calendar Navigation Section Dark Mode */
    body.dark-mode .calendar-nav-section {
      background: transparent;
    }

    body.dark-mode .calendar-nav {
      background: transparent;
    }

    /* Productivity Actions Dark Mode */
    body.dark-mode .productivity-actions {
      background: transparent;
    }

    /* Calendar Stats Dark Mode */
    body.dark-mode .calendar-stats {
      background: transparent;
    }

    /* Calendar Content Dark Mode */
    body.dark-mode .calendar-content {
      background: transparent;
    }

    /* Month View Dark Mode */
    body.dark-mode .month-view {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    /* Year View Dark Mode */
    body.dark-mode .year-view {
      background: transparent;
    }

    /* Day Header Dark Mode */
    body.dark-mode .day-header {
      background: transparent;
    }

    /* Day Actions Dark Mode */
    body.dark-mode .day-actions {
      background: transparent;
    }

    /* Time Block Indicators Dark Mode */
    body.dark-mode .time-block-indicators {
      background: transparent;
    }

    body.dark-mode .time-block-indicator {
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 4px rgba(255, 255, 255, 0.1);
    }

    /* Task Indicators Dark Mode */
    body.dark-mode .task-indicators {
      background: transparent;
    }

    /* More Tasks Dark Mode */
    body.dark-mode .more-tasks {
      color: rgba(255, 255, 255, 0.7);
    }

    /* ============================================
       END DARK MODE STYLES
       ============================================ */

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

      .month-view {
        padding: 1.5rem;
      }

      .calendar-grid {
        grid-template-columns: repeat(7, 1fr);
      }

      .calendar-day {
        min-height: 100px;
        padding: 0.75rem 0.5rem;
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

      /* Productivity Features Responsive */
      .productivity-actions {
        flex-wrap: wrap;
        justify-content: center;
      }
      
      .eisenhower-grid {
        grid-template-columns: 1fr;
        grid-template-rows: repeat(4, 1fr);
        height: 800px;
      }
      
      .eisenhower-legend {
        flex-direction: column;
        gap: 0.5rem;
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
  viewMode: 'month' | 'year' = 'month';
  selectedDay: CalendarDay | null = null;
  
  showCreateTaskModal = false;
  selectedDateForNewTask: Date | null = null;
  
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskDueDate: string = '';
  newTaskPriority: number = 2;
  newTaskCategory: string = '';
  newTaskEisenhowerCategory: string = 'urgent-important';
  newTaskTagInput: string = '';
  newTaskTags: string[] = [];
  newTaskEstimatedDuration: number | null = null;
  newTaskDifficulty: string = 'medium';
  newTaskSubtasks: string[] = [];
  newSubtaskInput = '';
  newTaskParentTaskId: number | null = null;
  newTaskDependsOnTaskIds: number[] = [];
  selectedDependencyTaskId: number | null = null;
  availableParentTasks: Task[] = [];
  availableDependencyTasks: Task[] = [];
  newTaskAttachments: Attachment[] = [];
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
    category: '',
    completed: false,
    isRecurring: false,
    recurrencePattern: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrenceInterval: 1,
    estimatedDuration: null as number | null,
    difficulty: 'medium' as TaskDifficulty,
    parentTaskId: null as number | null
  };
  
  editTaskTags: string[] = [];
  editTaskTagInput: string = '';
  editTaskSubtasks: string[] = [];
  editSubtaskInput = '';
  editTaskDependsOnTaskIds: number[] = [];
  selectedEditDependencyTaskId: number | null = null;
  editTaskAttachments: Attachment[] = [];

  isEditing = false;
  editError = '';

  updatingTaskIds = new Set<number>();

  // Productivity Features Properties
  eisenhowerMatrix: EisenhowerCategory[] = [
    {
      id: 'urgent-important',
      name: 'Do First',
      description: 'Urgent and important tasks',
      color: '#e74c3c',
      icon: '🚨'
    },
    {
      id: 'urgent-not-important',
      name: 'Schedule',
      description: 'Urgent but not important tasks',
      color: '#f39c12',
      icon: '⏰'
    },
    {
      id: 'not-urgent-important',
      name: 'Delegate',
      description: 'Not urgent but important tasks',
      color: '#3498db',
      icon: '👥'
    },
    {
      id: 'not-urgent-not-important',
      name: 'Eliminate',
      description: 'Not urgent and not important tasks',
      color: '#95a5a6',
      icon: '🗑️'
    }
  ];

  productivitySettings: ProductivitySettings = {
    enableEatTheFrog: true,
    defaultTimeBlockDuration: 60,
    reminderNotifications: true,
    reminderTime: 30,
    workingHours: {
      start: '09:00',
      end: '17:00'
    }
  };

  timeBlocks: TimeBlock[] = [];
  showEisenhowerModal = false;
  showTimeBlockModal = false;
  selectedTaskForTimeBlock: Task | null = null;
  
  // Time Block Form
  selectedTimeBlockTaskId: number | null = null;
  newTimeBlockDate: string = '';
  newTimeBlockStartTime: string = '09:00';
  newTimeBlockDuration: number = 60;

  ngOnInit(): void {
    this.loadTasks();
    this.generateCalendar();
    this.initializeTimeBlocks();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks;
        this.generateCalendar();
      },
      error: (error: any) => {
        console.error('Error loading tasks for calendar:', error);
      }
    });
  }

  // Add this method to your component class
getFormattedBlockDate(dateString: string): string {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  return this.formatDate(date);
}

  // ORIGINAL METHODS
  get currentMonth(): string {
    return this.currentDate.toLocaleDateString('en-US', { month: 'long' });
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  setViewMode(mode: 'month' | 'year'): void {
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
    }
  }

  nextPeriod(): void {
    if (this.viewMode === 'year') {
      this.currentDate = new Date(this.currentYear + 1, 0, 1);
    } else {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
      this.generateCalendar();
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
      const timeBlocks = this.getTimeBlocksForDate(date);
      
      this.calendarDays.push({
        date,
        isCurrentMonth,
        isToday,
        tasks,
        timeBlocks
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
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

  isDaySelectable(day: CalendarDay): boolean {
    return day.tasks.length > 0;
  }

  onDayClick(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isCurrentMonth) return;
    
    this.selectedDateForNewTask = new Date(day.date);
    this.initializeTaskForm();
    this.showCreateTaskModal = true;
  }

  onYearMonthClick(monthData: { month: string, year: number, tasks: Task[] }, event: Event): void {
    event.stopPropagation();
    
    // If the month has no tasks, directly open the add task modal with the first day of that month
    if (monthData.tasks.length === 0) {
      const monthIndex = this.months.findIndex(m => m === monthData.month);
      if (monthIndex !== -1) {
        // Set the date to the first day of the selected month
        this.selectedDateForNewTask = new Date(monthData.year, monthIndex, 1);
        this.initializeTaskForm();
        this.showCreateTaskModal = true;
        return;
      }
    }
    
    // If the month has tasks, show the month selection modal
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
    this.newTaskEstimatedDuration = null;
    this.newTaskDifficulty = 'medium';
    this.newTaskSubtasks = [];
    this.newSubtaskInput = '';
    this.newTaskParentTaskId = null;
    this.newTaskDependsOnTaskIds = [];
    this.selectedDependencyTaskId = null;
    this.newTaskAttachments = [];
    this.newTaskIsRecurring = false;
    this.newTaskRecurrencePattern = 'daily';
    this.newTaskRecurrenceInterval = 1;
    this.updateAvailableTasks();
  }

  getFormattedDueDate(): string {
    return this.newTaskDueDate;
  }

  onDueDateChange(event: any): void {
    this.newTaskDueDate = event.target.value;
  }

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

  // Edit tag helpers
  onEditTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addEditTag();
    }
  }

  addEditTag(): void {
    const tag = this.editTaskTagInput.trim();
    if (tag && !this.editTaskTags.includes(tag)) {
      this.editTaskTags.push(tag);
      this.editTaskTagInput = '';
    }
  }

  removeEditTag(tagToRemove: string): void {
    this.editTaskTags = this.editTaskTags.filter(tag => tag !== tagToRemove);
  }

  // Subtask helpers
  addSubtaskToForm(event?: Event, isEdit: boolean = false): void {
    if (event) {
      event.preventDefault();
    }
    if (isEdit) {
      if (this.editSubtaskInput.trim()) {
        this.editTaskSubtasks.push(this.editSubtaskInput.trim());
        this.editSubtaskInput = '';
      }
    } else {
      if (this.newSubtaskInput.trim()) {
        this.newTaskSubtasks.push(this.newSubtaskInput.trim());
        this.newSubtaskInput = '';
      }
    }
  }

  removeSubtaskFromForm(index: number, isEdit: boolean = false): void {
    if (isEdit) {
      this.editTaskSubtasks.splice(index, 1);
    } else {
      this.newTaskSubtasks.splice(index, 1);
    }
  }

  // Dependency helpers
  addDependencyToForm(): void {
    if (this.selectedDependencyTaskId && !this.newTaskDependsOnTaskIds.includes(this.selectedDependencyTaskId)) {
      this.newTaskDependsOnTaskIds.push(this.selectedDependencyTaskId);
      this.selectedDependencyTaskId = null;
    }
  }

  addEditDependencyToForm(): void {
    if (this.selectedEditDependencyTaskId && !this.editTaskDependsOnTaskIds.includes(this.selectedEditDependencyTaskId)) {
      if (this.editModalData.task && this.selectedEditDependencyTaskId === this.editModalData.task.id) {
        alert('A task cannot depend on itself');
        return;
      }
      this.editTaskDependsOnTaskIds.push(this.selectedEditDependencyTaskId);
      this.selectedEditDependencyTaskId = null;
    }
  }

  removeDependencyFromForm(taskId: number): void {
    this.newTaskDependsOnTaskIds = this.newTaskDependsOnTaskIds.filter(id => id !== taskId);
  }

  removeEditDependencyFromForm(taskId: number): void {
    this.editTaskDependsOnTaskIds = this.editTaskDependsOnTaskIds.filter(id => id !== taskId);
  }

  getTaskById(taskId: number): Task | undefined {
    return this.tasks.find(t => t.id === taskId);
  }

  updateAvailableTasks(): void {
    this.availableParentTasks = this.tasks.filter(t => 
      !t.parentTaskId &&
      (!this.editModalData.task || t.id !== this.editModalData.task.id)
    );
    
    this.availableDependencyTasks = this.tasks.filter(t => 
      (!this.editModalData.task || t.id !== this.editModalData.task.id)
    );
  }

  onParentTaskChange(): void {
    this.updateAvailableTasks();
  }

  onRecurrenceToggle(): void {
    if (!this.newTaskIsRecurring) {
      this.newTaskRecurrencePattern = 'daily';
      this.newTaskRecurrenceInterval = 1;
    }
  }

  onAttachmentsChange(attachments: Attachment[]): void {
    this.newTaskAttachments = attachments;
  }

  onEditAttachmentsChange(attachments: Attachment[]): void {
    this.editTaskAttachments = attachments;
  }

  get enhancedCategories(): Array<{name: string; icon: string; color: string}> {
    return [
      { name: 'Personal', icon: '🏠', color: '#4ade80' },
      { name: 'Work', icon: '💼', color: '#3b82f6' },
      { name: 'Shopping', icon: '🛒', color: '#f59e0b' },
      { name: 'Health', icon: '🏥', color: '#ef4444' },
      { name: 'Education', icon: '🎓', color: '#8b5cf6' },
      { name: 'Finance', icon: '💰', color: '#10b981' },
      { name: 'Travel', icon: '✈️', color: '#06b6d4' },
      { name: 'Other', icon: '📦', color: '#6b7280' }
    ];
  }

  formatDateForModal(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

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
        tasks,
        timeBlocks: []
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

  updateTaskDueDate(taskId: number, newDueDate: Date): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      const formattedDate = newDueDate.toISOString().split('T')[0];
      
      const { subtasks, dependencies, subtaskCount, completedSubtaskCount, canBeCompleted, blockingReasons, ...updateData } = task;
      this.taskService.updateTask(taskId, {
        ...updateData,
        dueDate: formattedDate
      }).subscribe({
        next: (updatedTask) => {
          const index = this.tasks.findIndex(t => t.id === taskId);
          if (index !== -1) {
            this.tasks[index] = updatedTask;
            this.generateCalendar();
          }
        },
        error: (error) => {
          console.error('Error updating task date:', error);
          this.generateCalendar();
        }
      });
    }
  }

  toggleTaskCompletion(taskId: number): void {
    if (this.updatingTaskIds.has(taskId)) {
      return;
    }
    
    this.updatingTaskIds.add(taskId);
    
    this.taskService.toggleTaskCompletion(taskId).subscribe({
      next: (updatedTask: Task) => {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          
          this.generateCalendar();
          
          if (this.selectedDay) {
            this.selectedDay.tasks = this.getTasksForDate(this.selectedDay.date);
          }
          
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
    event.stopPropagation();
    
    if (this.updatingTaskIds.has(taskId)) {
      return;
    }
    
    this.updatingTaskIds.add(taskId);
    
    this.taskService.toggleTaskCompletion(taskId).subscribe({
      next: (updatedTask: Task) => {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          
          this.generateCalendar();
          
          if (this.selectedDay) {
            this.selectedDay.tasks = this.getTasksForDate(this.selectedDay.date);
          }
          
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
          category: task.category || '',
          completed: task.completed,
          isRecurring: task.isRecurring || false,
          recurrencePattern: (task.recurrencePattern as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily',
          recurrenceInterval: task.recurrenceInterval || 1,
          estimatedDuration: (task as any).estimatedDuration || null,
          difficulty: (task as any).difficulty || 'medium',
          parentTaskId: task.parentTaskId || null
        };
        this.editTaskTags = [...(task.tags || [])];
        this.editTaskTagInput = '';
        this.editTaskSubtasks = task.subtasks?.map(st => st.title) || [];
        this.editSubtaskInput = '';
        this.editTaskDependsOnTaskIds = [...(task.dependsOnTaskIds || [])];
        this.selectedEditDependencyTaskId = null;
        this.updateAvailableTasks();
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

    const priority = typeof this.editFormData.priority === 'string' 
      ? parseInt(this.editFormData.priority, 10) 
      : (this.editFormData.priority || 1);

    const updateData: any = {
      title: this.editFormData.title.trim(),
      description: this.editFormData.description.trim() || undefined,
      dueDate: this.editFormData.dueDate || undefined,
      priority: priority,
      category: this.editFormData.category || undefined,
      tags: this.editTaskTags,
      estimatedDuration: this.editFormData.estimatedDuration || undefined,
      difficulty: this.editFormData.difficulty as any,
      parentTaskId: this.editFormData.parentTaskId || undefined,
      dependsOnTaskIds: this.editTaskDependsOnTaskIds.length > 0 ? this.editTaskDependsOnTaskIds : undefined,
      completed: this.editFormData.completed,
      isRecurring: this.editFormData.isRecurring || false,
      recurrencePattern: this.editFormData.isRecurring ? (this.editFormData.recurrencePattern as any) : 'none',
      recurrenceInterval: this.editFormData.isRecurring ? this.editFormData.recurrenceInterval : 1
    };

    this.taskService.updateTask(this.editModalData.taskId, updateData).subscribe({
      next: async (updatedTask: Task) => {
        // Handle subtasks - this is simplified, you might want to update existing ones
        if (this.editTaskSubtasks.length > 0) {
          for (const subtaskTitle of this.editTaskSubtasks) {
            await firstValueFrom(this.taskService.createTask({ 
              title: subtaskTitle, 
              parentTaskId: this.editModalData.taskId 
            } as any));
          }
        }
        
        const index = this.tasks.findIndex(t => t.id === this.editModalData.taskId);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        
        this.isEditing = false;
        this.closeEditModal();
        
        this.loadTasks(); // Reload to get updated subtasks
        this.generateCalendar();
        
        if (this.selectedDay) {
          this.selectedDay.tasks = this.getTasksForDate(this.selectedDay.date);
        }
      },
      error: (error: any) => {
        this.editError = 'Failed to update task. Please try again.';
        this.isEditing = false;
        console.error('Error updating task:', error);
        alert(`Failed to update task: ${error?.message || 'Unknown error'}`);
      }
    });
  }

  onDeleteTask(): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(this.editModalData.taskId).subscribe({
        next: () => {
          this.tasks = this.tasks.filter(t => t.id !== this.editModalData.taskId);
          
          this.closeEditModal();
          
          this.generateCalendar();
          
          if (this.selectedDay) {
            const freshTasks = this.getTasksForDate(this.selectedDay.date);
            
            if (freshTasks.length === 0) {
              this.selectedDay = null;
            } else {
              this.selectedDay.tasks = freshTasks;
            }
          }
          
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
      category: '',
      completed: false,
      isRecurring: false,
      recurrencePattern: 'daily',
      recurrenceInterval: 1,
      estimatedDuration: null,
      difficulty: 'medium',
      parentTaskId: null
    };
    this.editTaskTags = [];
    this.editTaskTagInput = '';
    this.editTaskSubtasks = [];
    this.editSubtaskInput = '';
    this.editTaskDependsOnTaskIds = [];
    this.selectedEditDependencyTaskId = null;
    this.editTaskAttachments = [];
    this.editError = '';
    this.isEditing = false;
  }

  onEditRecurrenceToggle(): void {
    if (!this.editFormData.isRecurring) {
      this.editFormData.recurrencePattern = 'daily';
      this.editFormData.recurrenceInterval = 1;
    }
  }

  createTaskFromModal(): void {
    if (!this.newTaskTitle.trim()) {
      return;
    }

    const priority = typeof this.newTaskPriority === 'string' 
      ? parseInt(this.newTaskPriority, 10) 
      : (this.newTaskPriority || 1);

    const newTask: any = {
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription || '',
      dueDate: this.newTaskDueDate || undefined,
      priority: priority,
      category: this.newTaskCategory || 'Other',
      tags: this.newTaskTags || [],
      estimatedDuration: this.newTaskEstimatedDuration || undefined,
      difficulty: this.newTaskDifficulty as any,
      parentTaskId: this.newTaskParentTaskId || undefined,
      dependsOnTaskIds: this.newTaskDependsOnTaskIds.length > 0 ? this.newTaskDependsOnTaskIds : undefined,
      isRecurring: this.newTaskIsRecurring || false,
      recurrencePattern: this.newTaskIsRecurring ? (this.newTaskRecurrencePattern as RecurrencePattern) : 'none',
      recurrenceInterval: this.newTaskIsRecurring ? this.newTaskRecurrenceInterval : 1
    };

    this.taskService.createTask(newTask).subscribe({
      next: async (createdTask) => {
        // Create subtasks if any were added
        if (this.newTaskSubtasks.length > 0) {
          for (const subtaskTitle of this.newTaskSubtasks) {
            await firstValueFrom(this.taskService.createTask({ 
              title: subtaskTitle, 
              parentTaskId: createdTask.id 
            } as any));
          }
        }
        
        this.tasks.push(createdTask);
        this.generateCalendar();
        this.closeCreateTaskModal();
      },
      error: (error) => {
        console.error('Error creating task:', error);
        alert(`Failed to create task: ${error?.message || 'Unknown error'}`);
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
    this.newTaskEstimatedDuration = null;
    this.newTaskDifficulty = 'medium';
    this.newTaskSubtasks = [];
    this.newSubtaskInput = '';
    this.newTaskParentTaskId = null;
    this.newTaskDependsOnTaskIds = [];
    this.selectedDependencyTaskId = null;
    this.newTaskAttachments = [];
    this.newTaskIsRecurring = false;
    this.newTaskRecurrencePattern = 'daily';
    this.newTaskRecurrenceInterval = 1;
  }

  // PRODUCTIVITY FEATURES METHODS

  // Eisenhower Matrix Methods
  showEisenhowerMatrix(): void {
    this.showEisenhowerModal = true;
  }

  getEisenhowerCategory(task: Task): EisenhowerCategory | undefined {
    const isUrgent = task.priority === 3 || this.isTaskDueSoon(task);
    const isImportant = task.priority >= 2;
    
    if (isUrgent && isImportant) {
      return this.eisenhowerMatrix.find(c => c.id === 'urgent-important');
    } else if (isUrgent && !isImportant) {
      return this.eisenhowerMatrix.find(c => c.id === 'urgent-not-important');
    } else if (!isUrgent && isImportant) {
      return this.eisenhowerMatrix.find(c => c.id === 'not-urgent-important');
    } else {
      return this.eisenhowerMatrix.find(c => c.id === 'not-urgent-not-important');
    }
  }

  isTaskDueSoon(task: Task): boolean {
    if (!task.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 2;
  }

  getTasksByEisenhowerCategory(categoryId: string): Task[] {
    return this.tasks.filter(task => {
      const taskCategory = this.getEisenhowerCategory(task);
      return taskCategory?.id === categoryId;
    });
  }

  onEisenhowerDrop(event: CdkDragDrop<any>): void {
    const task: Task = event.item.data;
    const newCategoryId = event.container.id;
    
    let newPriority = task.priority;
    
    switch (newCategoryId) {
      case 'urgent-important':
        newPriority = 3;
        break;
      case 'urgent-not-important':
        newPriority = 2;
        break;
      case 'not-urgent-important':
        newPriority = 2;
        break;
      case 'not-urgent-not-important':
        newPriority = 1;
        break;
    }
    
    this.updateTaskPriority(task.id, newPriority);
  }

  updateTaskPriority(taskId: number, priority: number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      const { subtasks, dependencies, subtaskCount, completedSubtaskCount, canBeCompleted, blockingReasons, ...updateData } = task;
      this.taskService.updateTask(taskId, {
        ...updateData,
        priority
      }).subscribe({
        next: (updatedTask) => {
          const index = this.tasks.findIndex(t => t.id === taskId);
          if (index !== -1) {
            this.tasks[index] = updatedTask;
            this.generateCalendar();
          }
        },
        error: (error) => {
          console.error('Error updating task priority:', error);
        }
      });
    }
  }

  // Eat the Frog Methods
  get eatTheFrogTask(): Task | null {
    if (!this.productivitySettings.enableEatTheFrog) return null;
    
    const pendingTasks = this.tasks.filter(task => !task.completed);
    if (pendingTasks.length === 0) return null;

    return pendingTasks.reduce((mostImportant, task) => {
      if (!mostImportant) return task;
      
      const currentScore = this.calculateTaskImportanceScore(task);
      const mostImportantScore = this.calculateTaskImportanceScore(mostImportant);
      
      return currentScore > mostImportantScore ? task : mostImportant;
    }, pendingTasks[0]);
  }

  calculateTaskImportanceScore(task: Task): number {
    let score = 0;
    
    score += task.priority * 3;
    
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 0) {
        score += 10;
      } else if (daysUntilDue <= 1) {
        score += 8;
      } else if (daysUntilDue <= 3) {
        score += 5;
      } else if (daysUntilDue <= 7) {
        score += 2;
      }
    }
    
    const eisenhowerCategory = this.getEisenhowerCategory(task);
    if (eisenhowerCategory?.id === 'urgent-important') {
      score += 6;
    } else if (eisenhowerCategory?.id === 'urgent-not-important') {
      score += 4;
    } else if (eisenhowerCategory?.id === 'not-urgent-important') {
      score += 3;
    }
    
    return score;
  }

  focusOnFrogTask(): void {
    if (this.eatTheFrogTask) {
      const frogTaskElement = document.querySelector(`[data-task-id="${this.eatTheFrogTask.id}"]`);
      if (frogTaskElement) {
        frogTaskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        frogTaskElement.classList.add('highlight-pulse');
        setTimeout(() => {
          frogTaskElement.classList.remove('highlight-pulse');
        }, 2000);
      }
    }
  }

  startFrogTask(): void {
    if (this.eatTheFrogTask) {
      this.scheduleTimeBlock(this.eatTheFrogTask, new Date());
    }
  }

  // Time Blocking Methods
  showTimeBlocking(): void {
    this.showTimeBlockModal = true;
    this.initializeTimeBlockForm();
  }

  initializeTimeBlocks(): void {
    const savedTimeBlocks = localStorage.getItem('timeBlocks');
    if (savedTimeBlocks) {
      this.timeBlocks = JSON.parse(savedTimeBlocks);
    }
  }

  initializeTimeBlockForm(): void {
    this.newTimeBlockDate = new Date().toISOString().split('T')[0];
    this.newTimeBlockStartTime = this.productivitySettings.workingHours.start;
    this.newTimeBlockDuration = this.productivitySettings.defaultTimeBlockDuration;
    this.selectedTimeBlockTaskId = null;
  }

  getAvailableTimeSlots(): string[] {
    const slots: string[] = [];
    const startHour = parseInt(this.productivitySettings.workingHours.start.split(':')[0]);
    const endHour = parseInt(this.productivitySettings.workingHours.end.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  }

  calculateEndTime(): string {
    if (!this.newTimeBlockStartTime) return '';
    
    const [hours, minutes] = this.newTimeBlockStartTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + this.newTimeBlockDuration * 60000);
    return endDate.toTimeString().slice(0, 5);
  }

  scheduleTimeBlock(task: Task, date: Date, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.selectedTaskForTimeBlock = task;
    this.selectedTimeBlockTaskId = task.id;
    this.newTimeBlockDate = new Date(date).toISOString().split('T')[0];
    this.showTimeBlockModal = true;
  }

  addTimeBlockToDay(day: CalendarDay): void {
    this.selectedDateForNewTask = new Date(day.date);
    this.showTimeBlockModal = true;
    this.initializeTimeBlockForm();
  }

  saveTimeBlock(): void {
    if (!this.selectedTimeBlockTaskId || !this.newTimeBlockDate || !this.newTimeBlockStartTime) {
      return;
    }

    const endTime = this.calculateEndTime();
    const task = this.tasks.find(t => t.id === this.selectedTimeBlockTaskId);

    const newTimeBlock: TimeBlock = {
      id: Date.now(),
      taskId: this.selectedTimeBlockTaskId,
      startTime: this.newTimeBlockStartTime,
      endTime: endTime,
      date: this.newTimeBlockDate,
      duration: this.newTimeBlockDuration,
      completed: false,
      title: task?.title
    };

    this.timeBlocks.push(newTimeBlock);
    this.saveTimeBlocksToStorage();
    this.generateCalendar();
    this.closeTimeBlockModal();
  }

  completeTimeBlock(blockId: number): void {
    const block = this.timeBlocks.find(b => b.id === blockId);
    if (block) {
      block.completed = !block.completed;
      this.saveTimeBlocksToStorage();
      this.generateCalendar();
    }
  }

  deleteTimeBlock(blockId: number): void {
    this.timeBlocks = this.timeBlocks.filter(b => b.id !== blockId);
    this.saveTimeBlocksToStorage();
    this.generateCalendar();
  }

  getTimeBlocksForDate(date: Date): TimeBlock[] {
    const targetDate = new Date(date).toISOString().split('T')[0];
    return this.timeBlocks.filter(block => block.date === targetDate);
  }

  getTopTimeBlocks(blocks: TimeBlock[], limit: number): TimeBlock[] {
    return blocks.slice(0, limit);
  }

  getTimeBlockColor(block: TimeBlock): string {
    if (block.completed) return '#4ade80';
    
    const task = this.tasks.find(t => t.id === block.taskId);
    return task ? this.getPriorityColor(task.priority) : '#3498db';
  }

  getTimeBlockTooltip(block: TimeBlock): string {
    const task = this.tasks.find(t => t.id === block.taskId);
    const status = block.completed ? 'Completed' : 'Scheduled';
    return `${task?.title || 'Time Block'} - ${block.startTime} to ${block.endTime} - ${status}`;
  }

  saveTimeBlocksToStorage(): void {
    localStorage.setItem('timeBlocks', JSON.stringify(this.timeBlocks));
  }

  closeTimeBlockModal(): void {
    this.showTimeBlockModal = false;
    this.selectedTaskForTimeBlock = null;
    this.selectedTimeBlockTaskId = null;
  }

  // Helper Methods
  getPendingTasks(): Task[] {
    return this.tasks.filter(task => !task.completed);
  }

  getTaskTitle(taskId: number): string {
    const task = this.tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown Task';
  }

  setTaskPriority(taskId: number, eisenhowerCategory: string, event: Event): void {
    event.stopPropagation();
    
    let newPriority = 2;
    switch (eisenhowerCategory) {
      case 'urgent-important':
        newPriority = 3;
        break;
      case 'urgent-not-important':
        newPriority = 2;
        break;
      case 'not-urgent-important':
        newPriority = 2;
        break;
      case 'not-urgent-not-important':
        newPriority = 1;
        break;
    }
    
    this.updateTaskPriority(taskId, newPriority);
  }
}