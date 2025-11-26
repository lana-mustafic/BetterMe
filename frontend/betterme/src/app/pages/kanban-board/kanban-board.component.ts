// kanban-board.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';
import { Task, UpdateTaskRequest, RecurrencePattern, TaskDifficulty } from '../../models/task.model';
import { FileUploadComponent, Attachment } from '../../components/file-upload/file-upload.component';

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
  imports: [CommonModule, FormsModule, DragDropModule, FileUploadComponent],
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
        <div class="modal-content glass-card modal-content-large" (click)="$event.stopPropagation()">
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
                  <option *ngFor="let category of enhancedCategories" [value]="category.name">
                    {{ category.icon }} {{ category.name }}
                  </option>
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
                  <span *ngFor="let tag of newTaskTags" class="tag-badge">
                    {{ tag }}
                    <button type="button" (click)="removeTag(tag)" class="tag-remove">×</button>
                  </span>
                </div>
              </div>

              <div class="form-row">
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
                  <option *ngFor="let task of availableParentTasks" [value]="task.id">{{ task.title }}</option>
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
                  <ul *ngIf="newTaskSubtasks.length > 0" class="subtasks-list-form">
                    <li *ngFor="let subtask of newTaskSubtasks; let i = index" class="subtask-item-form">
                      <span>{{ subtask }}</span>
                      <button type="button" class="btn-icon-small" (click)="removeSubtaskFromForm(i)">
                        ×
                      </button>
                    </li>
                  </ul>
                  <p *ngIf="newTaskSubtasks.length === 0" class="form-help-text">No subtasks yet. Add subtasks to break down this task into smaller steps.</p>
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
                    <option *ngFor="let task of availableDependencyTasks" [value]="task.id" [disabled]="newTaskDependsOnTaskIds.includes(task.id)">
                      {{ task.title }} {{ task.completed ? '(Completed)' : '(Pending)' }}
                    </option>
                  </select>
                  <div *ngIf="newTaskDependsOnTaskIds.length > 0" class="dependencies-list-form">
                    <label class="form-label-small">This task depends on:</label>
                    <ul class="dependencies-list">
                      <li *ngFor="let depTaskId of newTaskDependsOnTaskIds" class="dependency-item-form">
                        <span *ngIf="getTaskById(depTaskId)" class="dependency-title">{{ getTaskById(depTaskId)!.title }}</span>
                        <span *ngIf="getTaskById(depTaskId)" class="dependency-status" [class.completed]="getTaskById(depTaskId)!.completed">
                          {{ getTaskById(depTaskId)!.completed ? '✓ Completed' : '○ Pending' }}
                        </span>
                        <button type="button" class="btn-icon-small" (click)="removeDependencyFromForm(depTaskId)">
                          ×
                        </button>
                      </li>
                    </ul>
                  </div>
                  <p *ngIf="newTaskDependsOnTaskIds.length === 0" class="form-help-text">No dependencies. This task can be started immediately.</p>
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
              <div *ngIf="newTaskIsRecurring" class="form-row">
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

      <!-- Edit Task Modal -->
      <div *ngIf="showEditTaskModal" class="modal-overlay" (click)="closeEditTaskModal()">
        <div class="modal-content modal-content-large glass-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Edit Task</h3>
            <button class="close-btn" (click)="closeEditTaskModal()">×</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="updateTask()">
              <div class="form-group">
                <input 
                  type="text" 
                  class="form-control"
                  placeholder="Task title"
                  [(ngModel)]="editTaskTitle"
                  name="editTitle"
                  required
                  #editTitleInput
                  autofocus
                />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea 
                  class="form-control"
                  placeholder="Add more details about your task..."
                  [(ngModel)]="editTaskDescription"
                  name="editDescription"
                  rows="4"
                ></textarea>
              </div>
              
              <!-- Enhanced Category Dropdown -->
              <div class="form-group">
                <label class="form-label">Category</label>
                <select 
                  class="form-control"
                  [(ngModel)]="editTaskCategory"
                  name="editCategory"
                >
                  <option value="">Select Category</option>
                  <option *ngFor="let category of enhancedCategories" [value]="category.name">
                    {{ category.icon }} {{ category.name }}
                  </option>
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
                  />
                </div>
                <div class="tag-preview">
                  <span *ngFor="let tag of editTaskTags" class="tag-badge">
                    {{ tag }}
                    <button type="button" (click)="removeEditTag(tag)" class="tag-remove">×</button>
                  </span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Due Date</label>
                  <input 
                    type="date" 
                    class="form-control"
                    [(ngModel)]="editTaskDueDate"
                    name="editDueDate"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select 
                    class="form-control"
                    [(ngModel)]="editTaskPriority"
                    name="editPriority"
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
                    [(ngModel)]="editTaskEstimatedDuration"
                    name="editEstimatedDuration"
                    min="1"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Difficulty</label>
                  <select 
                    class="form-control"
                    [(ngModel)]="editTaskDifficulty"
                    name="editDifficulty"
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
                  [(ngModel)]="editTaskParentTaskId"
                  name="editParentTaskId"
                  (change)="onParentTaskChange()"
                >
                  <option [value]="null">None (Top-level task)</option>
                  <option *ngFor="let task of availableParentTasks" [value]="task.id">{{ task.title }}</option>
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
                    />
                    <button type="button" class="btn btn-secondary btn-sm" (click)="addSubtaskToForm(undefined, true)">
                      Add
                    </button>
                  </div>
                  <ul *ngIf="editTaskSubtasks.length > 0" class="subtasks-list-form">
                    <li *ngFor="let subtask of editTaskSubtasks; let i = index" class="subtask-item-form">
                      <span>{{ subtask }}</span>
                      <button type="button" class="btn-icon-small" (click)="removeSubtaskFromForm(i, true)">
                        ×
                      </button>
                    </li>
                  </ul>
                  <p *ngIf="editTaskSubtasks.length === 0" class="form-help-text">No subtasks yet. Add subtasks to break down this task into smaller steps.</p>
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
                  >
                    <option [value]="null">Select a task this depends on...</option>
                    <option *ngFor="let task of availableDependencyTasks" [value]="task.id" [disabled]="editTaskDependsOnTaskIds.includes(task.id)">
                      {{ task.title }} {{ task.completed ? '(Completed)' : '(Pending)' }}
                    </option>
                  </select>
                  <div *ngIf="editTaskDependsOnTaskIds.length > 0" class="dependencies-list-form">
                    <label class="form-label-small">This task depends on:</label>
                    <ul class="dependencies-list">
                      <li *ngFor="let depTaskId of editTaskDependsOnTaskIds" class="dependency-item-form">
                        <span *ngIf="getTaskById(depTaskId)" class="dependency-title">{{ getTaskById(depTaskId)!.title }}</span>
                        <span *ngIf="getTaskById(depTaskId)" class="dependency-status" [class.completed]="getTaskById(depTaskId)!.completed">
                          {{ getTaskById(depTaskId)!.completed ? '✓ Completed' : '○ Pending' }}
                        </span>
                        <button type="button" class="btn-icon-small" (click)="removeEditDependencyFromForm(depTaskId)">
                          ×
                        </button>
                      </li>
                    </ul>
                  </div>
                  <p *ngIf="editTaskDependsOnTaskIds.length === 0" class="form-help-text">No dependencies. This task can be started immediately.</p>
                </div>
              </div>

              <!-- Recurrence -->
              <div class="form-group">
                <label class="form-label">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="editTaskIsRecurring"
                    name="editIsRecurring"
                  />
                  Make this task recurring
                </label>
              </div>
              <div *ngIf="editTaskIsRecurring" class="form-row">
                <div class="form-group">
                  <label class="form-label">Recurrence Pattern</label>
                  <select 
                    class="form-control"
                    [(ngModel)]="editTaskRecurrencePattern"
                    name="editRecurrencePattern"
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
                    [(ngModel)]="editTaskRecurrenceInterval"
                    name="editRecurrenceInterval"
                    min="1"
                  />
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="!editTaskTitle.trim() || updatingTaskIds.has(editingTask?.id || 0)">
                  {{ updatingTaskIds.has(editingTask?.id || 0) ? 'Updating...' : 'Update Task' }}
                </button>
                <button type="button" class="btn btn-secondary" (click)="closeEditTaskModal()" [disabled]="updatingTaskIds.has(editingTask?.id || 0)">
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

    .modal-content-large {
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
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

    .tag-remove:hover {
      background: rgba(255, 255, 255, 0.2);
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

    .btn-icon-small:hover {
      background: rgba(255, 255, 255, 0.2);
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
  showEditTaskModal = false;
  selectedColumn: string = '';
  
  // New task form
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskDueDate = '';
  newTaskPriority = 2;
  newTaskCategory = '';
  newTaskTagInput = '';
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
  newTaskIsRecurring: boolean = false;
  newTaskRecurrencePattern: string = 'daily';
  newTaskRecurrenceInterval: number = 1;
  newTaskAttachments: any[] = [];
  
  // Edit task form
  editingTask: Task | null = null;
  editTaskTitle = '';
  editTaskDescription = '';
  editTaskDueDate = '';
  editTaskPriority = 2;
  editTaskCategory = '';
  editTaskTagInput = '';
  editTaskTags: string[] = [];
  editTaskAttachments: Attachment[] = [];
  editTaskEstimatedDuration: number | null = null;
  editTaskDifficulty: string = 'medium';
  editTaskSubtasks: string[] = [];
  editSubtaskInput = '';
  editTaskParentTaskId: number | null = null;
  editTaskDependsOnTaskIds: number[] = [];
  selectedEditDependencyTaskId: number | null = null;
  editTaskIsRecurring: boolean = false;
  editTaskRecurrencePattern: string = 'daily';
  editTaskRecurrenceInterval: number = 1;
  
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
    this.editingTask = task;
    this.editTaskTitle = task.title;
    this.editTaskDescription = task.description || '';
    this.editTaskDueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    this.editTaskPriority = task.priority || 2;
    this.editTaskCategory = task.category || '';
    this.editTaskTags = [...(task.tags || [])];
    this.editTaskTagInput = '';
    this.editTaskEstimatedDuration = (task as any).estimatedDuration || null;
    this.editTaskDifficulty = (task as any).difficulty || 'medium';
    this.editTaskSubtasks = task.subtasks?.map(st => st.title) || [];
    this.editSubtaskInput = '';
    this.editTaskParentTaskId = task.parentTaskId || null;
    this.editTaskDependsOnTaskIds = [...(task.dependsOnTaskIds || [])];
    this.selectedEditDependencyTaskId = null;
    this.editTaskIsRecurring = task.isRecurring || false;
    this.editTaskRecurrencePattern = task.recurrencePattern || 'daily';
    this.editTaskRecurrenceInterval = task.recurrenceInterval || 1;
    this.updateAvailableTasks();
    this.showEditTaskModal = true;
  }
  
  updateTask(): void {
    if (!this.editingTask || !this.editTaskTitle.trim()) {
      return;
    }
    
    const priority = typeof this.editTaskPriority === 'string' 
      ? parseInt(this.editTaskPriority, 10) 
      : (this.editTaskPriority || 1);
    
    const updateData: any = {
      title: this.editTaskTitle.trim(),
      description: this.editTaskDescription.trim() || undefined,
      dueDate: this.editTaskDueDate || undefined,
      priority: priority,
      category: this.editTaskCategory || undefined,
      tags: this.editTaskTags,
      estimatedDuration: this.editTaskEstimatedDuration || undefined,
      difficulty: this.editTaskDifficulty as any,
      parentTaskId: this.editTaskParentTaskId || undefined,
      dependsOnTaskIds: this.editTaskDependsOnTaskIds.length > 0 ? this.editTaskDependsOnTaskIds : undefined,
      isRecurring: this.editTaskIsRecurring || false,
      recurrencePattern: this.editTaskRecurrencePattern as any || 'none',
      recurrenceInterval: this.editTaskRecurrenceInterval || 1
    };
    
    this.updatingTaskIds.add(this.editingTask.id);
    
    this.taskService.updateTask(this.editingTask.id, updateData).subscribe({
      next: async () => {
        // Handle subtasks - this is simplified, you might want to update existing ones
        if (this.editTaskSubtasks.length > 0) {
          for (const subtaskTitle of this.editTaskSubtasks) {
            await this.taskService.createTask({ 
              title: subtaskTitle, 
              parentTaskId: this.editingTask!.id 
            } as any).toPromise();
          }
        }
        
        this.loadTasks();
        this.closeEditTaskModal();
      },
      error: (error: any) => {
        console.error('Error updating task:', error);
        alert('Failed to update task. Please try again.');
        this.updatingTaskIds.delete(this.editingTask!.id);
      }
    });
  }
  
  closeEditTaskModal(): void {
    this.showEditTaskModal = false;
    this.editingTask = null;
    this.editTaskTitle = '';
    this.editTaskDescription = '';
    this.editTaskDueDate = '';
    this.editTaskPriority = 2;
    this.editTaskCategory = '';
    this.editTaskTags = [];
    this.editTaskTagInput = '';
    this.editTaskEstimatedDuration = null;
    this.editTaskDifficulty = 'medium';
    this.editTaskSubtasks = [];
    this.editSubtaskInput = '';
    this.editTaskParentTaskId = null;
    this.editTaskDependsOnTaskIds = [];
    this.selectedEditDependencyTaskId = null;
    this.editTaskIsRecurring = false;
    this.editTaskRecurrencePattern = 'daily';
    this.editTaskRecurrenceInterval = 1;
  }
  
  addTaskToColumn(columnId: string): void {
    this.selectedColumn = columnId;
    this.updateAvailableTasks();
    this.showAddTaskModal = true;
    this.resetNewTaskForm();
  }

  resetNewTaskForm(): void {
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
    this.newTaskIsRecurring = false;
    this.newTaskRecurrencePattern = 'daily';
    this.newTaskRecurrenceInterval = 1;
    this.newTaskAttachments = [];
  }
  
  onRecurrenceToggle(): void {
    if (!this.newTaskIsRecurring) {
      this.newTaskRecurrencePattern = 'daily';
      this.newTaskRecurrenceInterval = 1;
    }
  }

  onEditRecurrenceToggle(): void {
    if (!this.editTaskIsRecurring) {
      this.editTaskRecurrencePattern = 'daily';
      this.editTaskRecurrenceInterval = 1;
    }
  }
  
  onParentTaskChange(): void {
    this.updateAvailableTasks();
  }

  onEditParentTaskChange(): void {
    this.updateAvailableTasks();
  }
  
  onAttachmentsChange(attachments: Attachment[]): void {
    this.newTaskAttachments = attachments;
  }

  onEditAttachmentsChange(attachments: Attachment[]): void {
    this.editTaskAttachments = attachments;
  }
  
  // Tag helpers
  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  onEditTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addEditTag();
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
      if (this.editingTask && this.selectedEditDependencyTaskId === this.editingTask.id) {
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
      (!this.editingTask || t.id !== this.editingTask.id)
    );
    
    this.availableDependencyTasks = this.tasks.filter(t => 
      (!this.editingTask || t.id !== this.editingTask.id)
    );
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

  createTask(): void {
    if (!this.newTaskTitle.trim()) return;

    const priority = typeof this.newTaskPriority === 'string' 
      ? parseInt(this.newTaskPriority, 10) 
      : (this.newTaskPriority || 1);

    const taskData: any = {
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription || undefined,
      dueDate: this.newTaskDueDate || undefined,
      priority: priority,
      category: this.newTaskCategory || 'Other',
      tags: [...(this.selectedColumn === 'in-progress' ? ['in-progress'] : []), ...this.newTaskTags],
      parentTaskId: this.newTaskParentTaskId || undefined,
      dependsOnTaskIds: this.newTaskDependsOnTaskIds.length > 0 ? this.newTaskDependsOnTaskIds : undefined,
      isRecurring: this.newTaskIsRecurring || false,
      recurrencePattern: this.newTaskRecurrencePattern as any || 'none',
      recurrenceInterval: this.newTaskRecurrenceInterval || 1
    };

    this.taskService.createTask(taskData).subscribe({
      next: async (newTask: Task) => {
        // Create subtasks if any were added
        if (this.newTaskSubtasks.length > 0) {
          for (const subtaskTitle of this.newTaskSubtasks) {
            await this.taskService.createTask({ 
              title: subtaskTitle, 
              parentTaskId: newTask.id 
            } as any).toPromise();
          }
        }
        
        this.loadTasks(); // Reload to get updated subtasks
        this.organizeTasksIntoColumns();
        this.closeAddTaskModal();
      },
      error: (error: any) => {
        console.error('Error creating task:', error);
        alert('Failed to create task. Please try again.');
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
