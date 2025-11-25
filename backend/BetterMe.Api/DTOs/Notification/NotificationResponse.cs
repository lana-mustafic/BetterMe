namespace BetterMe.Api.DTOs.Notification
{
    public class NotificationResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Message { get; set; }
        public string Type { get; set; } = string.Empty;
        public int? TaskId { get; set; }
        public string? TaskTitle { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public string? ActionUrl { get; set; }
    }
}

