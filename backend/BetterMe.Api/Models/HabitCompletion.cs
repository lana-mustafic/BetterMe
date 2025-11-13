using System.ComponentModel.DataAnnotations;

namespace BetterMe.Models
{
    public class HabitCompletion
    {
        public Guid Id { get; set; }

        [Required]
        public Guid HabitId { get; set; }

        [Required]
        public int UserId { get; set; } // Changed to int

        [Required]
        public DateTime CompletedAt { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public string? Mood { get; set; }

        [Range(0, 1000)]
        public int PointsEarned { get; set; }
    }

    public class CompleteHabitRequest
    {
        public string? Notes { get; set; }
        public string? Mood { get; set; }
    }
}