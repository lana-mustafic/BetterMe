// task.model.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  dueTime?: string; // New: Specific time for reminders
  reminders: string[]; // New: Array of reminder timestamps
  category?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;}

export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate?: string | null;
  priority?: number;
  category?: string;         // NEW: Add category
  tags?: string[];          // NEW: Add tags
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: number;
  completed?: boolean;
  category?: string;         // NEW: Add category
  tags?: string[];          // NEW: Add tags
}

export interface TaskResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
}