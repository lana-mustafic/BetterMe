
  // Basic task fields
export interface Task {
  id: number; // Change from number to string if needed
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  priority: number; // Ensure this is number, not string
  createdAt: string; 
  updatedAt?: string; 
  dueDate?: string;
  category?: string; 
  tags?: string[];
  isRecurring: boolean;
  recurrencePattern?: string; // Add this
  recurrenceInterval?: number; // Add this
  completedInstances?: string[]; // Add this as string array
  nextDueDate?: string;
  originalTaskId?: number; // CHANGED: from string to number

  // REMOVED: Old nested recurrence structure
  // recurrence?: { ... } // DELETE THIS
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate?: string | null;
  priority: number; // CHANGED: from optional to required, number instead of string
  category?: string;
  tags?: string[];
  
  // NEW: Recurrence fields for creation
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: string | null;

  // REMOVED: Old nested recurrence
  // recurrence?: { ... } // DELETE THIS
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: number; // CHANGED: number instead of string
  completed?: boolean;
  category?: string;
  tags?: string[];
  
  // NEW: Recurrence fields for updates
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: string | null;
  completedInstances?: string[];

  // REMOVED: Old nested recurrence
  // recurrence?: { ... } // DELETE THIS
}

export interface TaskResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
}