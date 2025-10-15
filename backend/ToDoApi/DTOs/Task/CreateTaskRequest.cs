using System.ComponentModel.DataAnnotations;

namespace ToDoApi.DTOs.Task
{
    public class CreateTaskRequest
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public DateTime? DueDate { get; set; }

        [Range(1, 3)]
        public int Priority { get; set; } = 1;

        // NEW: Add Category
        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = "Other";

        // NEW: Add Tags (list of tag names)
        public List<string> Tags { get; set; } = new List<string>();
    }
}