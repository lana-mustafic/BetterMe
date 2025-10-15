using Microsoft.AspNetCore.Identity;
using ToDoApi.Models;
using ToDoApi.Repositories.Interfaces;
using ToDoApi.Services.Interfaces;
using AuthDTOs = ToDoApi.DTOs.Auth;
using System.Threading.Tasks;

namespace ToDoApi.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _usersRepo;
        private readonly IPasswordHasher<User> _passwordHasher;

        public UserService(IUserRepository usersRepo, IPasswordHasher<User> passwordHasher)
        {
            _usersRepo = usersRepo;
            _passwordHasher = passwordHasher;
        }

        // Register a new user
        public async Task<User> RegisterAsync(AuthDTOs.RegisterRequest request)
        {
            var user = new User
            {
                Name = request.DisplayName,
                Email = request.Email
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            // Save to database first → EF Core sets user.Id
            await _usersRepo.AddAsync(user);
            await _usersRepo.SaveChangesAsync();

            Console.WriteLine($"[DEBUG] Registered user Id: {user.Id}");

            return user;
        }

        // Login existing user
        public async Task<User> LoginAsync(AuthDTOs.LoginRequest request)
        {
            // Find user by email
            var user = await _usersRepo.GetByEmailAsync(request.Email);
            if (user == null) return null;

            // Verify password
            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            return result == PasswordVerificationResult.Success ? user : null;
        }

        // Get user by id
        public async Task<User> GetByIdAsync(int id)
        {
            return await _usersRepo.GetByIdAsync(id);
        }

        // Get user by email
        public async Task<User> GetByEmailAsync(string email)
        {
            return await _usersRepo.GetByEmailAsync(email);
        }

        // Update user profile
        public async Task<User> UpdateUserProfileAsync(int userId, AuthDTOs.UpdateProfileRequest request)
        {
            var user = await _usersRepo.GetByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found.");

            // Check if email is already taken by another user
            var existingUser = await _usersRepo.GetByEmailAsync(request.Email);
            if (existingUser != null && existingUser.Id != userId)
                throw new ArgumentException("Email is already taken.");

            // Update user properties
            user.Name = request.DisplayName;
            user.Email = request.Email;

            await _usersRepo.SaveChangesAsync();
            return user;
        }

        // Change password
        public async Task<bool> ChangePasswordAsync(int userId, AuthDTOs.ChangePasswordRequest request)
        {
            var user = await _usersRepo.GetByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found.");

            // Verify current password
            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
            if (result != PasswordVerificationResult.Success)
                return false;

            // Hash and set new password
            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            await _usersRepo.SaveChangesAsync();

            return true;
        }
    }
}