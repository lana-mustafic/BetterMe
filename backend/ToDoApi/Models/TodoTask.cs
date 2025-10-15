using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ToDoApi.Models
{
    public class TodoTask
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; }

        [MaxLength(500)]
        public string Description { get; set; }

        public bool Completed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? DueDate { get; set; }

        public int Priority { get; set; } = 1;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = "Other";

        // ADD THIS MISSING PROPERTY:
        public DateTime? CompletedAt { get; set; }

        public List<TaskTag> TaskTags { get; set; } = new List<TaskTag>();
    }
}