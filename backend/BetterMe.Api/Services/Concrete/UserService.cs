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

        public UserService(
            IUserRepository usersRepo,
            IPasswordHasher<User> passwordHasher)
        {
            _usersRepo = usersRepo;
            _passwordHasher = passwordHasher;
        }

        // Register a new user - no email verification
        public async Task<User> RegisterAsync(AuthDTOs.RegisterRequest request)
        {
            var existingUser = await _usersRepo.GetByEmailAsync(request.Email);
            if (existingUser != null)
                throw new ArgumentException("Email is already registered.");

            var user = new User
            {
                Name = request.DisplayName,
                Email = request.Email,
                IsEmailVerified = true, // Auto-verify
                EmailVerificationToken = null, // No token needed
                EmailVerificationTokenExpires = null
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            await _usersRepo.AddAsync(user);
            await _usersRepo.SaveChangesAsync();

            return user;
        }

        // Login existing user - no verification check
        public async Task<User> LoginAsync(AuthDTOs.LoginRequest request)
        {
            var user = await _usersRepo.GetByEmailAsync(request.Email);
            if (user == null) return null;

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (result != PasswordVerificationResult.Success)
                return null;

            return user;
        }

        // Remove email verification methods
        // - Remove VerifyEmailAsync
        // - Remove GenerateNewVerificationTokenAsync

        // Keep other methods...
        public async Task<User> GetByIdAsync(int id) =>
            await _usersRepo.GetByIdAsync(id);

        public async Task<User> GetByEmailAsync(string email) =>
            await _usersRepo.GetByEmailAsync(email);

        public async Task<User?> GetUserByEmailAsync(string email) =>
            await _usersRepo.GetByEmailAsync(email);

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

        // Add this method for updating user
        public async Task<bool> UpdateUserAsync(User user)
        {
            await _usersRepo.SaveChangesAsync();
            return true;
        }
    }
}