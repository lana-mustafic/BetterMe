using Microsoft.AspNetCore.Identity;
using BetterMe.Api.Models;
using BetterMe.Api.Repositories.Interfaces;
using BetterMe.Api.Services.Interfaces;
using AuthDTOs = BetterMe.Api.DTOs.Auth;
using System;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using System.Linq;
using BetterMe.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _usersRepo;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly AppDbContext _context;

        public UserService(
            IUserRepository usersRepo,
            IPasswordHasher<User> passwordHasher,
            AppDbContext context)
        {
            _usersRepo = usersRepo;
            _passwordHasher = passwordHasher;
            _context = context;
        }

        public async Task<User> RegisterAsync(AuthDTOs.RegisterRequest request)
        {
            var existingUser = await _usersRepo.GetByEmailAsync(request.Email);
            if (existingUser != null)
                throw new ArgumentException("Email is already registered.");

            // Additional business logic validation
            ValidatePasswordStrength(request.Password);

            var user = new User
            {
                Name = request.DisplayName,
                Email = request.Email,
                IsEmailVerified = true,
                EmailVerificationToken = null,
                EmailVerificationTokenExpires = null
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            await _usersRepo.AddAsync(user);
            await _usersRepo.SaveChangesAsync();

            return user;
        }

        public async Task<User> LoginAsync(AuthDTOs.LoginRequest request)
        {
            var user = await _usersRepo.GetByEmailAsync(request.Email);
            if (user == null) return null;

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (result != PasswordVerificationResult.Success)
                return null;

            return user;
        }

        private void ValidatePasswordStrength(string password)
        {
            if (password.Length < 6)
                throw new ArgumentException("Password must be at least 6 characters long.");

            if (!Regex.IsMatch(password, @"[a-zA-Z]"))
                throw new ArgumentException("Password must contain at least one letter.");

            if (!Regex.IsMatch(password, @"[0-9]"))
                throw new ArgumentException("Password must contain at least one number.");

            if (!Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]"))
                throw new ArgumentException("Password must contain at least one symbol.");
        }

        // ... rest of your existing methods
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

            // Validate new password strength
            ValidatePasswordStrength(request.NewPassword);

            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            await _usersRepo.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateUserAsync(User user)
        {
            await _usersRepo.SaveChangesAsync();
            return true;
        }

        public async Task<List<User>> SearchUsersAsync(string query)
        {
            var lowerQuery = query.ToLower();
            return await _context.Users
                .Where(u => u.Email.ToLower().Contains(lowerQuery) || 
                           u.Name.ToLower().Contains(lowerQuery))
                .Take(10) // Limit results
                .ToListAsync();
        }
    }
}