namespace BetterMe.Api.DTOs.Task
{
    public class ReminderResponse
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;
        public DateTime RemindAt { get; set; }
        public string ReminderType { get; set; } = string.Empty;
        public string? Offset { get; set; }
        public string NotificationMethod { get; set; } = string.Empty;
        public bool IsSent { get; set; }
        public DateTime? SentAt { get; set; }
        public bool IsActive { get; set; }
        public string? CustomMessage { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

