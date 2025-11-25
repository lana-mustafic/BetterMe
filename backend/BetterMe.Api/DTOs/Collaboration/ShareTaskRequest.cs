using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Collaboration
{
    public class ShareTaskRequest
    {
        [Required]
        public int TaskId { get; set; }

        [Required]
        public int SharedWithUserId { get; set; }

        [Required]
        public SharePermissionDto Permission { get; set; } = SharePermissionDto.View;

        public DateTime? ExpiresAt { get; set; }
    }

    public enum SharePermissionDto
    {
        View = 0,
        Edit = 1,
        Comment = 2
    }
}

