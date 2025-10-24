using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class TaskTag
    {
        public int TodoTaskId { get; set; }  // This is the actual database column

        [ForeignKey("TodoTaskId")]
        public TodoTask TodoTask { get; set; } = null!;

        public int TagId { get; set; }

        [ForeignKey("TagId")]
        public Tag Tag { get; set; } = null!;

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        // Add a writable TaskId property that maps to TodoTaskId
        [NotMapped]
        public int TaskId
        {
            get => TodoTaskId;
            set => TodoTaskId = value;
        }
    }
}