using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Auth
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Display name is required.")]
        [MaxLength(100, ErrorMessage = "Display name cannot exceed 100 characters.")]
        [MinLength(2, ErrorMessage = "Display name must be at least 2 characters.")]
        public string DisplayName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        [RegularExpression(@"^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]).{6,}$",
            ErrorMessage = "Password must contain letters, numbers, and symbols.")]
        public string Password { get; set; } = string.Empty;
    }
}