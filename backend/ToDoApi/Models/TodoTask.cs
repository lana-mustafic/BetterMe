using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ToDoApi.Models
{
    public class TodoTask
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; }

        [MaxLength(500)]
        public string Description { get; set; }

        public bool Completed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? DueDate { get; set; }

        public int Priority { get; set; } = 1;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = "Other";

        public DateTime? CompletedAt { get; set; }

        // NEW: Recurrence fields
        public bool IsRecurring { get; set; } = false;

        [MaxLength(20)]
        public string RecurrencePattern { get; set; } = "none"; // "none", "daily", "weekly", "monthly", "yearly"

        public int RecurrenceInterval { get; set; } = 1;

        public DateTime? RecurrenceEndDate { get; set; }

        // Store completed instances as JSON array
        public string CompletedInstancesJson { get; set; }

        public DateTime? NextDueDate { get; set; }

        public int? OriginalTaskId { get; set; } // For tracking recurring task chains

        [NotMapped]
        public List<string> CompletedInstances
        {
            get => string.IsNullOrEmpty(CompletedInstancesJson)
                ? new List<string>()
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(CompletedInstancesJson) ?? new List<string>();
            set => CompletedInstancesJson = System.Text.Json.JsonSerializer.Serialize(value ?? new List<string>());
        }

        public List<TaskTag> TaskTags { get; set; } = new List<TaskTag>();
    }

    // NEW: DTO for recurrence configuration
    public class RecurrenceConfig
    {
        public string Pattern { get; set; } = "none";
        public int Interval { get; set; } = 1;
        public DateTime? EndDate { get; set; }
    }
}