export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: number; // 1: Low, 2: Medium, 3: High
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  category?: string;
  tags: string[];
  
  // Smart Organization Features
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  nextOccurrence?: string;
  streakCount: number;
  lastCompletedDate?: string;
  parentTaskId?: number;
  estimatedDuration?: number; // in minutes
  difficulty: TaskDifficulty;
  completionCount?: number; // Track how many times this task has been completed
  
  // Suggested additions
  subtasks?: Subtask[]; // For task breakdown
  attachments?: Attachment[]; // File attachments
  reminders?: Reminder[]; // Pre-due date reminders
  energyLevel?: EnergyLevel; // When user feels most productive for this task
  context?: TaskContext[]; // Where/when this task can be done
}

// Additional types
export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  position: number;
}

export interface Attachment {
  id: number;
  filename: string;
  url: string;
  type: string;
  size: number;
}

export interface Reminder {
  id: number;
  remindAt: string;
  method: 'notification' | 'email';
  sent: boolean;
}

export type EnergyLevel = 'low' | 'medium' | 'high';
export type TaskContext = 'home' | 'work' | 'computer' | 'phone' | 'errands' | 'anywhere';

export type RecurrencePattern = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'yearly'
  | 'custom';

export type TaskDifficulty = 'easy' | 'medium' | 'hard';

// Create/Update interfaces
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: number; // Make optional with default
  dueDate?: string | null;
  category?: string;
  tags?: string[]; // Make optional
  isRecurring?: boolean; // Make optional with default
  recurrencePattern?: RecurrencePattern;
  recurrenceInterval?: number;
  estimatedDuration?: number;
  difficulty?: TaskDifficulty;
  completionCount?: number;
  // Add new optional fields:
  subtasks?: Pick<Subtask, 'title'>[];
  reminders?: Pick<Reminder, 'remindAt' | 'method'>[];
  energyLevel?: EnergyLevel;
  context?: TaskContext[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: number;
  dueDate?: string | null;
  category?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceInterval?: number;
  estimatedDuration?: number;
  difficulty?: TaskDifficulty;
  completionCount?: number;
  // Add new optional fields:
  subtasks?: Subtask[];
  reminders?: Reminder[];
  energyLevel?: EnergyLevel;
  context?: TaskContext[];
  // For partial updates to nested arrays:
  addTags?: string[];
  removeTags?: string[];
}

export interface TaskCategory {
  name: string;
  color: string;
  icon: string;
  description: string;
  defaultTags: string[];
  estimatedDuration?: number;
  priorityWeight: number;
  // Suggested additions:
  defaultPriority?: number;
  defaultDifficulty?: TaskDifficulty;
  commonContexts?: TaskContext[];
}

export interface TagGroup {
  name: string;
  tags: string[];
  color: string;
  description: string;
  // Suggested addition:
  autoSuggest?: boolean; // Whether to auto-suggest these tags
}

export interface RecurrenceTemplate {
  pattern: RecurrencePattern;
  name: string;
  description: string;
  icon: string;
  defaultInterval: number;
}

export interface TaskResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  // Suggested additions:
  filters?: any; // Available filters
  categories?: string[]; // Available categories in results
}

// Additional utility types
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  averageCompletionTime?: number;
  streak: number;
  weeklyCompletion: { date: string; count: number }[];
  byPriority: { priority: number; count: number }[];
  byCategory: { category: string; count: number }[];
  byDifficulty: { difficulty: TaskDifficulty; count: number }[];
}

export interface TaskFilter {
  completed?: boolean;
  priority?: number[];
  category?: string[];
  tags?: string[];
  dueDate?: {
    from?: string;
    to?: string;
  };
  difficulty?: TaskDifficulty[];
  isRecurring?: boolean;
  search?: string;
}

// For drag and drop functionality
export interface TaskReorderRequest {
  taskId: number;
  newPosition: number;
  category?: string;
}

// For bulk operations
export interface BulkTaskUpdate {
  taskIds: number[];
  updates: Partial<UpdateTaskRequest>;
}

// For task templates
export interface TaskTemplate {
  id: number;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  estimatedDuration?: number;
  difficulty: TaskDifficulty;
  priority: number;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceInterval?: number;
  subtasks?: Pick<Subtask, 'title'>[];
}