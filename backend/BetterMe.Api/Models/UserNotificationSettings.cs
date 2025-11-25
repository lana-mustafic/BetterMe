using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class UserNotificationSettings
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        // Browser push notification settings
        public bool EnableBrowserNotifications { get; set; } = true;

        [MaxLength(500)]
        public string? PushSubscriptionJson { get; set; } // Web Push subscription JSON

        // Reminder preferences
        public bool EnableReminders { get; set; } = true;

        public int DefaultReminderMinutes { get; set; } = 30; // Default: 30 minutes before

        // Quiet hours (don't send notifications during these times)
        public TimeOnly? QuietHoursStart { get; set; }

        public TimeOnly? QuietHoursEnd { get; set; }

        // Days of week to send notifications (comma-separated: "0,1,2,3,4,5,6" for Mon-Sun)
        [MaxLength(20)]
        public string ActiveDays { get; set; } = "0,1,2,3,4,5,6"; // All days by default

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}

