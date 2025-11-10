using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Auth
{
    public class ResendVerificationRequest
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
        public string Email { get; set; } = string.Empty;
    }
}