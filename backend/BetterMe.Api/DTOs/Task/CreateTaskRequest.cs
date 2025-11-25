using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Task
{
    public class CreateTaskRequest
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; }

        [MaxLength(500)]
        public string Description { get; set; }

        public DateTime? DueDate { get; set; }

        [Range(1, 3)]
        public int Priority { get; set; } = 1;

        [MaxLength(50)]
        public string Category { get; set; } = "Other";

        public List<string> Tags { get; set; } = new List<string>();

        // NEW: Recurrence fields
        public bool IsRecurring { get; set; } = false;
        public string RecurrencePattern { get; set; } = "none";
        public int RecurrenceInterval { get; set; } = 1;
        public DateTime? RecurrenceEndDate { get; set; }

        // My Day feature
        public bool IsInMyDay { get; set; } = false;
    }
}
