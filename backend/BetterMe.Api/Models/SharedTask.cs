using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public enum SharePermission
    {
        View = 0,      // Can only view
        Edit = 1,       // Can view and edit
        Comment = 2    // Can view and comment (future feature)
    }

    public class SharedTask
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [ForeignKey("TaskId")]
        public TodoTask Task { get; set; }

        [Required]
        public int OwnerId { get; set; }

        [ForeignKey("OwnerId")]
        public User Owner { get; set; }

        [Required]
        public int SharedWithUserId { get; set; }

        [ForeignKey("SharedWithUserId")]
        public User SharedWithUser { get; set; }

        [Required]
        public SharePermission Permission { get; set; } = SharePermission.View;

        public DateTime SharedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastAccessedAt { get; set; }

        // Optional: Share via link (public sharing)
        [MaxLength(100)]
        public string? ShareToken { get; set; } // Unique token for public sharing

        public bool IsPublic { get; set; } = false; // If true, can be accessed via share link

        public DateTime? ExpiresAt { get; set; } // Optional expiration date for share
    }
}

