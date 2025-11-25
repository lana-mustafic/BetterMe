using BetterMe.Api.Data;
using BetterMe.Api.DTOs.Collaboration;
using BetterMe.Api.Models;
using BetterMe.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Services.Concrete
{
    public class CollaborationService : ICollaborationService
    {
        private readonly AppDbContext _context;

        public CollaborationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<SharedTask> ShareTaskAsync(int taskId, int ownerId, ShareTaskRequest request)
        {
            // Verify task exists and belongs to owner
            var task = await _context.TodoTasks
                .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == ownerId);
            
            if (task == null)
                throw new UnauthorizedAccessException("Task not found or you don't have permission to share it");

            // Verify shared user exists
            var sharedUser = await _context.Users.FindAsync(request.SharedWithUserId);
            if (sharedUser == null)
                throw new ArgumentException("User not found");

            // Check if already shared
            var existingShare = await _context.SharedTasks
                .FirstOrDefaultAsync(st => st.TaskId == taskId && st.SharedWithUserId == request.SharedWithUserId);

            if (existingShare != null)
            {
                // Update existing share
                existingShare.Permission = (SharePermission)request.Permission;
                existingShare.ExpiresAt = request.ExpiresAt;
                existingShare.LastAccessedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return existingShare;
            }

            // Create new share
            var share = new SharedTask
            {
                TaskId = taskId,
                OwnerId = ownerId,
                SharedWithUserId = request.SharedWithUserId,
                Permission = (SharePermission)request.Permission,
                SharedAt = DateTime.UtcNow,
                ExpiresAt = request.ExpiresAt
            };

            _context.SharedTasks.Add(share);
            await _context.SaveChangesAsync();

            // Log activity
            await LogActivityAsync(taskId, ownerId, ActivityType.Shared, 
                $"Shared task with {sharedUser.Name}", request.SharedWithUserId);

            return share;
        }

        public async Task<bool> UnshareTaskAsync(int taskId, int ownerId, int sharedWithUserId)
        {
            var share = await _context.SharedTasks
                .FirstOrDefaultAsync(st => st.TaskId == taskId && 
                    st.OwnerId == ownerId && 
                    st.SharedWithUserId == sharedWithUserId);

            if (share == null)
                return false;

            _context.SharedTasks.Remove(share);
            await _context.SaveChangesAsync();

            // Log activity
            await LogActivityAsync(taskId, ownerId, ActivityType.Unshared, 
                $"Unshared task with user ID {sharedWithUserId}", sharedWithUserId);

            return true;
        }

        public async Task<List<SharedTaskResponse>> GetSharedTasksAsync(int userId)
        {
            var shares = await _context.SharedTasks
                .Include(st => st.Task)
                .Include(st => st.Owner)
                .Include(st => st.SharedWithUser)
                .Where(st => st.SharedWithUserId == userId)
                .ToListAsync();

            return shares.Select(st => new SharedTaskResponse
            {
                Id = st.Id,
                TaskId = st.TaskId,
                OwnerId = st.OwnerId,
                OwnerName = st.Owner.Name,
                OwnerEmail = st.Owner.Email,
                SharedWithUserId = st.SharedWithUserId,
                SharedWithUserName = st.SharedWithUser.Name,
                SharedWithUserEmail = st.SharedWithUser.Email,
                Permission = (SharePermissionDto)st.Permission,
                SharedAt = st.SharedAt,
                LastAccessedAt = st.LastAccessedAt,
                ShareToken = st.ShareToken,
                IsPublic = st.IsPublic,
                ExpiresAt = st.ExpiresAt
            }).ToList();
        }

        public async Task<List<SharedTaskResponse>> GetTaskSharesAsync(int taskId, int userId)
        {
            var task = await _context.TodoTasks.FindAsync(taskId);
            if (task == null || task.UserId != userId)
                throw new UnauthorizedAccessException("Task not found or you don't have permission");

            var shares = await _context.SharedTasks
                .Include(st => st.SharedWithUser)
                .Include(st => st.Owner)
                .Where(st => st.TaskId == taskId)
                .ToListAsync();

            return shares.Select(st => new SharedTaskResponse
            {
                Id = st.Id,
                TaskId = st.TaskId,
                OwnerId = st.OwnerId,
                OwnerName = st.Owner.Name,
                OwnerEmail = st.Owner.Email,
                SharedWithUserId = st.SharedWithUserId,
                SharedWithUserName = st.SharedWithUser.Name,
                SharedWithUserEmail = st.SharedWithUser.Email,
                Permission = (SharePermissionDto)st.Permission,
                SharedAt = st.SharedAt,
                LastAccessedAt = st.LastAccessedAt,
                ShareToken = st.ShareToken,
                IsPublic = st.IsPublic,
                ExpiresAt = st.ExpiresAt
            }).ToList();
        }

        public async Task<bool> CanUserAccessTaskAsync(int taskId, int userId)
        {
            // Check if user owns the task
            var task = await _context.TodoTasks.FindAsync(taskId);
            if (task != null && task.UserId == userId)
                return true;

            // Check if task is shared with user
            var share = await _context.SharedTasks
                .FirstOrDefaultAsync(st => st.TaskId == taskId && st.SharedWithUserId == userId);
            
            if (share == null)
                return false;

            // Check if share has expired
            if (share.ExpiresAt.HasValue && share.ExpiresAt.Value < DateTime.UtcNow)
                return false;

            // Update last accessed
            share.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<SharePermission> GetUserPermissionAsync(int taskId, int userId)
        {
            // Check if user owns the task (full permission)
            var task = await _context.TodoTasks.FindAsync(taskId);
            if (task != null && task.UserId == userId)
                return SharePermission.Edit; // Owners have full edit permission

            // Check shared permission
            var share = await _context.SharedTasks
                .FirstOrDefaultAsync(st => st.TaskId == taskId && st.SharedWithUserId == userId);
            
            return share?.Permission ?? SharePermission.View;
        }

        public async Task<TaskComment> CreateCommentAsync(int taskId, int userId, CreateCommentRequest request)
        {
            // Verify user can access task
            if (!await CanUserAccessTaskAsync(taskId, userId))
                throw new UnauthorizedAccessException("You don't have permission to comment on this task");

            var comment = new TaskComment
            {
                TaskId = taskId,
                UserId = userId,
                Content = request.Content,
                ParentCommentId = request.ParentCommentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskComments.Add(comment);
            await _context.SaveChangesAsync();

            // Log activity
            await LogActivityAsync(taskId, userId, ActivityType.CommentAdded, 
                "Added a comment", null, comment.Id);

            return comment;
        }

        public async Task<TaskComment> UpdateCommentAsync(int commentId, int userId, string content)
        {
            var comment = await _context.TaskComments
                .Include(c => c.Task)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null)
                throw new ArgumentException("Comment not found");

            if (comment.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to edit this comment");

            comment.Content = content;
            comment.UpdatedAt = DateTime.UtcNow;
            comment.IsEdited = true;

            await _context.SaveChangesAsync();

            // Log activity
            await LogActivityAsync(comment.TaskId, userId, ActivityType.CommentEdited, 
                "Edited a comment", null, commentId);

            return comment;
        }

        public async Task<bool> DeleteCommentAsync(int commentId, int userId)
        {
            var comment = await _context.TaskComments
                .Include(c => c.Task)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null)
                return false;

            // User can delete their own comment or if they own the task
            var task = await _context.TodoTasks.FindAsync(comment.TaskId);
            bool canDelete = comment.UserId == userId || (task != null && task.UserId == userId);

            if (!canDelete)
                throw new UnauthorizedAccessException("You don't have permission to delete this comment");

            int taskId = comment.TaskId;
            _context.TaskComments.Remove(comment);
            await _context.SaveChangesAsync();

            // Log activity
            await LogActivityAsync(taskId, userId, ActivityType.CommentDeleted, 
                "Deleted a comment", null, commentId);

            return true;
        }

        public async Task<List<CommentResponse>> GetTaskCommentsAsync(int taskId, int userId)
        {
            // Verify user can access task
            if (!await CanUserAccessTaskAsync(taskId, userId))
                throw new UnauthorizedAccessException("You don't have permission to view comments on this task");

            var comments = await _context.TaskComments
                .Include(c => c.User)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.User)
                .Where(c => c.TaskId == taskId && c.ParentCommentId == null)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return comments.Select(c => MapCommentToResponse(c)).ToList();
        }

        private CommentResponse MapCommentToResponse(TaskComment comment)
        {
            return new CommentResponse
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                UserId = comment.UserId,
                UserName = comment.User.Name,
                UserEmail = comment.User.Email,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt,
                IsEdited = comment.IsEdited,
                ParentCommentId = comment.ParentCommentId,
                Replies = comment.Replies.Select(r => MapCommentToResponse(r)).ToList()
            };
        }

        public async Task<TaskActivity> LogActivityAsync(int taskId, int userId, ActivityType activityType, string? description = null, int? relatedUserId = null, int? relatedCommentId = null)
        {
            var activity = new TaskActivity
            {
                TaskId = taskId,
                UserId = userId,
                ActivityType = activityType,
                Description = description ?? GetDefaultActivityDescription(activityType),
                CreatedAt = DateTime.UtcNow,
                RelatedUserId = relatedUserId,
                RelatedCommentId = relatedCommentId
            };

            _context.TaskActivities.Add(activity);
            await _context.SaveChangesAsync();

            return activity;
        }

        private string GetDefaultActivityDescription(ActivityType activityType)
        {
            return activityType switch
            {
                ActivityType.Created => "Task created",
                ActivityType.Updated => "Task updated",
                ActivityType.Completed => "Task completed",
                ActivityType.Uncompleted => "Task uncompleted",
                ActivityType.Assigned => "Task assigned",
                ActivityType.Unassigned => "Task unassigned",
                ActivityType.Shared => "Task shared",
                ActivityType.Unshared => "Task unshared",
                ActivityType.CommentAdded => "Comment added",
                ActivityType.CommentEdited => "Comment edited",
                ActivityType.CommentDeleted => "Comment deleted",
                ActivityType.AttachmentAdded => "Attachment added",
                ActivityType.AttachmentDeleted => "Attachment deleted",
                _ => "Activity occurred"
            };
        }

        public async Task<List<ActivityResponse>> GetTaskActivitiesAsync(int taskId, int userId)
        {
            // Verify user can access task
            if (!await CanUserAccessTaskAsync(taskId, userId))
                throw new UnauthorizedAccessException("You don't have permission to view activities for this task");

            var activities = await _context.TaskActivities
                .Include(a => a.User)
                .Include(a => a.RelatedUser)
                .Where(a => a.TaskId == taskId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(50) // Limit to last 50 activities
                .ToListAsync();

            return activities.Select(a => new ActivityResponse
            {
                Id = a.Id,
                TaskId = a.TaskId,
                UserId = a.UserId,
                UserName = a.User.Name,
                UserEmail = a.User.Email,
                ActivityType = (ActivityTypeDto)a.ActivityType,
                Description = a.Description,
                CreatedAt = a.CreatedAt,
                RelatedUserId = a.RelatedUserId,
                RelatedUserName = a.RelatedUser?.Name
            }).ToList();
        }

        public async Task<bool> AssignTaskAsync(int taskId, int ownerId, int? assignedToUserId)
        {
            var task = await _context.TodoTasks.FindAsync(taskId);
            if (task == null || task.UserId != ownerId)
                throw new UnauthorizedAccessException("Task not found or you don't have permission to assign it");

            // Verify assigned user exists if provided
            if (assignedToUserId.HasValue)
            {
                var assignedUser = await _context.Users.FindAsync(assignedToUserId.Value);
                if (assignedUser == null)
                    throw new ArgumentException("User not found");
            }

            var previousAssignee = task.AssignedToUserId;
            task.AssignedToUserId = assignedToUserId;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            if (assignedToUserId.HasValue)
            {
                await LogActivityAsync(taskId, ownerId, ActivityType.Assigned, 
                    $"Task assigned to user ID {assignedToUserId}", assignedToUserId);
            }
            else if (previousAssignee.HasValue)
            {
                await LogActivityAsync(taskId, ownerId, ActivityType.Unassigned, 
                    $"Task unassigned from user ID {previousAssignee}", previousAssignee);
            }

            return true;
        }
    }
}

