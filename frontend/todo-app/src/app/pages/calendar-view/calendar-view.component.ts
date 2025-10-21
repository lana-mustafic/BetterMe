import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, CreateTaskRequest } from '../../models/task.model';

// Import each drag-drop component individually
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    // Import drag and drop directives individually
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
                      ></div>
                    }
                    @if (day.tasks.length > 3) {
                      <div class="more-tasks">+{{ day.tasks.length - 3 }}</div>
                    }
                  </div>
                } @else {
                  <!-- ADD: Plus icon for empty days -->
                  <div class="add-task-hint" *ngIf="day.isCurrentMonth">
                    <span class="plus-icon">+</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Week View with Drag & Drop -->
      @if (viewMode === 'week') {
        <div class="week-view" cdkDropListGroup>
          <div class="week-header">
            @for (day of currentWeekDays; track day.getTime(); let dayIndex = $index) {
              <div 
                class="week-day-header"
                (click)="onWeekDayClick(day, $event)"
              >
                <div class="week-day-name">{{ getWeekdayName(day) }}</div>
                <div class="week-date">{{ day.getDate() }}</div>
                <div class="day-stats">
                  <span class="completed-count">{{ getCompletedTasksForDate(day) }}✓</span>
                  <span class="total-count">{{ getTasksForDate(day).length }}</span>
                </div>
                <!-- ADD: Plus icon for week day headers -->
                <div class="add-task-hint-week" *ngIf="isCurrentMonthWeek(day)">
                  <span class="plus-icon">+</span>
                </div>
              </div>
            }
          </div>
          
          <div class="week-grid">
            @for (day of currentWeekDays; track day.getTime(); let dayIndex = $index) {
              <div 
                class="week-day-column"
                cdkDropList
                [cdkDropListData]="{ day: day, tasks: getTasksForDate(day) }"
                (cdkDropListDropped)="onTaskDrop($event)"
                [cdkDropListConnectedTo]="getAllDropLists()"
                id="day-{{dayIndex}}"
                (click)="onWeekDayColumnClick(day, $event)"
              >
                <div class="week-day-tasks">
                  @for (task of getTasksForDate(day); track task.id) {
                    <div 
                      class="week-task-item"
                      [class.completed]="task.completed"
                      cdkDrag
                      [cdkDragData]="task"
                      [style.border-left-color]="task.completed ? '#28a745' : getPriorityColor(task.priority)"
                      [style.opacity]="task.completed ? '0.7' : '1'"
                    >
                      <div class="week-task-content">
                        <div class="week-task-title">
                          @if (task.completed) {
                            <span class="completion-check">✓</span>
                          }
                          {{ task.title }}
                        </div>
                        <div class="week-task-meta">
                          <span class="week-task-time">
                            {{ formatTime(task.dueDate) }}
                          </span>
                          @if (task.completed) {
                            <span class="completed-badge">Done</span>
                          }
                        </div>
                      </div>
                      <div *cdkDragPlaceholder class="task-drag-placeholder"></div>
                    </div>
                  }
                  @if (getTasksForDate(day).length === 0) {
                    <div 
                      class="drop-zone"
                      (click)="onWeekDayColumnClick(day, $event)"
                    >
                      <div class="drop-zone-content">
                        <span class="drop-zone-plus">+</span>
                        <span class="drop-zone-text">Click to add task</span>
                      </div>
                    </div>
                  }
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
                class="year-month"
                (click)="onYearMonthClick(monthData, $event)"
              >
                <div class="month-header">
                  <h4>{{ monthData.month }}</h4>
                  <div class="month-stats">
                    <span class="completed-count">{{ getCompletedTasksForMonth(monthData.tasks) }}✓</span>
                    <span class="task-count">{{ monthData.tasks.length }} tasks</span>
                  </div>
                  <!-- ADD: Plus icon for year month headers -->
                  <div class="add-task-hint-year">
                    <span class="plus-icon">+</span>
                  </div>
                </div>
                
                <div class="month-tasks">
                  @for (task of monthData.tasks.slice(0, 5); track task.id) {
                    <div 
                      class="year-task-item"
                      [class.completed]="task.completed"
                      [style.background]="task.completed ? '#28a745' : getPriorityColor(task.priority)"
                    >
                      <div class="year-task-title">
                        @if (task.completed) {
                          <span class="completion-check">✓</span>
                        }
                        {{ task.title }}
                      </div>
                    </div>
                  }
                  @if (monthData.tasks.length > 5) {
                    <div class="more-tasks-year">+{{ monthData.tasks.length - 5 }} more</div>
                  }
                  @if (monthData.tasks.length === 0) {
                    <div class="empty-month">
                      <span class="empty-month-text">No tasks</span>
                      <span class="empty-month-hint">Click to add task</span>
                    </div>
                  }
                </div>
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

      <!-- Create Task Modal -->
      @if (showCreateTaskModal && selectedDateForNewTask) {
        <div class="modal-overlay" (click)="closeCreateTaskModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Add New Task</h3>
              <button class="close-btn" (click)="closeCreateTaskModal()">×</button>
            </div>
            
            <div class="modal-body">
              <div class="selected-date">
                <strong>Date:</strong> {{ formatDateForModal(selectedDateForNewTask) }}
              </div>
              
              <div class="form-group">
                <label class="form-label">Task Title</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="What needs to be done?"
                  [(ngModel)]="newTaskTitle"
                  (keydown.enter)="createTaskFromModal()"
                  #titleInput
                  autofocus
                />
              </div>
              
              <div class="modal-actions">
                <button 
                  class="btn btn-primary" 
                  (click)="createTaskFromModal()"
                  [disabled]="!newTaskTitle.trim()"
                >
                  Add Task
                </button>
                <button class="btn btn-secondary" (click)="closeCreateTaskModal()">
                  Cancel
                </button>
              </div>
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
    }

    .task-indicator.completed {
      border: 1px solid white;
      box-shadow: 0 0 2px rgba(40, 167, 69, 0.5);
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
    }

    .week-task-item.completed {
      opacity: 0.8;
      background: linear-gradient(135deg, var(--bg-primary) 0%, #f0f9f0 100%);
    }

    .week-task-item.completed .week-task-title {
      text-decoration: line-through;
      color: var(--text-muted);
    }

    .week-task-item:hover {
      transform: translateX(2px);
      box-shadow: var(--shadow-md);
      background: var(--bg-secondary);
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

    /* Year View Styles */
    .year-view {
      margin-bottom: 2rem;
    }

    .year-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .year-month {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all var(--transition-normal);
      min-height: 150px;
      position: relative;
    }

    .year-month:hover {
      border-color: var(--accent-primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      background: var(--bg-secondary);
    }

    .month-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      position: relative;
    }

    .month-header h4 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1rem;
    }

    .month-stats {
      display: flex;
      gap: 0.5rem;
      font-size: 0.8rem;
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
      gap: 0.25rem;
    }

    .year-task-item {
      padding: 0.5rem;
      border-radius: 4px;
      color: var(--text-light);
      font-size: 0.8rem;
      transition: all var(--transition-normal);
    }

    .year-task-item.completed {
      opacity: 0.8;
    }

    .year-task-item.completed .year-task-title {
      text-decoration: line-through;
    }

    .year-task-item:hover {
      transform: translateX(2px);
      opacity: 0.9;
    }

    .year-task-title {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
    }

    .more-tasks-year {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8rem;
      font-style: italic;
      padding: 0.5rem;
    }

    .empty-month {
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .empty-month-text {
      font-size: 0.9rem;
    }

    .empty-month-hint {
      font-size: 0.8rem;
      color: var(--accent-primary);
      font-weight: 600;
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

    /* Create Task Modal Styles */
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
      background: var(--bg-primary);
      border-radius: 12px;
      padding: 0;
      max-width: 500px;
      width: 100%;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-color);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h3 {
      margin: 0;
      color: var(--text-primary);
    }

    .modal-body {
      padding: 1.5rem;
    }

    .selected-date {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      text-align: center;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
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

    .modal-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
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
    }
  `]
})
export class CalendarViewComponent implements OnInit {
  private taskService = inject(TaskService);

  tasks: Task[] = [];
  currentDate: Date = new Date();
  viewMode: 'month' | 'week' | 'year' = 'month';
  selectedDay: CalendarDay | null = null;
  
  // ADD: Properties for new task creation
  showCreateTaskModal = false;
  selectedDateForNewTask: Date | null = null;
  newTaskTitle = '';
  
  // ADD: Properties for year view month selection
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
      // Reset to current year when switching to year view
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
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last Saturday of the week containing the last day
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
    
    // Start from Sunday of the current week
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

  // NEW METHODS FOR COMPLETED TASKS

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

  getTaskTooltip(task: Task): string {
    const status = task.completed ? '✓ Completed' : '○ Pending';
    const priority = this.getPriorityText(task.priority);
    return `${task.title} - ${status} - ${priority} Priority`;
  }

  // Enhanced getTopTasks to show completed status
  getTopTasks(tasks: Task[], limit: number): Task[] {
    // Show a mix of completed and pending tasks
    const completed = tasks.filter(t => t.completed).slice(0, Math.ceil(limit / 2));
    const pending = tasks.filter(t => !t.completed).slice(0, limit - completed.length);
    return [...completed, ...pending].slice(0, limit);
  }

  getPriorityColor(priority: number): string {
    switch (priority) {
      case 3: return '#e74c3c'; // High
      case 2: return '#f39c12'; // Medium
      case 1: return '#27ae60'; // Low
      default: return '#667eea'; // Default
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

  // ADD: Method to handle day clicks for creating tasks (Month View)
  onDayClick(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isCurrentMonth) return;
    
    this.selectedDateForNewTask = new Date(day.date);
    this.showCreateTaskModal = true;
  }

  // ADD: Method to handle week day header clicks (Week View)
  onWeekDayClick(day: Date, event: Event): void {
    event.stopPropagation();
    if (!this.isCurrentMonthWeek(day)) return;
    
    this.selectedDateForNewTask = new Date(day);
    this.showCreateTaskModal = true;
  }

  // ADD: Method to handle week day column clicks (Week View)
  onWeekDayColumnClick(day: Date, event: Event): void {
    // Only trigger if clicking directly on the column (not on tasks)
    if ((event.target as HTMLElement).classList.contains('week-day-column') || 
        (event.target as HTMLElement).classList.contains('drop-zone')) {
      event.stopPropagation();
      if (!this.isCurrentMonthWeek(day)) return;
      
      this.selectedDateForNewTask = new Date(day);
      this.showCreateTaskModal = true;
    }
  }

  // ADD: Method to handle year month clicks (Year View)
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

  // ADD: Method to handle month day selection in year view
  onMonthDaySelect(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isCurrentMonth) return;
    
    this.selectedDateForNewTask = new Date(day.date);
    this.showCreateTaskModal = true;
    this.closeMonthSelectionModal();
  }

  // ADD: Generate days for month selection modal
  generateMonthSelectionDays(): void {
    if (!this.selectedYearMonth) return;
    
    this.monthSelectionDays = [];
    
    const year = this.selectedYearMonth.year;
    const month = this.selectedYearMonth.monthIndex;
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last Saturday of the week containing the last day
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

  // ADD: Get month days for selection modal
  getMonthDaysForSelection(): CalendarDay[] {
    return this.monthSelectionDays;
  }

  // ADD: Close month selection modal
  closeMonthSelectionModal(): void {
    this.showMonthSelectionModal = false;
    this.selectedYearMonth = null;
    this.monthSelectionDays = [];
  }

  // ADD: Check if week day is in current month
  isCurrentMonthWeek(day: Date): boolean {
    return day.getMonth() === this.currentDate.getMonth();
  }

  // ADD: Method to create task from modal
  createTaskFromModal(): void {
    if (this.newTaskTitle.trim() && this.selectedDateForNewTask) {
      const newTask: CreateTaskRequest = {
        title: this.newTaskTitle.trim(),
        description: '',
        dueDate: this.selectedDateForNewTask.toISOString().split('T')[0], // Format as YYYY-MM-DD
        priority: 2, // Default medium priority
        category: 'Other',
        tags: [],
        isRecurring: false,
        recurrencePattern: 'none',
        recurrenceInterval: 1
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
  }

  // ADD: Method to close modal
  closeCreateTaskModal(): void {
    this.showCreateTaskModal = false;
    this.selectedDateForNewTask = null;
    this.newTaskTitle = '';
  }

  // ADD: Method to format date for display
  formatDateForModal(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Drag & Drop Methods for Week View
  getAllDropLists(): string[] {
    return this.currentWeekDays.map((_, index) => `day-${index}`);
  }

  onTaskDrop(event: CdkDragDrop<any>): void {
    if (event.previousContainer === event.container) {
      // Reorder within same day
      moveItemInArray(
        event.container.data.tasks,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Move to different day
      const previousTasks = [...event.previousContainer.data.tasks];
      const currentTasks = [...event.container.data.tasks];
      const task = previousTasks[event.previousIndex];
      
      // Update task due date
      const newDueDate = event.container.data.day;
      this.updateTaskDueDate(task.id, newDueDate);
      
      transferArrayItem(
        previousTasks,
        currentTasks,
        event.previousIndex,
        event.currentIndex
      );

      // Update the tasks arrays
      event.previousContainer.data.tasks = previousTasks;
      event.container.data.tasks = currentTasks;
    }
  }

  // Year View Methods
  getYearViewMonths(): { month: string, year: number, tasks: Task[] }[] {
    const currentYear = this.currentDate.getFullYear();
    
    return this.months.map((month, index) => {
      // Get tasks for this month
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
      // Format date for backend (YYYY-MM-DD)
      const formattedDate = newDueDate.toISOString().split('T')[0];
      
      this.taskService.updateTask(taskId, {
        ...task,
        dueDate: formattedDate
      }).subscribe({
        next: (updatedTask) => {
          const index = this.tasks.findIndex(t => t.id === taskId);
          if (index !== -1) {
            this.tasks[index] = updatedTask;
            // Regenerate views to reflect changes
            this.generateCalendar();
            this.generateWeekView();
          }
        },
        error: (error) => {
          console.error('Error updating task date:', error);
          // Revert visual change on error
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

  editTask(taskId: number): void {
    // Navigate to task edit page - you can implement this based on your routing
    console.log('Edit task:', taskId);
  }
}