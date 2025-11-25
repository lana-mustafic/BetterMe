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

        // Subtasks
        public int? ParentTaskId { get; set; }
        public string? ParentTaskTitle { get; set; }
        public List<TaskResponse> Subtasks { get; set; } = new List<TaskResponse>();
        public int SubtaskCount { get; set; }
        public int CompletedSubtaskCount { get; set; }

        // Dependencies
        public List<int> DependsOnTaskIds { get; set; } = new List<int>();
        public List<DependencyInfo> Dependencies { get; set; } = new List<DependencyInfo>();
        public bool CanBeCompleted { get; set; } = true; // True if all dependencies are completed
        public List<string> BlockingReasons { get; set; } = new List<string>(); // Reasons why task can't be completed
    }

    public class DependencyInfo
    {
        public int TaskId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public string DependencyType { get; set; } = "blocks";
    }
}