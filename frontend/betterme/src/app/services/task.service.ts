import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { 
  Observable, 
  throwError, 
  catchError, 
  tap, 
  map, 
  forkJoin, 
  of,
  switchMap
} from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskCategory, TagGroup, RecurrenceTemplate } from '../models/task.model';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

// Productivity Interfaces
export interface EisenhowerCategory {
  id: 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important';
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface TimeBlock {
  id: number;
  taskId: number;
  startTime: string;
  endTime: string;
  date: string;
  duration: number;
  completed: boolean;
  title?: string;
}

export interface ProductivitySettings {
  enableEatTheFrog: boolean;
  defaultTimeBlockDuration: number;
  reminderNotifications: boolean;
  reminderTime: number;
  workingHours: {
    start: string;
    end: string;
  };
}

export interface TaskWithEisenhower extends Task {
  eisenhowerCategory?: EisenhowerCategory;
  importanceScore?: number;
}

interface ApiError {
  message: string;
  code: string;
  originalError: HttpErrorResponse;
}

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

interface TaskFilters {
  category?: string;
  priority?: number;
  status?: 'all' | 'active' | 'completed';
  tags?: string[];
  search?: string;
  dueDate?: 'today' | 'week' | 'overdue' | 'future';
  context?: string;
  energyLevel?: 'low' | 'medium' | 'high';
  timeRequired?: 'quick' | 'medium' | 'long';
  eisenhowerCategory?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  // Productivity Features Storage
  private readonly TIME_BLOCKS_KEY = 'timeBlocks';
  private readonly PRODUCTIVITY_SETTINGS_KEY = 'productivitySettings';

  // Enhanced Eisenhower Matrix
  private eisenhowerMatrix: EisenhowerCategory[] = [
    {
      id: 'urgent-important',
      name: 'Do First',
      description: 'Urgent and important tasks - handle immediately',
      color: '#e74c3c',
      icon: '🚨'
    },
    {
      id: 'urgent-not-important',
      name: 'Schedule',
      description: 'Urgent but not important tasks - plan time for these',
      color: '#f39c12',
      icon: '⏰'
    },
    {
      id: 'not-urgent-important',
      name: 'Delegate',
      description: 'Not urgent but important tasks - consider delegating',
      color: '#3498db',
      icon: '👥'
    },
    {
      id: 'not-urgent-not-important',
      name: 'Eliminate',
      description: 'Not urgent and not important tasks - eliminate or postpone',
      color: '#95a5a6',
      icon: '🗑️'
    }
  ];

  // Default productivity settings
  private defaultProductivitySettings: ProductivitySettings = {
    enableEatTheFrog: true,
    defaultTimeBlockDuration: 60,
    reminderNotifications: true,
    reminderTime: 30,
    workingHours: {
      start: '09:00',
      end: '17:00'
    }
  };

  // Smart features data
  private smartCategories: TaskCategory[] = [
    {
      name: 'Personal',
      color: '#667eea',
      icon: '🏠',
      description: 'Personal life and home tasks',
      defaultTags: ['home', 'personal', 'family'],
      estimatedDuration: 60,
      priorityWeight: 2,
      defaultPriority: 2,
      defaultDifficulty: 'medium',
      commonContexts: ['home', 'anywhere']
    },
    {
      name: 'Work',
      color: '#764ba2',
      icon: '💼',
      description: 'Professional and career tasks',
      defaultTags: ['work', 'career', 'professional'],
      estimatedDuration: 120,
      priorityWeight: 3,
      defaultPriority: 3,
      defaultDifficulty: 'medium',
      commonContexts: ['work', 'computer']
    },
    {
      name: 'Shopping',
      color: '#f093fb',
      icon: '🛒',
      description: 'Shopping and errands',
      defaultTags: ['shopping', 'errands', 'store'],
      estimatedDuration: 45,
      priorityWeight: 1,
      defaultPriority: 1,
      defaultDifficulty: 'easy',
      commonContexts: ['errands', 'anywhere']
    },
    {
      name: 'Health',
      color: '#4facfe',
      icon: '🏥',
      description: 'Health and fitness tasks',
      defaultTags: ['health', 'fitness', 'wellness'],
      estimatedDuration: 60,
      priorityWeight: 3,
      defaultPriority: 2,
      defaultDifficulty: 'medium',
      commonContexts: ['home', 'anywhere']
    },
    {
      name: 'Education',
      color: '#43e97b',
      icon: '🎓',
      description: 'Learning and educational tasks',
      defaultTags: ['learning', 'education', 'study'],
      estimatedDuration: 90,
      priorityWeight: 2,
      defaultPriority: 2,
      defaultDifficulty: 'medium',
      commonContexts: ['computer', 'home']
    },
    {
      name: 'Finance',
      color: '#fa709a',
      icon: '💰',
      description: 'Financial and money tasks',
      defaultTags: ['finance', 'money', 'bills'],
      estimatedDuration: 30,
      priorityWeight: 2,
      defaultPriority: 2,
      defaultDifficulty: 'medium',
      commonContexts: ['computer', 'phone']
    }
  ];

  private tagGroups: TagGroup[] = [
    {
      name: 'Energy Level',
      tags: ['high-energy', 'low-energy', 'medium-energy'],
      color: '#ff6b6b',
      description: 'Energy requirements for the task',
      autoSuggest: true
    },
    {
      name: 'Time Required',
      tags: ['quick', 'time-consuming', 'medium-time'],
      color: '#4ecdc4',
      description: 'Estimated time to complete',
      autoSuggest: true
    },
    {
      name: 'Context',
      tags: ['home', 'work', 'computer', 'phone', 'errands'],
      color: '#45b7d1',
      description: 'Where/when the task can be done',
      autoSuggest: true
    },
    {
      name: 'Priority',
      tags: ['urgent', 'important', 'delegatable'],
      color: '#96ceb4',
      description: 'Task priority indicators',
      autoSuggest: false
    }
  ];

  private recurrenceTemplates: RecurrenceTemplate[] = [
    {
      pattern: 'daily',
      name: 'Daily',
      description: 'Repeat every day',
      icon: '📅',
      defaultInterval: 1
    },
    {
      pattern: 'weekly',
      name: 'Weekly',
      description: 'Repeat every week',
      icon: '🗓️',
      defaultInterval: 1
    },
    {
      pattern: 'monthly',
      name: 'Monthly',
      description: 'Repeat every month',
      icon: '📆',
      defaultInterval: 1
    },
    {
      pattern: 'yearly',
      name: 'Yearly',
      description: 'Repeat every year',
      icon: '🎉',
      defaultInterval: 1
    }
  ];

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {});
  }

  // PRODUCTIVITY FEATURES METHODS

  // Eisenhower Matrix Methods
  getEisenhowerMatrix(): EisenhowerCategory[] {
    return [...this.eisenhowerMatrix];
  }

  categorizeTaskByEisenhower(task: Task): EisenhowerCategory {
    const isUrgent = task.priority === 3 || this.isTaskDueSoon(task);
    const isImportant = task.priority >= 2;
    
    if (isUrgent && isImportant) {
      return this.eisenhowerMatrix.find(c => c.id === 'urgent-important')!;
    } else if (isUrgent && !isImportant) {
      return this.eisenhowerMatrix.find(c => c.id === 'urgent-not-important')!;
    } else if (!isUrgent && isImportant) {
      return this.eisenhowerMatrix.find(c => c.id === 'not-urgent-important')!;
    } else {
      return this.eisenhowerMatrix.find(c => c.id === 'not-urgent-not-important')!;
    }
  }

  calculateTaskImportanceScore(task: Task): number {
    let score = 0;
    
    // Priority weight (3x for high priority)
    score += task.priority * 3;
    
    // Due date urgency
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 0) {
        score += 10; // Overdue
      } else if (daysUntilDue <= 1) {
        score += 8; // Due tomorrow
      } else if (daysUntilDue <= 3) {
        score += 5; // Due in 3 days
      } else if (daysUntilDue <= 7) {
        score += 2; // Due in a week
      }
    }
    
    // Eisenhower category weight
    const eisenhowerCategory = this.categorizeTaskByEisenhower(task);
    if (eisenhowerCategory.id === 'urgent-important') {
      score += 6;
    } else if (eisenhowerCategory.id === 'urgent-not-important') {
      score += 4;
    } else if (eisenhowerCategory.id === 'not-urgent-important') {
      score += 3;
    }
    
    return score;
  }

  getMostImportantTask(tasks: Task[]): Task | null {
    if (tasks.length === 0) return null;

    const pendingTasks = tasks.filter(task => !task.completed);
    if (pendingTasks.length === 0) return null;

    return pendingTasks.reduce((mostImportant, task) => {
      if (!mostImportant) return task;
      
      const currentScore = this.calculateTaskImportanceScore(task);
      const mostImportantScore = this.calculateTaskImportanceScore(mostImportant);
      
      return currentScore > mostImportantScore ? task : mostImportant;
    }, pendingTasks[0]);
  }

  // Time Blocking Methods
  getTimeBlocks(): TimeBlock[] {
    const saved = localStorage.getItem(this.TIME_BLOCKS_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  saveTimeBlock(timeBlock: TimeBlock): void {
    const timeBlocks = this.getTimeBlocks();
    const existingIndex = timeBlocks.findIndex(tb => tb.id === timeBlock.id);
    
    if (existingIndex >= 0) {
      timeBlocks[existingIndex] = timeBlock;
    } else {
      timeBlocks.push(timeBlock);
    }
    
    localStorage.setItem(this.TIME_BLOCKS_KEY, JSON.stringify(timeBlocks));
  }

  deleteTimeBlock(blockId: number): void {
    const timeBlocks = this.getTimeBlocks().filter(tb => tb.id !== blockId);
    localStorage.setItem(this.TIME_BLOCKS_KEY, JSON.stringify(timeBlocks));
  }

  getTimeBlocksForDate(date: Date): TimeBlock[] {
    const targetDate = new Date(date).toISOString().split('T')[0];
    return this.getTimeBlocks().filter(block => block.date === targetDate);
  }

  // Productivity Settings
  getProductivitySettings(): ProductivitySettings {
    const saved = localStorage.getItem(this.PRODUCTIVITY_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { ...this.defaultProductivitySettings };
  }

  saveProductivitySettings(settings: ProductivitySettings): void {
    localStorage.setItem(this.PRODUCTIVITY_SETTINGS_KEY, JSON.stringify(settings));
  }

  // Smart Task Suggestions
  suggestOptimalSchedule(tasks: Task[]): { task: Task, suggestedTime: Date }[] {
    const pendingTasks = tasks.filter(task => !task.completed);
    const sortedTasks = pendingTasks.sort((a, b) => {
      const scoreA = this.calculateTaskImportanceScore(a);
      const scoreB = this.calculateTaskImportanceScore(b);
      return scoreB - scoreA;
    });

    const suggestions: { task: Task, suggestedTime: Date }[] = [];
    const now = new Date();
    let currentTime = new Date(now);
    
    // Set to next working hour
    const settings = this.getProductivitySettings();
    const [startHour] = settings.workingHours.start.split(':').map(Number);
    currentTime.setHours(startHour, 0, 0, 0);
    
    if (currentTime < now) {
      currentTime.setDate(currentTime.getDate() + 1);
    }

    sortedTasks.forEach((task, index) => {
      const suggestedTime = new Date(currentTime);
      suggestedTime.setHours(currentTime.getHours() + index); // Space tasks by 1 hour
      suggestions.push({ task, suggestedTime });
    });

    return suggestions;
  }

  // Deadline Reminders
  getUpcomingDeadlines(tasks: Task[]): Task[] {
    const now = new Date();
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(now.getDate() + 2);
    
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= twoDaysFromNow;
    });
  }

  // Enhanced Task Filters
  getTasksWithEisenhower(filters?: TaskFilters): Observable<TaskWithEisenhower[]> {
    return this.getTasks(filters).pipe(
      map(tasks => tasks.map(task => ({
        ...task,
        eisenhowerCategory: this.categorizeTaskByEisenhower(task),
        importanceScore: this.calculateTaskImportanceScore(task)
      })))
    );
  }

  getTasksByEisenhowerCategory(categoryId: string, tasks: Task[]): Task[] {
    return tasks.filter(task => {
      const eisenhowerCategory = this.categorizeTaskByEisenhower(task);
      return eisenhowerCategory.id === categoryId;
    });
  }

  // Core CRUD Operations
  getTasks(filters?: TaskFilters): Observable<Task[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.priority) params = params.set('priority', filters.priority.toString());
      if (filters.status && filters.status !== 'all') params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.dueDate) params = params.set('dueDate', filters.dueDate);
      if (filters.context) params = params.set('context', filters.context);
      if (filters.energyLevel) params = params.set('energyLevel', filters.energyLevel);
      if (filters.timeRequired) params = params.set('timeRequired', filters.timeRequired);
      if (filters.eisenhowerCategory) params = params.set('eisenhowerCategory', filters.eisenhowerCategory);
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params = params.append('tags', tag));
      }
    }

    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, {
      headers: this.authHeaders(),
      params
    }).pipe(
      catchError(err => this.handleError('getTasks', err))
    );
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(err => this.handleError('getTaskById', err))
    );
  }

  createTask(taskData: CreateTaskRequest): Observable<Task> {
    const enhancedData = this.applySmartDefaults(taskData);
    
    return this.http.post<Task>(`${this.apiUrl}/tasks`, enhancedData, {
      headers: this.authHeaders()
    }).pipe(
      tap(task => console.log('✅ Task created with smart features:', task)),
      catchError(err => this.handleError('createTask', err))
    );
  }

  updateTask(id: number, taskData: UpdateTaskRequest): Observable<Task> {
    const enhancedData = this.cleanUpdateData(taskData);
    
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, enhancedData, {
      headers: this.authHeaders()
    }).pipe(
      tap(task => console.log('✅ Task updated:', task)),
      catchError(err => this.handleError('updateTask', err))
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`, {
      headers: this.authHeaders()
    }).pipe(
      tap(() => console.log('🗑️ Task deleted:', id)),
      catchError(err => this.handleError('deleteTask', err))
    );
  }

  toggleTaskCompletion(id: number): Observable<Task> {
    return this.getTaskById(id).pipe(
      switchMap((task: Task) => {
        const updates: UpdateTaskRequest = { 
          completed: !task.completed 
        };
        
        return this.updateTask(id, updates);
      }),
      catchError(err => this.handleError('toggleTaskCompletion', err))
    );
  }

  // Bulk Operations
  bulkAddTag(taskIds: number[], tag: string): Observable<Task[]> {
    const operations = taskIds.map(taskId => 
      this.getTaskById(taskId).pipe(
        switchMap((task: Task) => {
          const updatedTags = [...new Set([...task.tags, tag])];
          return this.updateTask(taskId, { tags: updatedTags });
        }),
        catchError(err => {
          console.error(`Failed to update task ${taskId}:`, err);
          return of(null);
        })
      )
    );

    return forkJoin(operations).pipe(
      map(results => results.filter(task => task !== null) as Task[])
    );
  }

  bulkDeleteTasks(taskIds: number[]): Observable<BulkOperationResult> {
    const operations = taskIds.map(taskId => 
      this.deleteTask(taskId).pipe(
        map(() => ({ success: true, id: taskId })),
        catchError(err => of({ success: false, id: taskId, error: err.message }))
      )
    );

    return forkJoin(operations).pipe(
      map(results => {
        const success = results.filter((r: any) => r.success).length;
        const failed = results.filter((r: any) => !r.success).length;
        const errors = results.filter((r: any) => !r.success).map((r: any) => `Task ${r.id}: ${r.error}`);
        
        return { success, failed, errors };
      })
    );
  }

  bulkUpdateStatus(taskIds: number[], completed: boolean): Observable<Task[]> {
    const operations = taskIds.map(taskId => 
      this.updateTask(taskId, { completed })
    );

    return forkJoin(operations);
  }

  // Task Organization
  organizeTasksByContext(tasks: Task[]): { context: string; tasks: Task[] }[] {
    const contexts = new Map<string, Task[]>();
    
    const commonContexts = ['home', 'work', 'computer', 'phone', 'errands', 'anywhere'];
    commonContexts.forEach(context => {
      contexts.set(context, []);
    });
    
    tasks.forEach(task => {
      if (task.context && task.context.length > 0) {
        task.context.forEach((contextItem: string) => {
          if (contextItem && contextItem.trim() !== '') {
            if (contexts.has(contextItem)) {
              contexts.get(contextItem)!.push(task);
            } else {
              contexts.set(contextItem, [task]);
            }
          }
        });
      } else {
        contexts.get('anywhere')!.push(task);
      }
    });
    
    return Array.from(contexts.entries())
      .filter(([_, contextTasks]) => contextTasks.length > 0)
      .map(([context, contextTasks]) => ({ context, tasks: contextTasks }));
  }

  // Recurring Tasks
  completeRecurringInstance(taskId: number, completionDate: string): Observable<Task> {
    return this.http.post<Task>(
      `${this.apiUrl}/tasks/${taskId}/complete-instance`, 
      { completionDate }, 
      { headers: this.authHeaders() }
    ).pipe(
      catchError(err => this.handleError('completeRecurringInstance', err))
    );
  }

  getHabitStreak(taskId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/tasks/${taskId}/streak`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(err => this.handleError('getHabitStreak', err))
    );
  }

  generateRecurringInstances(): Observable<Task[]> {
    return this.http.post<Task[]>(
      `${this.apiUrl}/tasks/generate-recurring`, 
      {}, 
      { headers: this.authHeaders() }
    ).pipe(
      catchError(err => this.handleError('generateRecurringInstances', err))
    );
  }

  // Getters for smart data
  getSmartCategories(): TaskCategory[] {
    return [...this.smartCategories];
  }

  getTagGroups(): TagGroup[] {
    return [...this.tagGroups];
  }

  getRecurrenceTemplates(): RecurrenceTemplate[] {
    return [...this.recurrenceTemplates];
  }

  // Smart Features
  suggestCategory(taskData: { title: string; description?: string }): TaskCategory | null {
    const text = `${taskData.title} ${taskData.description || ''}`.toLowerCase();
    
    for (const category of this.smartCategories) {
      const keywords = [
        ...category.defaultTags,
        category.name.toLowerCase(),
        ...(category.description?.toLowerCase().split(' ') || [])
      ];
      
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return null;
  }

  suggestTags(taskData: { title: string; description?: string; category?: string }): string[] {
    const suggestions: string[] = [];
    const text = `${taskData.title} ${taskData.description || ''}`.toLowerCase();
    
    // Suggest based on content analysis
    if (text.includes('urgent') || text.includes('asap')) suggestions.push('urgent');
    if (text.includes('quick') || text.includes('fast')) suggestions.push('quick');
    if (text.includes('important')) suggestions.push('important');
    
    // Suggest based on category
    if (taskData.category) {
      const category = this.smartCategories.find(c => c.name === taskData.category);
      if (category) {
        suggestions.push(...category.defaultTags.slice(0, 2));
      }
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  }

  suggestDueDate(priority: number, category?: string): string {
    const today = new Date();
    let daysToAdd = 7; // Default: 1 week
    
    if (priority === 3) daysToAdd = 1; // High priority: tomorrow
    else if (priority === 2) daysToAdd = 3; // Medium priority: 3 days
    else if (priority === 1) daysToAdd = 14; // Low priority: 2 weeks
    
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
  }

  // Private helper methods
  private applySmartDefaults(taskData: CreateTaskRequest): CreateTaskRequest {
    const category = taskData.category ? 
      this.smartCategories.find(c => c.name === taskData.category) : null;
    
    return {
      ...taskData,
      tags: taskData.tags || [],
      difficulty: taskData.difficulty || category?.defaultDifficulty || 'medium',
      estimatedDuration: taskData.estimatedDuration || category?.estimatedDuration || 30,
      recurrencePattern: taskData.recurrencePattern || 'none',
      recurrenceInterval: taskData.recurrenceInterval || 1,
      isRecurring: taskData.isRecurring || false,
      priority: taskData.priority || category?.defaultPriority || 2,
    };
  }

  private cleanUpdateData(taskData: UpdateTaskRequest): UpdateTaskRequest {
    const cleaned = { ...taskData };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key as keyof UpdateTaskRequest] === undefined) {
        delete cleaned[key as keyof UpdateTaskRequest];
      }
    });
    return cleaned;
  }

  private isTaskDueSoon(task: Task): boolean {
    if (!task.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 2;
  }

  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    console.error(`❌ TaskService.${operation} failed:`, error);

    let message = 'An unexpected error occurred. Please try again.';
    let code = 'UNKNOWN_ERROR';

    if (error.status === 0) {
      message = 'Unable to connect to the server. Please check your internet connection.';
      code = 'NETWORK_ERROR';
    } else if (error.status === 401) {
      message = 'Your session has expired. Please log in again.';
      code = 'UNAUTHORIZED';
    } else if (error.status === 403) {
      message = 'You do not have permission to perform this action.';
      code = 'FORBIDDEN';
    } else if (error.status === 404) {
      message = 'The requested task was not found.';
      code = 'NOT_FOUND';
    } else if (error.status === 409) {
      message = 'This task conflicts with an existing task.';
      code = 'CONFLICT';
    } else if (error.status >= 500) {
      message = 'Server is temporarily unavailable. Please try again later.';
      code = 'SERVER_ERROR';
    }

    // Include validation errors if available
    if (error.error?.errors) {
      const validationErrors = Object.values(error.error.errors).flat() as string[];
      message = validationErrors.join(', ');
      code = 'VALIDATION_ERROR';
    } else if (error.error?.message) {
      message = error.error.message;
    }

    return throwError(() => ({ 
      message, 
      code, 
      originalError: error 
    } as ApiError));
  }
}