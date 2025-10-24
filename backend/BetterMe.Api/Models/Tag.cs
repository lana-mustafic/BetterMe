using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class Tag
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        // Navigation property for Tasks (many-to-many)
        public List<TaskTag> TaskTags { get; set; } = new List<TaskTag>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}