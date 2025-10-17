import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <div class="calendar-nav">
          <button class="nav-btn" (click)="previousMonth()">‹</button>
          <h2 class="calendar-title">{{ currentMonth }} {{ currentYear }}</h2>
          <button class="nav-btn" (click)="nextMonth()">›</button>
        </div>
        
        <div class="view-options">
          <button 
            class="view-option" 
            [class.active]="viewMode === 'month'"
            (click)="viewMode = 'month'"
          >
            Month
          </button>
          <button 
            class="view-option" 
            [class.active]="viewMode === 'week'"
            (click)="viewMode = 'week'"
          >
            Week
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
                (click)="selectDay(day)"
              >
                <div class="day-number">{{ day.date.getDate() }}</div>
                
                @if (day.tasks.length > 0) {
                  <div class="task-indicators">
                    @for (task of getTopTasks(day.tasks, 3); track task.id) {
                      <div 
                        class="task-indicator"
                        [style.background]="getPriorityColor(task.priority)"
                        [title]="task.title"
                      ></div>
                    }
                    @if (day.tasks.length > 3) {
                      <div class="more-tasks">+{{ day.tasks.length - 3 }}</div>
                    }
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
            <div class="week-day-header" *ngFor="let day of currentWeekDays">
              <div class="week-day-name">{{ getWeekdayName(day) }}</div>
              <div class="week-date">{{ day.getDate() }}</div>
            </div>
          </div>
          
          <div class="week-grid">
            @for (day of currentWeekDays; track day.getTime()) {
              <div class="week-day-column">
                <div class="week-day-tasks">
                  @for (task of getTasksForDate(day); track task.id) {
                    <div 
                      class="week-task-item"
                      [style.border-left-color]="getPriorityColor(task.priority)"
                    >
                      <div class="week-task-title">{{ task.title }}</div>
                      <div class="week-task-time">
                        {{ formatTime(task.dueDate) }}
                      </div>
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
                  <div class="task-title">{{ task.title }}</div>
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
    </div>
  `,
  styles: [`
    .calendar-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
      background: #667eea;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .nav-btn:hover {
      background: #5a6fd8;
      transform: scale(1.1);
    }

    .calendar-title {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
      font-weight: 700;
      min-width: 200px;
      text-align: center;
    }

    .view-options {
      display: flex;
      gap: 0.5rem;
      background: #f8f9fa;
      padding: 0.25rem;
      border-radius: 8px;
    }

    .view-option {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      color: #666;
      transition: all 0.2s ease;
    }

    .view-option.active {
      background: white;
      color: #667eea;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .view-option:hover:not(.active) {
      color: #333;
    }

    /* Month View Styles */
    .month-view {
      margin-bottom: 2rem;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: #e1e5e9;
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      overflow: hidden;
    }

    .weekday-header {
      background: #f8f9fa;
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #e1e5e9;
    }

    .calendar-day {
      background: white;
      padding: 0.75rem;
      min-height: 120px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .calendar-day:hover {
      background: #f8f9fa;
      border-color: #667eea;
    }

    .calendar-day.current-month {
      background: white;
    }

    .calendar-day:not(.current-month) {
      background: #f8f9fa;
      color: #adb5bd;
    }

    .calendar-day.today {
      background: #e7f1ff;
      border-color: #667eea;
    }

    .calendar-day.has-tasks {
      border-bottom: 3px solid #667eea;
    }

    .day-number {
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
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
    }

    .more-tasks {
      font-size: 0.7rem;
      color: #666;
      margin-left: 2px;
    }

    /* Week View Styles */
    .week-view {
      margin-bottom: 2rem;
    }

    .week-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
      border: 1px solid #e1e5e9;
    }

    .week-day-header {
      padding: 1rem;
      text-align: center;
      border-right: 1px solid #e1e5e9;
    }

    .week-day-header:last-child {
      border-right: none;
    }

    .week-day-name {
      font-weight: 600;
      color: #495057;
      margin-bottom: 0.25rem;
    }

    .week-date {
      font-size: 1.2rem;
      font-weight: 700;
      color: #333;
    }

    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border: 1px solid #e1e5e9;
      border-top: none;
      border-radius: 0 0 8px 8px;
      min-height: 400px;
    }

    .week-day-column {
      border-right: 1px solid #e1e5e9;
      min-height: 400px;
    }

    .week-day-column:last-child {
      border-right: none;
    }

    .week-day-tasks {
      padding: 0.5rem;
      height: 100%;
    }

    .week-task-item {
      background: white;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 6px;
      border-left: 4px solid #667eea;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .week-task-item:hover {
      transform: translateX(2px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .week-task-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .week-task-time {
      font-size: 0.8rem;
      color: #666;
    }

    /* Day Details Styles */
    .day-details {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e1e5e9;
    }

    .day-details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e1e5e9;
    }

    .day-details-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0.25rem;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #e9ecef;
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
      background: white;
      border-radius: 8px;
      border: 1px solid #e1e5e9;
      transition: all 0.2s ease;
    }

    .day-task-item:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    .day-task-item.completed {
      opacity: 0.7;
      background: #f8f9fa;
    }

    .day-task-item.completed .task-title {
      text-decoration: line-through;
    }

    .task-checkbox input {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .task-content {
      flex: 1;
    }

    .task-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .task-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
    }

    .task-category {
      background: #e9ecef;
      color: #495057;
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
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
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }

    .btn-small:hover {
      background: #f8f9fa;
      border-color: #667eea;
    }

    .no-tasks {
      text-align: center;
      padding: 2rem;
      color: #666;
      font-style: italic;
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
        border-bottom: 1px solid #e1e5e9;
      }

      .week-day-header:last-child,
      .week-day-column:last-child {
        border-bottom: none;
      }
    }
  `]
})
export class CalendarViewComponent implements OnInit {
  private taskService = inject(TaskService);

  tasks: Task[] = [];
  currentDate: Date = new Date();
  viewMode: 'month' | 'week' = 'month';
  selectedDay: CalendarDay | null = null;
  
  weekdays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

  getTopTasks(tasks: Task[], limit: number): Task[] {
    return tasks.slice(0, limit);
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

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
    this.generateWeekView();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
    this.generateWeekView();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
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