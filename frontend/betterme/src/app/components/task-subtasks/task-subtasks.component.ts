import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, DependencyInfo } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-subtasks',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="subtasks-container">
      @if (task.subtasks && task.subtasks.length > 0) {
        <div class="subtasks-header">
          <button 
            class="toggle-btn" 
            (click)="expanded = !expanded"
            [attr.aria-expanded]="expanded"
          >
            <span class="toggle-icon" [class.expanded]="expanded">▶</span>
            <span class="subtasks-count">
              {{ task.completedSubtaskCount || 0 }} of {{ task.subtaskCount || task.subtasks.length }} completed
            </span>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                [style.width.%]="getSubtaskProgress()"
              ></div>
            </div>
          </button>
        </div>

        @if (expanded) {
          <div class="subtasks-list">
            @for (subtask of task.subtasks; track subtask.id) {
              <div 
                class="subtask-item" 
                [class.completed]="subtask.completed"
                [class.has-dependencies]="subtask.dependencies && subtask.dependencies.length > 0"
              >
                <div class="subtask-content">
                  <input 
                    type="checkbox" 
                    [checked]="subtask.completed"
                    [disabled]="!subtask.canBeCompleted"
                    (change)="toggleSubtask(subtask)"
                    class="subtask-checkbox"
                  />
                  <span class="subtask-title" [class.completed]="subtask.completed">
                    {{ subtask.title }}
                  </span>
                  @if (subtask.dependencies && subtask.dependencies.length > 0) {
                    <span class="dependency-indicator" title="Has dependencies">
                      🔗
                    </span>
                  }
                  @if (!subtask.canBeCompleted && subtask.blockingReasons && subtask.blockingReasons.length > 0) {
                    <span class="blocked-indicator" [title]="subtask.blockingReasons.join(', ')">
                      ⚠️ Blocked
                    </span>
                  }
                </div>
                @if (subtask.subtasks && subtask.subtasks.length > 0) {
                  <app-task-subtasks 
                    [task]="subtask"
                    (taskUpdated)="onSubtaskUpdated($event)"
                  ></app-task-subtasks>
                }
              </div>
            }
          </div>
        }
      }

      @if (task.dependencies && task.dependencies.length > 0) {
        <div class="dependencies-section">
          <div class="dependencies-header">
            <span class="dependencies-icon">🔗</span>
            <span class="dependencies-label">Depends on:</span>
          </div>
          <div class="dependencies-list">
            @for (dep of task.dependencies; track dep.taskId) {
              <div 
                class="dependency-item"
                [class.completed]="dep.isCompleted"
                (click)="navigateToTask(dep.taskId)"
              >
                <span class="dependency-status" [class.completed]="dep.isCompleted">
                  {{ dep.isCompleted ? '✓' : '○' }}
                </span>
                <span class="dependency-title">{{ dep.taskTitle }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .subtasks-container {
      margin-top: 0.5rem;
      margin-left: 1.5rem;
      border-left: 2px solid rgba(102, 126, 234, 0.3);
      padding-left: 1rem;
    }

    .subtasks-header {
      margin-bottom: 0.5rem;
    }

    .toggle-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      width: 100%;
      font-size: 0.85rem;
      transition: color 0.2s;
    }

    .toggle-btn:hover {
      color: rgba(255, 255, 255, 0.9);
    }

    .toggle-icon {
      font-size: 0.7rem;
      transition: transform 0.2s;
      display: inline-block;
    }

    .toggle-icon.expanded {
      transform: rotate(90deg);
    }

    .subtasks-count {
      flex: 1;
      text-align: left;
    }

    .progress-bar {
      width: 100px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .subtasks-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .subtask-item {
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s;
    }

    .subtask-item:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .subtask-item.has-dependencies {
      border-left: 3px solid #f59e0b;
    }

    .subtask-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .subtask-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #667eea;
    }

    .subtask-title {
      flex: 1;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
    }

    .subtask-title.completed {
      text-decoration: line-through;
      color: rgba(255, 255, 255, 0.5);
    }

    .dependency-indicator,
    .blocked-indicator {
      font-size: 0.85rem;
      cursor: help;
    }

    .blocked-indicator {
      color: #f59e0b;
    }

    .dependencies-section {
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 6px;
      border: 1px solid rgba(102, 126, 234, 0.3);
    }

    .dependencies-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .dependencies-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .dependency-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.85rem;
    }

    .dependency-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .dependency-item.completed {
      opacity: 0.6;
    }

    .dependency-status {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      font-size: 0.7rem;
    }

    .dependency-status.completed {
      background: rgba(74, 222, 128, 0.2);
      color: #4ade80;
    }

    .dependency-title {
      flex: 1;
      color: rgba(255, 255, 255, 0.9);
    }
  `]
})
export class TaskSubtasksComponent {
  @Input() task!: Task;
  @Output() taskUpdated = new EventEmitter<Task>();

  private taskService = inject(TaskService);
  expanded = true;

  getSubtaskProgress(): number {
    if (!this.task.subtasks || this.task.subtasks.length === 0) return 0;
    const completed = this.task.completedSubtaskCount || 
      this.task.subtasks.filter(t => t.completed).length;
    const total = this.task.subtaskCount || this.task.subtasks.length;
    return total > 0 ? (completed / total) * 100 : 0;
  }

  async toggleSubtask(subtask: Task) {
    if (!subtask.canBeCompleted && !subtask.completed) {
      alert(`Cannot complete this task. ${subtask.blockingReasons?.join(', ')}`);
      return;
    }

    try {
      const updated = await this.taskService.updateTask(subtask.id, {
        completed: !subtask.completed
      }).toPromise();

      if (updated) {
        subtask.completed = updated.completed;
        subtask.completedAt = updated.completedAt;
        this.taskUpdated.emit(this.task);
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
      if (error instanceof Error && error.message.includes('Cannot complete')) {
        alert(error.message);
      }
    }
  }

  onSubtaskUpdated(updatedTask: Task) {
    // Recalculate parent task progress
    if (this.task.subtasks) {
      this.task.completedSubtaskCount = this.task.subtasks.filter(t => t.completed).length;
    }
    this.taskUpdated.emit(this.task);
  }

  navigateToTask(taskId: number) {
    // Scroll to task or navigate - implement based on your routing
    const element = document.querySelector(`[data-task-id="${taskId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

