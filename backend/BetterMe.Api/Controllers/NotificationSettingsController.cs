using BetterMe.Api.Data;
using BetterMe.Api.DTOs.Notification;
using BetterMe.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationSettingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var settings = await _context.UserNotificationSettings
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (settings == null)
            {
                // Create default settings
                settings = new UserNotificationSettings
                {
                    UserId = userId,
                    EnableBrowserNotifications = true,
                    EnableReminders = true,
                    DefaultReminderMinutes = 30,
                    ActiveDays = "0,1,2,3,4,5,6",
                    CreatedAt = DateTime.UtcNow
                };

                _context.UserNotificationSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            var response = new UserNotificationSettingsResponse
            {
                Id = settings.Id,
                UserId = settings.UserId,
                EnableBrowserNotifications = settings.EnableBrowserNotifications,
                EnableReminders = settings.EnableReminders,
                DefaultReminderMinutes = settings.DefaultReminderMinutes,
                QuietHoursStart = settings.QuietHoursStart,
                QuietHoursEnd = settings.QuietHoursEnd,
                ActiveDays = settings.ActiveDays,
                CreatedAt = settings.CreatedAt,
                UpdatedAt = settings.UpdatedAt
            };

            return Ok(response);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] UserNotificationSettingsRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var settings = await _context.UserNotificationSettings
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (settings == null)
            {
                settings = new UserNotificationSettings
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserNotificationSettings.Add(settings);
            }

            if (request.EnableBrowserNotifications.HasValue)
                settings.EnableBrowserNotifications = request.EnableBrowserNotifications.Value;

            if (request.PushSubscriptionJson != null)
                settings.PushSubscriptionJson = request.PushSubscriptionJson;

            if (request.EnableReminders.HasValue)
                settings.EnableReminders = request.EnableReminders.Value;

            if (request.DefaultReminderMinutes.HasValue)
                settings.DefaultReminderMinutes = request.DefaultReminderMinutes.Value;

            if (request.QuietHoursStart.HasValue)
                settings.QuietHoursStart = request.QuietHoursStart.Value;

            if (request.QuietHoursEnd.HasValue)
                settings.QuietHoursEnd = request.QuietHoursEnd.Value;

            if (request.ActiveDays != null)
                settings.ActiveDays = request.ActiveDays;

            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = new UserNotificationSettingsResponse
            {
                Id = settings.Id,
                UserId = settings.UserId,
                EnableBrowserNotifications = settings.EnableBrowserNotifications,
                EnableReminders = settings.EnableReminders,
                DefaultReminderMinutes = settings.DefaultReminderMinutes,
                QuietHoursStart = settings.QuietHoursStart,
                QuietHoursEnd = settings.QuietHoursEnd,
                ActiveDays = settings.ActiveDays,
                CreatedAt = settings.CreatedAt,
                UpdatedAt = settings.UpdatedAt
            };

            return Ok(response);
        }
    }
}

