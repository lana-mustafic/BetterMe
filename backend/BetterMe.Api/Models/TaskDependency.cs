using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class TaskDependency
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [ForeignKey("TaskId")]
        public TodoTask Task { get; set; }

        [Required]
        public int DependsOnTaskId { get; set; }

        [ForeignKey("DependsOnTaskId")]
        public TodoTask DependsOnTask { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Dependency type: "blocks" (Task B blocks Task A until B is complete)
        [MaxLength(20)]
        public string DependencyType { get; set; } = "blocks";
    }
}

