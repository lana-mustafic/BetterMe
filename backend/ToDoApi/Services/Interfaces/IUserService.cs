using ToDoApi.Models;
using AuthDTOs = ToDoApi.DTOs.Auth;

namespace ToDoApi.Services.Interfaces
{
    public interface IUserService
    {
        Task<User> RegisterAsync(AuthDTOs.RegisterRequest request);
        Task<User> LoginAsync(AuthDTOs.LoginRequest request);
        Task<User> GetByIdAsync(int id);
        Task<User> UpdateUserProfileAsync(int userId, AuthDTOs.UpdateProfileRequest request);
        Task<bool> ChangePasswordAsync(int userId, AuthDTOs.ChangePasswordRequest request);
        Task<User> GetByEmailAsync(string email);
    }
}