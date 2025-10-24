using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        public DateTime DateCreated { get; set; } = DateTime.UtcNow;

        public DateTime? LastLogin { get; set; }

        public List<TodoTask> TodoTasks { get; set; } = new List<TodoTask>();

        // NEW: Navigation property for Tags
        public List<Tag> Tags { get; set; } = new List<Tag>();
    }
}