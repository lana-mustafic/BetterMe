import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, ParseTaskResponse } from '../../services/task.service';
import { CreateTaskRequest, Task } from '../../models/task.model';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-quick-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quick-add-container">
      <div class="quick-add-input-wrapper">
        <input
          type="text"
          class="quick-add-input"
          [(ngModel)]="inputText"
          (input)="onInputChange()"
          (keydown.enter)="onEnterKey()"
          (keydown.escape)="clearInput()"
          placeholder="Quick add task... (e.g., 'Call mom tomorrow at 3pm high priority')"
          [disabled]="isProcessing"
        />
        @if (isProcessing) {
          <div class="loading-spinner"></div>
        }
        @if (suggestions.length > 0 && showSuggestions) {
          <div class="suggestions-dropdown">
            <div class="suggestion-header">Suggestions:</div>
            @for (suggestion of suggestions; track suggestion) {
              <div class="suggestion-item" (click)="applySuggestion(suggestion)">
                {{ suggestion }}
              </div>
            }
          </div>
        }
      </div>
      
      @if (parsedData && showPreview) {
        <div class="preview-card glass-card">
          <div class="preview-header">
            <strong>Preview:</strong>
            <button class="close-preview" (click)="hidePreview()">×</button>
          </div>
          <div class="preview-content">
            <div class="preview-item">
              <span class="preview-label">Title:</span>
              <span class="preview-value">{{ parsedData.title || '(empty)' }}</span>
            </div>
            @if (parsedData.dueDate) {
              <div class="preview-item">
                <span class="preview-label">Due Date:</span>
                <span class="preview-value">{{ formatDate(parsedData.dueDate) }}</span>
              </div>
            }
            @if (parsedData.priority !== 1) {
              <div class="preview-item">
                <span class="preview-label">Priority:</span>
                <span class="preview-value priority-{{ parsedData.priority }}">{{ getPriorityText(parsedData.priority) }}</span>
              </div>
            }
            @if (parsedData.category && parsedData.category !== 'Other') {
              <div class="preview-item">
                <span class="preview-label">Category:</span>
                <span class="preview-value">{{ parsedData.category }}</span>
              </div>
            }
            @if (parsedData.tags && parsedData.tags.length > 0) {
              <div class="preview-item">
                <span class="preview-label">Tags:</span>
                <span class="preview-value">{{ parsedData.tags.join(', ') }}</span>
              </div>
            }
          </div>
          <div class="preview-actions">
            <button class="btn btn-outline" (click)="clearInput()">Cancel</button>
            <button class="btn btn-gradient" (click)="createTask()" [disabled]="!parsedData.title || isCreating">
              @if (isCreating) {
                Creating...
              } @else {
                Create Task
              }
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .quick-add-container {
      margin-bottom: 1.5rem;
    }

    .quick-add-input-wrapper {
      position: relative;
    }

    .quick-add-input {
      width: 100%;
      padding: 1rem 1.25rem;
      font-size: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      color: white;
      transition: all 0.3s ease;
      outline: none;
    }

    .quick-add-input:focus {
      border-color: rgba(99, 102, 241, 0.6);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .quick-add-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .quick-add-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-spinner {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: translateY(-50%) rotate(360deg); }
    }

    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 0.5rem;
      background: rgba(30, 30, 40, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .suggestion-header {
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 600;
    }

    .suggestion-item {
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.2s;
      color: white;
    }

    .suggestion-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .preview-card {
      margin-top: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .preview-header strong {
      color: white;
      font-size: 1.1rem;
    }

    .close-preview {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .close-preview:hover {
      color: white;
    }

    .preview-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .preview-item {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .preview-label {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      min-width: 80px;
    }

    .preview-value {
      color: white;
      flex: 1;
    }

    .preview-value.priority-2 {
      color: #fbbf24;
    }

    .preview-value.priority-3 {
      color: #f87171;
    }

    .preview-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-size: 0.9rem;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-outline {
      background: transparent;
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
    }

    .btn-outline:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }

    .btn-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-gradient:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  `]
})
export class QuickAddTaskComponent {
  @Output() taskCreated = new EventEmitter<Task>();

  private taskService = inject(TaskService);

  inputText = '';
  parsedData: ParseTaskResponse | null = null;
  isProcessing = false;
  isCreating = false;
  showPreview = false;
  showSuggestions = false;
  suggestions: string[] = [];

  private readonly commonSuggestions = [
    'Call mom tomorrow at 3pm high priority',
    'Buy groceries next week',
    'Finish project report urgent',
    'Exercise today',
    'Schedule dentist appointment',
    'Review budget this weekend'
  ];

  onInputChange() {
    if (!this.inputText.trim()) {
      this.parsedData = null;
      this.showPreview = false;
      this.showSuggestions = false;
      return;
    }

    // Show suggestions if input is short
    if (this.inputText.length < 10) {
      this.updateSuggestions();
      this.showSuggestions = true;
    } else {
      this.showSuggestions = false;
      this.parseInput();
    }
  }

  private updateSuggestions() {
    const lowerInput = this.inputText.toLowerCase();
    this.suggestions = this.commonSuggestions
      .filter(s => s.toLowerCase().includes(lowerInput))
      .slice(0, 5);
  }

  private parseInput() {
    if (!this.inputText.trim()) return;

    this.isProcessing = true;
    this.taskService.parseNaturalLanguage(this.inputText).pipe(
      catchError(error => {
        console.error('Error parsing input:', error);
        this.isProcessing = false;
        return of(null);
      })
    ).subscribe(response => {
      this.isProcessing = false;
      if (response) {
        this.parsedData = response;
        this.showPreview = true;
      }
    });
  }

  onEnterKey() {
    if (this.parsedData && this.parsedData.title) {
      this.createTask();
    } else if (this.inputText.trim()) {
      this.parseInput();
    }
  }

  applySuggestion(suggestion: string) {
    this.inputText = suggestion;
    this.showSuggestions = false;
    this.parseInput();
  }

  createTask() {
    if (!this.parsedData || !this.parsedData.title) return;

    this.isCreating = true;
    const taskData: CreateTaskRequest = {
      title: this.parsedData.title,
      description: this.parsedData.description,
      dueDate: this.parsedData.dueDate ? new Date(this.parsedData.dueDate).toISOString() : undefined,
      priority: this.parsedData.priority,
      category: this.parsedData.category || 'Other',
      tags: this.parsedData.tags || []
    };

    this.taskService.createTask(taskData).subscribe({
      next: (task) => {
        this.taskCreated.emit(task);
        this.clearInput();
      },
      error: (error) => {
        console.error('Error creating task:', error);
        this.isCreating = false;
      }
    });
  }

  clearInput() {
    this.inputText = '';
    this.parsedData = null;
    this.showPreview = false;
    this.showSuggestions = false;
    this.isProcessing = false;
    this.isCreating = false;
  }

  hidePreview() {
    this.showPreview = false;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (taskDate.getTime() === today.getTime()) {
      return 'Today' + (date.getHours() || date.getMinutes() ? ` at ${this.formatTime(date)}` : '');
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow' + (date.getHours() || date.getMinutes() ? ` at ${this.formatTime(date)}` : '');
    } else {
      return date.toLocaleDateString() + (date.getHours() || date.getMinutes() ? ` at ${this.formatTime(date)}` : '');
    }
  }

  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  getPriorityText(priority: number): string {
    switch (priority) {
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'Low';
    }
  }
}

