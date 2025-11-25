namespace BetterMe.Api.DTOs.Notification
{
    public class UserNotificationSettingsRequest
    {
        public bool? EnableBrowserNotifications { get; set; }
        public string? PushSubscriptionJson { get; set; }
        public bool? EnableReminders { get; set; }
        public int? DefaultReminderMinutes { get; set; }
        public TimeOnly? QuietHoursStart { get; set; }
        public TimeOnly? QuietHoursEnd { get; set; }
        public string? ActiveDays { get; set; }
    }
}

