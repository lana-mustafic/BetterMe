using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [MaxLength(1000)]
        public string? Message { get; set; }

        [MaxLength(50)]
        public string Type { get; set; } = "reminder"; // "reminder", "task_assigned", "task_shared", etc.

        public int? TaskId { get; set; }

        [ForeignKey("TaskId")]
        public TodoTask? Task { get; set; }

        public int? ReminderId { get; set; }

        [ForeignKey("ReminderId")]
        public TaskReminder? Reminder { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAt { get; set; }

        [MaxLength(500)]
        public string? ActionUrl { get; set; } // URL to navigate when notification is clicked
    }
}

