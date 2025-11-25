using BetterMe.Api.DTOs.Collaboration;
using BetterMe.Api.Models;

namespace BetterMe.Api.Services.Interfaces
{
    public interface ICollaborationService
    {
        Task<SharedTask> ShareTaskAsync(int taskId, int ownerId, ShareTaskRequest request);
        Task<bool> UnshareTaskAsync(int taskId, int ownerId, int sharedWithUserId);
        Task<List<SharedTaskResponse>> GetSharedTasksAsync(int userId);
        Task<List<SharedTaskResponse>> GetTaskSharesAsync(int taskId, int userId);
        Task<bool> CanUserAccessTaskAsync(int taskId, int userId);
        Task<SharePermission> GetUserPermissionAsync(int taskId, int userId);

        Task<TaskComment> CreateCommentAsync(int taskId, int userId, CreateCommentRequest request);
        Task<TaskComment> UpdateCommentAsync(int commentId, int userId, string content);
        Task<bool> DeleteCommentAsync(int commentId, int userId);
        Task<List<CommentResponse>> GetTaskCommentsAsync(int taskId, int userId);

        Task<TaskActivity> LogActivityAsync(int taskId, int userId, ActivityType activityType, string? description = null, int? relatedUserId = null, int? relatedCommentId = null);
        Task<List<ActivityResponse>> GetTaskActivitiesAsync(int taskId, int userId);

        Task<bool> AssignTaskAsync(int taskId, int ownerId, int? assignedToUserId);
    }
}

