namespace BetterMe.Api.DTOs.Task
{
    public class SearchTasksRequest
    {
        public string? SearchTerm { get; set; }
        public string? Category { get; set; }
        public bool? Completed { get; set; }
        public int? Priority { get; set; }
        public List<string>? Tags { get; set; }
        public string? TagLogic { get; set; } = "OR"; // "AND" or "OR"
        public DateTime? DueDateFrom { get; set; }
        public DateTime? DueDateTo { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public bool? HasDueDate { get; set; }
        public bool? IsOverdue { get; set; }
        public bool? IsDueToday { get; set; }
        public bool? IsRecurring { get; set; }
        public string? SortBy { get; set; } = "createdAt"; // "createdAt", "dueDate", "priority", "title"
        public string? SortDirection { get; set; } = "desc"; // "asc" or "desc"
        public int? Page { get; set; } = 1;
        public int? PageSize { get; set; } = 100;
    }
}

