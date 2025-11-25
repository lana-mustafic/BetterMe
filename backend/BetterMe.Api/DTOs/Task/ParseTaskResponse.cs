namespace BetterMe.Api.DTOs.Task
{
    public class ParseTaskResponse
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public int Priority { get; set; } = 1; // 1: Low, 2: Medium, 3: High
        public string Category { get; set; } = "Other";
        public List<string> Tags { get; set; } = new List<string>();
        public Dictionary<string, object> ExtractedData { get; set; } = new Dictionary<string, object>();
    }
}

