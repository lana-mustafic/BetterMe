using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Task
{
    public class TaskTemplateResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? TaskDescription { get; set; }
        public string Category { get; set; } = "Other";
        public int Priority { get; set; } = 1;
        public int? EstimatedDurationMinutes { get; set; }
        public string? Difficulty { get; set; }
        public bool IsRecurring { get; set; }
        public string RecurrencePattern { get; set; } = "none";
        public int RecurrenceInterval { get; set; } = 1;
        public List<string> Tags { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public int UseCount { get; set; }
        public bool IsFavorite { get; set; }
    }

    public class CreateTaskTemplateRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? TaskDescription { get; set; }

        [MaxLength(50)]
        public string Category { get; set; } = "Other";

        [Range(1, 3)]
        public int Priority { get; set; } = 1;

        public int? EstimatedDurationMinutes { get; set; }

        [MaxLength(20)]
        public string? Difficulty { get; set; }

        public bool IsRecurring { get; set; } = false;

        [MaxLength(20)]
        public string RecurrencePattern { get; set; } = "none";

        [Range(1, 365)]
        public int RecurrenceInterval { get; set; } = 1;

        public List<string> Tags { get; set; } = new List<string>();
    }

    public class UpdateTaskTemplateRequest
    {
        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(100)]
        public string? Title { get; set; }

        [MaxLength(500)]
        public string? TaskDescription { get; set; }

        [MaxLength(50)]
        public string? Category { get; set; }

        [Range(1, 3)]
        public int? Priority { get; set; }

        public int? EstimatedDurationMinutes { get; set; }

        [MaxLength(20)]
        public string? Difficulty { get; set; }

        public bool? IsRecurring { get; set; }

        [MaxLength(20)]
        public string? RecurrencePattern { get; set; }

        [Range(1, 365)]
        public int? RecurrenceInterval { get; set; }

        public List<string>? Tags { get; set; }

        public bool? IsFavorite { get; set; }
    }
}

