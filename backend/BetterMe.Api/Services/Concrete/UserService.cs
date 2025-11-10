using Microsoft.AspNetCore.Identity;
using BetterMe.Api.Models;
using BetterMe.Api.Repositories.Interfaces;
using BetterMe.Api.Services.Interfaces;
using AuthDTOs = BetterMe.Api.DTOs.Auth;
using System;
using System.Threading.Tasks;

namespace BetterMe.Api.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _usersRepo;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IEmailService _emailService;

        public UserService(
            IUserRepository usersRepo,
            IPasswordHasher<User> passwordHasher,
            IEmailService emailService)
        {
            _usersRepo = usersRepo;
            _passwordHasher = passwordHasher;
            _emailService = emailService;
        }

        // Register a new user + send verification email
        public async Task<User> RegisterAsync(AuthDTOs.RegisterRequest request)
        {
            var existingUser = await _usersRepo.GetByEmailAsync(request.Email);
            if (existingUser != null)
                throw new ArgumentException("Email is already registered.");

            var user = new User
            {
                Name = request.DisplayName,
                Email = request.Email,
                IsEmailVerified = false,
                EmailVerificationToken = Guid.NewGuid().ToString(),
                EmailVerificationTokenExpires = DateTime.UtcNow.AddHours(24)
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            await _usersRepo.AddAsync(user);
            await _usersRepo.SaveChangesAsync();

            // Send verification email
            await _emailService.SendVerificationEmailAsync(
                user.Email,
                user.EmailVerificationToken!,
                user.Name
            );

            return user;
        }

        // Login existing user (with auto-verification for testing)
        public async Task<User> LoginAsync(AuthDTOs.LoginRequest request)
        {
            var user = await _usersRepo.GetByEmailAsync(request.Email);
            if (user == null) return null;

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (result != PasswordVerificationResult.Success)
                return null;

            // ✅ TEMPORARY: Auto-verify users for testing
            if (!user.IsEmailVerified)
            {
                user.IsEmailVerified = true;
                user.EmailVerificationToken = null;
                user.EmailVerificationTokenExpires = null;
                await _usersRepo.SaveChangesAsync();
                Console.WriteLine($"✅ Auto-verified user during login: {user.Email}");
            }

            return user;
        }

        public async Task<User> GetByIdAsync(int id) =>
            await _usersRepo.GetByIdAsync(id);

        public async Task<User> GetByEmailAsync(string email) =>
            await _usersRepo.GetByEmailAsync(email);

        // ADD THIS METHOD - Same as GetByEmailAsync but with nullable return type
        public async Task<User?> GetUserByEmailAsync(string email) =>
            await _usersRepo.GetByEmailAsync(email);

        // Update user profile
        public async Task<User> UpdateUserProfileAsync(int userId, AuthDTOs.UpdateProfileRequest request)
        {
            var user = await _usersRepo.GetByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found.");

            var existingUser = await _usersRepo.GetByEmailAsync(request.Email);
            if (existingUser != null && existingUser.Id != userId)
                throw new ArgumentException("Email is already taken.");

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

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
            if (result != PasswordVerificationResult.Success)
                return false;

            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            await _usersRepo.SaveChangesAsync();
            return true;
        }

        // Verify Email
        public async Task<bool> VerifyEmailAsync(string email, string token)
        {
            var user = await _usersRepo.GetByEmailAsync(email);
            if (user == null) return false;

            if (user.IsEmailVerified) return true;

            if (user.EmailVerificationToken != token ||
                user.EmailVerificationTokenExpires < DateTime.UtcNow)
                return false;

            user.IsEmailVerified = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationTokenExpires = null;

            await _usersRepo.SaveChangesAsync();
            return true;
        }

        
        public async Task<string> GenerateNewVerificationTokenAsync(string email)
        {
            var user = await _usersRepo.GetByEmailAsync(email);
            if (user == null)
                throw new ArgumentException("User not found.");

            // Generate new token
            var newToken = Guid.NewGuid().ToString();
            user.EmailVerificationToken = newToken;
            user.EmailVerificationTokenExpires = DateTime.UtcNow.AddHours(24);

            await _usersRepo.SaveChangesAsync();
            return newToken;
        }
    }
}