using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Collaboration
{
    public class CreateCommentRequest
    {
        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;

        public int? ParentCommentId { get; set; }
    }
}

