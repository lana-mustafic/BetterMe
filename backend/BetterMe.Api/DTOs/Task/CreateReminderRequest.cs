using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Task
{
    public class CreateReminderRequest
    {
        [Required]
        public int TaskId { get; set; }

        [Required]
        public string ReminderType { get; set; } = "before_due"; // "before_due", "at_due", "custom"

        // For "before_due" type: "1 hour", "1 day", "30 minutes", etc.
        public string? Offset { get; set; }

        // For "custom" type: specific datetime
        public DateTime? CustomDateTime { get; set; }

        [Required]
        public string NotificationMethod { get; set; } = "browser"; // "browser" only

        public string? CustomMessage { get; set; }
    }
}

