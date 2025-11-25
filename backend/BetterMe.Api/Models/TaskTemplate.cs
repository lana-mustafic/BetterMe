using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class TaskTemplate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; }

        [MaxLength(500)]
        public string? TaskDescription { get; set; }

        [MaxLength(50)]
        public string Category { get; set; } = "Other";

        public int Priority { get; set; } = 1;

        public int? EstimatedDurationMinutes { get; set; }

        [MaxLength(20)]
        public string? Difficulty { get; set; }

        public bool IsRecurring { get; set; } = false;

        [MaxLength(20)]
        public string RecurrencePattern { get; set; } = "none";

        public int RecurrenceInterval { get; set; } = 1;

        // Store tags as JSON
        public string TagsJson { get; set; } = "[]";

        [NotMapped]
        public List<string> Tags
        {
            get => string.IsNullOrEmpty(TagsJson)
                ? new List<string>()
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(TagsJson) ?? new List<string>();
            set => TagsJson = System.Text.Json.JsonSerializer.Serialize(value ?? new List<string>());
        }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastUsedAt { get; set; }

        public int UseCount { get; set; } = 0;

        public bool IsFavorite { get; set; } = false;
    }
}

