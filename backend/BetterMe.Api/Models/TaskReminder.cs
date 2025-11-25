using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class TaskReminder
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [ForeignKey("TaskId")]
        public TodoTask Task { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        public DateTime RemindAt { get; set; }

        [Required]
        [MaxLength(20)]
        public string ReminderType { get; set; } = "before_due"; // "before_due", "at_due", "custom"

        // For "before_due" type, store the offset (e.g., "1 hour", "1 day", "30 minutes")
        [MaxLength(50)]
        public string? Offset { get; set; }

        [Required]
        [MaxLength(20)]
        public string NotificationMethod { get; set; } = "browser"; // "browser" only

        public bool IsSent { get; set; } = false;

        public DateTime? SentAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Smart reminder settings
        public bool IsActive { get; set; } = true;

        [MaxLength(500)]
        public string? CustomMessage { get; set; }
    }
}

