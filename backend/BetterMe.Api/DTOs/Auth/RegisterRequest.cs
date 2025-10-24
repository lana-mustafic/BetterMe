using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Auth
{
    public class RegisterRequest
    {
        [Required]
        [MaxLength(100)]
        public string DisplayName { get; set; }
        [Required]
        [EmailAddress]
        [MaxLength (100)]
        public string Email { get; set; }
        [Required]
        [MinLength(6, ErrorMessage ="Password must be at least 6 characters.")]
        public string Password { get; set; }
    }
}
