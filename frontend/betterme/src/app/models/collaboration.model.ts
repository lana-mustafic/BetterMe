export interface SharedTask {
  id: number;
  taskId: number;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  sharedWithUserId: number;
  sharedWithUserName: string;
  sharedWithUserEmail: string;
  permission: SharePermission;
  sharedAt: string;
  lastAccessedAt?: string;
  shareToken?: string;
  isPublic: boolean;
  expiresAt?: string;
}

export enum SharePermission {
  View = 0,
  Edit = 1,
  Comment = 2
}

export interface ShareTaskRequest {
  taskId: number;
  sharedWithUserId: number;
  permission: SharePermission;
  expiresAt?: string;
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  parentCommentId?: number;
  replies: TaskComment[];
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: number;
}

export interface TaskActivity {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  userEmail: string;
  activityType: ActivityType;
  description?: string;
  createdAt: string;
  relatedUserId?: number;
  relatedUserName?: string;
}

export enum ActivityType {
  Created = 0,
  Updated = 1,
  Completed = 2,
  Uncompleted = 3,
  Assigned = 4,
  Unassigned = 5,
  Shared = 6,
  Unshared = 7,
  CommentAdded = 8,
  CommentEdited = 9,
  CommentDeleted = 10,
  AttachmentAdded = 11,
  AttachmentDeleted = 12
}

export interface AssignTaskRequest {
  assignedToUserId?: number;
}

// Update Task interface to include collaboration fields
export interface TaskCollaborationInfo {
  assignedToUserId?: number;
  assignedToUserName?: string;
  isShared: boolean;
  commentCount: number;
  ownerId: number;
}

