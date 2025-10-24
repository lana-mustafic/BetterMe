using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Auth
{
    public class UpdateProfileRequest
    {
        [Required]
        [MaxLength(100)]
        public string DisplayName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
    }
}