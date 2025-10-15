namespace ToDoApi.DTOs.Task
{
    public class TagResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int TaskCount { get; set; } // Number of tasks using this tag
    }
}