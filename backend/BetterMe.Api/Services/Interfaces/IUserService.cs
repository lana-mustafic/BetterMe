using BetterMe.Api.Models;
using AuthDTOs = BetterMe.Api.DTOs.Auth;

namespace BetterMe.Api.Services.Interfaces
{
    public interface IUserService
    {
        Task<User> RegisterAsync(AuthDTOs.RegisterRequest request);
        Task<User> LoginAsync(AuthDTOs.LoginRequest request);
        Task<User> GetByIdAsync(int id);
        Task<User> UpdateUserProfileAsync(int userId, AuthDTOs.UpdateProfileRequest request);
        Task<bool> ChangePasswordAsync(int userId, AuthDTOs.ChangePasswordRequest request);
        Task<User> GetByEmailAsync(string email);
        Task<User?> GetUserByEmailAsync(string email);
        Task<bool> UpdateUserAsync(User user); // Add this
        Task<List<User>> SearchUsersAsync(string query);
    }
}