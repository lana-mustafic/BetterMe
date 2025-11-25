using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Task
{
    public class ParseTaskRequest
    {
        [Required]
        public string Input { get; set; } = string.Empty;
    }
}

