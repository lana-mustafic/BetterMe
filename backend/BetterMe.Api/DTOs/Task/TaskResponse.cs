namespace BetterMe.Api.DTOs.Task
{
    public class TaskResponse
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public int Priority { get; set; }
        public bool Completed { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string Category { get; set; } = "Other";
        public List<string> Tags { get; set; } = new List<string>();

        // Recurrence fields
        public bool IsRecurring { get; set; }
        public string RecurrencePattern { get; set; } = "none";
        public int RecurrenceInterval { get; set; } = 1;
        public DateTime? RecurrenceEndDate { get; set; }
        public List<string> CompletedInstances { get; set; } = new List<string>();
        public DateTime? NextDueDate { get; set; }
        public int? OriginalTaskId { get; set; }
        public List<AttachmentResponse> Attachments { get; set; } = new List<AttachmentResponse>();

        // Collaboration fields
        public int? AssignedToUserId { get; set; }
        public string? AssignedToUserName { get; set; }
        public bool IsShared { get; set; }
        public int CommentCount { get; set; }
    }
}