namespace BetterMe.Api.DTOs.Auth
{
    public class UserResponse
    {
        public int Id { get; set; }
        public string DisplayName { get; set; }
        public string Email { get; set; }
        public DateTime DateCreated { get; set; } // Changed from CreatedAt to DateCreated
    }
}