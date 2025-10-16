using System.ComponentModel.DataAnnotations;

public class UpdateTaskRequest
{
    [MaxLength(100)]
    public string Title { get; set; }

    [MaxLength(500)]
    public string Description { get; set; }

    public DateTime? DueDate { get; set; }

    [Range(1, 3)]
    public int? Priority { get; set; }

    public bool? Completed { get; set; }

    [MaxLength(50)]
    public string Category { get; set; }

    public List<string> Tags { get; set; }

    // NEW: Recurrence fields
    public bool? IsRecurring { get; set; }
    public string RecurrencePattern { get; set; }
    public int? RecurrenceInterval { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public List<string> CompletedInstances { get; set; }
}

public class TaskResponse
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public bool Completed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public int Priority { get; set; }
    public string Category { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<string> Tags { get; set; } = new List<string>();

    // NEW: Recurrence fields
    public bool IsRecurring { get; set; }
    public string RecurrencePattern { get; set; }
    public int RecurrenceInterval { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public List<string> CompletedInstances { get; set; } = new List<string>();
    public DateTime? NextDueDate { get; set; }
    public int? OriginalTaskId { get; set; }
}
