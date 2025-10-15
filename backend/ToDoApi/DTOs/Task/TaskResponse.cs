namespace ToDoApi.DTOs.Task
{
    public class TaskResponse
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public int Priority { get; set; }
        public bool Completed { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        // NEW: Add Category
        public string Category { get; set; } = "Other";

        // NEW: Add Tags
        public List<string> Tags { get; set; } = new List<string>();
    }
}