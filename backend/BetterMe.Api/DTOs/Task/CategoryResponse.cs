namespace BetterMe.Api.DTOs.Task
{
    public class CategoryResponse
    {
        public string Name { get; set; } = string.Empty;
        public int TaskCount { get; set; } // Number of tasks in this category
    }
}