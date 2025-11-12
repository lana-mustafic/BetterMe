// kanban-board.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';
import { Task, UpdateTaskRequest } from '../../models/task.model';

interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  icon: string;
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="kanban-page">
      <div class="background-animation">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
      </div>

      <div class="container">
        <div class="kanban-container">
          <!-- Header -->
          <div class="kanban-header glass-card">
            <div class="header-content">
              <h1 class="gradient-text">Kanban Board</h1>
              <p class="subtitle">Drag and drop tasks to organize your workflow</p>
            </div>
            <div class="header-stats">
              <div class="stat-item">
                <span class="stat-number">{{ totalTasks }}</span>
                <span class="stat-label">Total Tasks</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ getCompletedTasks() }}</span>
                <span class="stat-label">Completed</span>
              </div>
            </div>
          </div>

          <!-- Kanban Board -->
          <div class="kanban-board" cdkDropListGroup>
            <div 
              *ngFor="let column of columns" 
              class="kanban-column"
              [class]="column.id"
            >
              <div class="column-header">
                <div class="column-title">
                  <span class="column-icon">{{ column.icon }}</span>
                  <h3>{{ column.title }}</h3>
                  <span class="task-count">{{ column.tasks.length }}</span>
                </div>
                <div class="column-actions">
                  <button class="btn-icon" (click)="addTaskToColumn(column.id)">
                    <span class="action-icon">+</span>
                  </button>
                </div>
              </div>

              <div
                class="task-list"
                cdkDropList
                [cdkDropListData]="column.tasks"
                [cdkDropListConnectedTo]="getConnectedColumns()"
                (cdkDropListDropped)="onTaskDrop($event, column.id)"
              >
                <div
                  *ngFor="let task of column.tasks"
                  class="task-card"
                  cdkDrag
                  [cdkDragData]="task"
                  [class.completed]="task.completed"
                  [class.loading]="updatingTaskIds.has(task.id)"
                >
                  <!-- Drag Preview -->
                  <div *cdkDragPreview class="task-preview">
                    <div class="preview-content">
                      <strong>{{ task.title }}</strong>
                      <div class="preview-meta">
                        <span class="priority-badge" [style.background]="getPriorityColor(task.priority)">
                          {{ getPriorityText(task.priority) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Task Content -->
                  <div class="task-content">
                    <div class="task-header">
                      <h4 class="task-title">{{ task.title }}</h4>
                      <div class="task-actions">
                        <button 
                          class="btn-icon complete-btn" 
                          (click)="toggleTaskCompletion(task.id, $event)"
                          [title]="task.completed ? 'Mark as pending' : 'Mark as completed'"
                        >
                          {{ task.completed ? '↶' : '✓' }}
                        </button>
                        <button 
                          class="btn-icon edit-btn" 
                          (click)="editTask(task, $event)"
                          title="Edit task"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>

                    <div class="task-body">
                      <p *ngIf="task.description" class="task-description">
                        {{ task.description }}
                      </p>

                      <div class="task-meta">
                        <!-- Due Date -->
                        <div *ngIf="task.dueDate" class="meta-item">
                          <span class="meta-icon">📅</span>
                          <span class="meta-text">{{ formatDate(task.dueDate) }}</span>
                          <span 
                            *ngIf="isOverdue(task.dueDate) && !task.completed" 
                            class="overdue-badge"
                          >
                            Overdue
                          </span>
                        </div>

                        <!-- Priority -->
                        <div class="meta-item">
                          <span class="meta-icon">🎯</span>
                          <span 
                            class="priority-tag" 
                            [style.background]="getPriorityColor(task.priority)"
                          >
                            {{ getPriorityText(task.priority) }}
                          </span>
                        </div>

                        <!-- Category -->
                        <div *ngIf="task.category" class="meta-item">
                          <span class="meta-icon">{{ getCategoryIcon(task.category) }}</span>
                          <span class="category-tag">{{ task.category }}</span>
                        </div>
                      </div>

                      <!-- Tags -->
                      <div *ngIf="task.tags && task.tags.length > 0" class="task-tags">
                        <span 
                          *ngFor="let tag of task.tags.slice(0, 2)" 
                          class="tag"
                          [style.background]="getTagColor(tag)"
                        >
                          {{ tag }}
                        </span>
                        <span *ngIf="task.tags.length > 2" class="tag-more">
                          +{{ task.tags.length - 2 }}
                        </span>
                      </div>
                    </div>

                    <!-- Loading State -->
                    <div *ngIf="updatingTaskIds.has(task.id)" class="task-loading">
                      <div class="loading-spinner"></div>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div *ngIf="column.tasks.length === 0" class="empty-column">
                  <div class="empty-icon">{{ column.icon }}</div>
                  <p>No tasks in {{ column.title.toLowerCase() }}</p>
                  <button class="btn-add-task" (click)="addTaskToColumn(column.id)">
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Task Modal -->
      <div *ngIf="showAddTaskModal" class="modal-overlay" (click)="closeAddTaskModal()">
        <div class="modal-content glass-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add New Task to {{ getColumnTitle(selectedColumn) }}</h3>
            <button class="close-btn" (click)="closeAddTaskModal()">×</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="createTask()">
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
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select 
                    class="form-control"
                    [(ngModel)]="newTaskPriority"
                    name="priority"
                  >
                    <option [value]="1">Low</option>
                    <option [value]="2">Medium</option>
                    <option [value]="3">High</option>
                  </select>
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
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="!newTaskTitle.trim()">
                  Create Task
                </button>
                <button type="button" class="btn btn-secondary" (click)="closeAddTaskModal()">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kanban-page {
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

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    .container {
      position: relative;
      z-index: 1;
      padding: 2rem 1rem;
    }

    .kanban-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .kanban-header {
      padding: 2rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.1rem;
    }

    .header-stats {
      display: flex;
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: white;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Kanban Board Layout */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      align-items: start;
    }

    .kanban-column {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      min-height: 600px;
      display: flex;
      flex-direction: column;
    }

    .kanban-column.todo {
      border-top: 4px solid #e74c3c;
    }

    .kanban-column.in-progress {
      border-top: 4px solid #f39c12;
    }

    .kanban-column.done {
      border-top: 4px solid #27ae60;
    }

    .column-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .column-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .column-title h3 {
      margin: 0;
      color: white;
      font-size: 1.2rem;
    }

    .column-icon {
      font-size: 1.5rem;
    }

    .task-count {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .column-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
    }

    .btn-icon:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }

    /* Task List */
    .task-list {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-list.cdk-drop-list-dragging {
      background: rgba(255, 255, 255, 0.05);
      border: 2px dashed rgba(255, 255, 255, 0.3);
    }

    /* Task Card */
    .task-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      cursor: grab;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .task-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .task-card.cdk-drag-preview {
      transform: rotate(5deg);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .task-card.cdk-drag-placeholder {
      opacity: 0.3;
    }

    .task-card.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .task-card.completed {
      opacity: 0.7;
      background: rgba(255, 255, 255, 0.05);
    }

    .task-card.completed::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #4ade80, #22d3ee);
    }

    .task-card.loading {
      opacity: 0.6;
      pointer-events: none;
    }

    .task-content {
      padding: 1.25rem;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .task-title {
      color: white;
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      line-height: 1.4;
      flex: 1;
    }

    .task-actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .task-card:hover .task-actions {
      opacity: 1;
    }

    .complete-btn {
      background: rgba(34, 197, 94, 0.3);
      border-color: rgba(34, 197, 94, 0.5);
    }

    .complete-btn:hover {
      background: rgba(34, 197, 94, 0.5);
    }

    .edit-btn {
      background: rgba(59, 130, 246, 0.3);
      border-color: rgba(59, 130, 246, 0.5);
    }

    .edit-btn:hover {
      background: rgba(59, 130, 246, 0.5);
    }

    .task-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-description {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      line-height: 1.4;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .task-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
    }

    .meta-icon {
      opacity: 0.8;
    }

    .meta-text {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }

    .priority-tag, .category-tag {
      padding: 0.3rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    .overdue-badge {
      background: rgba(231, 76, 60, 0.3);
      color: #e74c3c;
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
      margin-left: auto;
    }

    .task-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 0.3rem 0.6rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .tag-more {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
      padding: 0.3rem 0.6rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .task-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Task Preview During Drag */
    .task-preview {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .preview-content {
      color: white;
    }

    .preview-content strong {
      display: block;
      margin-bottom: 0.5rem;
    }

    .preview-meta {
      display: flex;
      gap: 0.5rem;
    }

    .priority-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
    }

    /* Empty Column State */
    .empty-column {
      text-align: center;
      padding: 3rem 2rem;
      color: rgba(255, 255, 255, 0.6);
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      margin: 1rem 0;
    }

    .empty-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-column p {
      margin-bottom: 1.5rem;
    }

    .btn-add-task {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
    }

    .btn-add-task:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
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
      max-width: 500px;
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
      font-size: 1.3rem;
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .kanban-board {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .kanban-column {
        min-height: 400px;
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem 0.5rem;
      }

      .kanban-header {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
        padding: 1.5rem;
      }

      .header-stats {
        justify-content: center;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .modal-overlay {
        padding: 1rem;
      }
    }
  `]
})
export class KanbanBoardComponent implements OnInit {
  private taskService = inject(TaskService);

  tasks: Task[] = [];
  columns: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: [],
      color: '#e74c3c',
      icon: '📋'
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: [],
      color: '#f39c12',
      icon: '🔄'
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [],
      color: '#27ae60',
      icon: '✅'
    }
  ];

  // Modal state
  showAddTaskModal = false;
  selectedColumn: string = '';
  
  // New task form
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskDueDate = '';
  newTaskPriority = 2;

  // Loading state
  updatingTaskIds = new Set<number>();

  // Categories for icons
  categories = [
    { name: 'Personal', icon: '🏠' },
    { name: 'Work', icon: '💼' },
    { name: 'Shopping', icon: '🛒' },
    { name: 'Health', icon: '🏥' },
    { name: 'Education', icon: '🎓' },
    { name: 'Finance', icon: '💰' },
    { name: 'Travel', icon: '✈️' },
    { name: 'Other', icon: '📦' }
  ];

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks;
        this.organizeTasksIntoColumns();
      },
      error: (error: any) => {
        console.error('Error loading tasks for kanban:', error);
      }
    });
  }

  organizeTasksIntoColumns(): void {
    // Reset columns
    this.columns.forEach(column => column.tasks = []);

    // Organize tasks into columns based on completion status and custom logic
    this.tasks.forEach(task => {
      if (task.completed) {
        this.columns[2].tasks.push(task); // Done
      } else {
        // Custom logic for In Progress vs To Do
        // You can modify this based on your task properties
        const isInProgress = this.isTaskInProgress(task);
        if (isInProgress) {
          this.columns[1].tasks.push(task); // In Progress
        } else {
          this.columns[0].tasks.push(task); // To Do
        }
      }
    });
  }

  isTaskInProgress(task: Task): boolean {
    // Custom logic to determine if a task is in progress
    // You can modify this based on your task properties
    return (
      task.tags?.includes('in-progress') ||
      task.tags?.includes('started') ||
      (task.dueDate && this.isDueSoon(task.dueDate)) ||
      task.priority === 3 // High priority tasks are considered in progress
    );
  }

  isDueSoon(dueDate: string): boolean {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  }

  // Drag and drop methods
  onTaskDrop(event: CdkDragDrop<Task[]>, targetColumnId: string): void {
    if (event.previousContainer === event.container) {
      // Reorder within same column
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Move to different column
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update task status based on target column
      const task = event.container.data[event.currentIndex];
      this.updateTaskStatus(task, targetColumnId);
    }
  }

  updateTaskStatus(task: Task, columnId: string): void {
    let completed = false;
    let updates: UpdateTaskRequest = {};

    switch (columnId) {
      case 'todo':
        completed = false;
        // Remove in-progress tag if it exists
        updates = {
          completed,
          tags: task.tags?.filter(tag => tag !== 'in-progress') || []
        };
        break;
      case 'in-progress':
        completed = false;
        // Add in-progress tag
        updates = {
          completed,
          tags: [...(task.tags || []), 'in-progress'].filter((v, i, a) => a.indexOf(v) === i)
        };
        break;
      case 'done':
        completed = true;
        // Remove in-progress tag
        updates = {
          completed,
          tags: task.tags?.filter(tag => tag !== 'in-progress') || []
        };
        break;
    }

    this.updatingTaskIds.add(task.id);
    this.taskService.updateTask(task.id, updates).subscribe({
      next: (updatedTask: Task) => {
        // Update the task in the local array
        const index = this.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        this.updatingTaskIds.delete(task.id);
      },
      error: (error: any) => {
        console.error('Error updating task status:', error);
        this.updatingTaskIds.delete(task.id);
        // Revert the move on error
        this.organizeTasksIntoColumns();
      }
    });
  }

  getConnectedColumns(): string[] {
    return this.columns.map(column => column.id);
  }

  // Task actions
  toggleTaskCompletion(taskId: number, event: Event): void {
    event.stopPropagation();
    
    if (this.updatingTaskIds.has(taskId)) return;

    this.updatingTaskIds.add(taskId);
    this.taskService.toggleTaskCompletion(taskId).subscribe({
      next: (updatedTask: Task) => {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        this.organizeTasksIntoColumns();
        this.updatingTaskIds.delete(taskId);
      },
      error: (error: any) => {
        console.error('Error toggling task completion:', error);
        this.updatingTaskIds.delete(taskId);
      }
    });
  }

  editTask(task: Task, event: Event): void {
    event.stopPropagation();
    // Implement edit functionality
    console.log('Edit task:', task);
    // You can open a modal or navigate to edit page
  }

  // Add task to column
  addTaskToColumn(columnId: string): void {
    this.selectedColumn = columnId;
    this.showAddTaskModal = true;
    this.resetNewTaskForm();
  }

  resetNewTaskForm(): void {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskDueDate = '';
    this.newTaskPriority = 2;
  }

  createTask(): void {
    if (!this.newTaskTitle.trim()) return;

    const taskData = {
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription,
      dueDate: this.newTaskDueDate || undefined,
      priority: this.newTaskPriority,
      tags: this.selectedColumn === 'in-progress' ? ['in-progress'] : []
    };

    this.taskService.createTask(taskData).subscribe({
      next: (newTask: Task) => {
        this.tasks.push(newTask);
        this.organizeTasksIntoColumns();
        this.closeAddTaskModal();
      },
      error: (error: any) => {
        console.error('Error creating task:', error);
      }
    });
  }

  closeAddTaskModal(): void {
    this.showAddTaskModal = false;
    this.selectedColumn = '';
    this.resetNewTaskForm();
  }

  // Utility methods
  get totalTasks(): number {
    return this.tasks.length;
  }

  getCompletedTasks(): number {
    return this.tasks.filter(task => task.completed).length;
  }

  getColumnTitle(columnId: string): string {
    const column = this.columns.find(col => col.id === columnId);
    return column?.title || '';
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  isOverdue(dueDate: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    return taskDueDate < today;
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.icon || '📦';
  }

  getTagColor(tag: string): string {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)'
    ];
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }
}