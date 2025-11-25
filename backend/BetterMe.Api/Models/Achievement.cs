using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class Achievement
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Code { get; set; } = string.Empty; // e.g., "first_task", "streak_7", "level_5"

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Icon { get; set; } = "🏆";

        [MaxLength(20)]
        public string Category { get; set; } = "general"; // "tasks", "habits", "streaks", "levels", "general"

        public int PointsRequired { get; set; } = 0;

        public int? StreakRequired { get; set; }

        public int? LevelRequired { get; set; }

        public int? TasksCompletedRequired { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class UserAchievement
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        public int AchievementId { get; set; }

        [ForeignKey("AchievementId")]
        public Achievement Achievement { get; set; }

        [Required]
        public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;

        public bool IsNew { get; set; } = true; // For showing notifications
    }
}

