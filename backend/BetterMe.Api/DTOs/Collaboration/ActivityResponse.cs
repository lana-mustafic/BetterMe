namespace BetterMe.Api.DTOs.Collaboration
{
    public class ActivityResponse
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public ActivityTypeDto ActivityType { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? RelatedUserId { get; set; }
        public string? RelatedUserName { get; set; }
    }

    public enum ActivityTypeDto
    {
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
}

