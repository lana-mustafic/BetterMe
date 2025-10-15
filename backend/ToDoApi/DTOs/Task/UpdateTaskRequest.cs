using System.ComponentModel.DataAnnotations;

namespace ToDoApi.DTOs.Task
{
    public class UpdateTaskRequest
    {
        [MaxLength(100)]
        public string? Title { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime? DueDate { get; set; }

        [Range(1, 3)]
        public int? Priority { get; set; }

        public bool? Completed { get; set; }

        // NEW: Add Category
        [MaxLength(50)]
        public string? Category { get; set; }

        // NEW: Add Tags (list of tag names)
        public List<string>? Tags { get; set; }
    }
}