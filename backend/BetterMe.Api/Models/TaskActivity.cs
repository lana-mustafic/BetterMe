using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public enum ActivityType
    {
        Created = 0,
        Updated = 1,
        Completed = 2,
        Uncompleted = 3,
        Assigned = 4,
        Unassigned = 5,
        Shared = 6,
        Unshared = 7,
        CommentAdded = 8,
        CommentEdited = 9,
        CommentDeleted = 10,
        AttachmentAdded = 11,
        AttachmentDeleted = 12
    }

    public class TaskActivity
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
        public ActivityType ActivityType { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; } // Human-readable description

        [MaxLength(1000)]
        public string? Metadata { get; set; } // JSON string for additional data

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Optional: Related entity IDs
        public int? RelatedUserId { get; set; } // For assignments, shares, etc.

        [ForeignKey("RelatedUserId")]
        public User? RelatedUser { get; set; }

        public int? RelatedCommentId { get; set; }

        [ForeignKey("RelatedCommentId")]
        public TaskComment? RelatedComment { get; set; }
    }
}

