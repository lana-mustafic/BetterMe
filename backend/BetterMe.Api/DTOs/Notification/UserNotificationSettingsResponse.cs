namespace BetterMe.Api.DTOs.Notification
{
    public class UserNotificationSettingsResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public bool EnableBrowserNotifications { get; set; }
        public bool EnableReminders { get; set; }
        public int DefaultReminderMinutes { get; set; }
        public TimeOnly? QuietHoursStart { get; set; }
        public TimeOnly? QuietHoursEnd { get; set; }
        public string ActiveDays { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

