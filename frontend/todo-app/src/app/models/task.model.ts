// task.model.ts
export interface Task {
  id: number;
  ownerId: number;
  title: string;
  description: string;
  dueDate?: string | null;
  priority: number;
  completed: boolean;
  createdAt: string;
  updatedAt?: string | null;
  completedAt?: string | null;
  category: string;           // NEW: Add category
  tags: string[];            // NEW: Add tags
}

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