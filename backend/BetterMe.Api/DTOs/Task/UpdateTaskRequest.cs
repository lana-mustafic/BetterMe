public class UpdateTaskRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; } 
    public int? Priority { get; set; }
    public bool? Completed { get; set; }
    public string? Category { get; set; }
    public List<string>? Tags { get; set; }
    public bool? IsRecurring { get; set; }
    public string? RecurrencePattern { get; set; }
    public int? RecurrenceInterval { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public List<string>? CompletedInstances { get; set; }
}