namespace ToDoApi.DTOs.Task
{
    public class TaskStatsResponse
    {
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public List<CategoryResponse> Categories { get; set; } = new List<CategoryResponse>();
        public List<TagResponse> PopularTags { get; set; } = new List<TagResponse>();
    }
}