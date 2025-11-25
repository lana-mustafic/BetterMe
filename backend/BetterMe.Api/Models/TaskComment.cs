using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class TaskComment
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
        [MaxLength(2000)]
        public string Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public bool IsEdited { get; set; } = false;

        // Optional: Reply to another comment
        public int? ParentCommentId { get; set; }

        [ForeignKey("ParentCommentId")]
        public TaskComment? ParentComment { get; set; }

        public List<TaskComment> Replies { get; set; } = new List<TaskComment>();
    }
}

