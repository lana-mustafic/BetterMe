using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class SharedTemplate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TemplateId { get; set; }

        [ForeignKey("TemplateId")]
        public TaskTemplate Template { get; set; }

        [Required]
        public int OwnerId { get; set; }

        [ForeignKey("OwnerId")]
        public User Owner { get; set; }

        [Required]
        public int SharedWithUserId { get; set; }

        [ForeignKey("SharedWithUserId")]
        public User SharedWithUser { get; set; }

        public DateTime SharedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastAccessedAt { get; set; }

        // Optional: Share via link (public sharing)
        [MaxLength(100)]
        public string? ShareToken { get; set; } // Unique token for public sharing

        public bool IsPublic { get; set; } = false; // If true, can be accessed via share link

        public DateTime? ExpiresAt { get; set; } // Optional expiration date for share
    }
}

