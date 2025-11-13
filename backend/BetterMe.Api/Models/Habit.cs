using System.ComponentModel.DataAnnotations;

namespace BetterMe.Models
{
    public class Habit
    {
        public Guid Id { get; set; }

        [Required]
        public int UserId { get; set; } // Changed to int

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public string Frequency { get; set; } = "daily";

        public int Streak { get; set; }
        public int BestStreak { get; set; }
        public List<DateTime> CompletedDates { get; set; } = new List<DateTime>();

        [Range(1, 100)]
        public int TargetCount { get; set; } = 1;
        public int CurrentCount { get; set; }

        [Required]
        public string Category { get; set; } = "Health & Fitness";

        [Required]
        public string Color { get; set; } = "#4ade80";

        [Required]
        public string Icon { get; set; } = "✅";

        [Required]
        public string Difficulty { get; set; } = "easy";

        [Range(1, 100)]
        public int Points { get; set; } = 10;

        public bool IsActive { get; set; } = true;
        public string? ReminderTime { get; set; }
        public List<string> Tags { get; set; } = new List<string>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateHabitRequest
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public string Frequency { get; set; } = "daily";

        [Range(1, 100)]
        public int TargetCount { get; set; } = 1;

        [Required]
        public string Category { get; set; } = "Health & Fitness";

        public string Color { get; set; } = "#4ade80";
        public string Icon { get; set; } = "✅";

        [Required]
        public string Difficulty { get; set; } = "easy";

        [Range(1, 100)]
        public int Points { get; set; } = 10;

        public string? ReminderTime { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
    }

    public class UpdateHabitRequest
    {
        [StringLength(100)]
        public string? Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public string? Frequency { get; set; }

        [Range(1, 100)]
        public int? TargetCount { get; set; }

        public string? Category { get; set; }
        public string? Color { get; set; }
        public string? Icon { get; set; }
        public string? Difficulty { get; set; }

        [Range(1, 100)]
        public int? Points { get; set; }

        public bool? IsActive { get; set; }
        public string? ReminderTime { get; set; }
        public List<string>? Tags { get; set; }
    }
}