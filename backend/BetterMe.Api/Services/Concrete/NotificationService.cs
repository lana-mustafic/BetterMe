using BetterMe.Api.Data;
using BetterMe.Api.Models;
using BetterMe.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Services.Concrete
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(AppDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SendNotificationAsync(TaskReminder reminder, TodoTask task, User user)
        {
            try
            {
                // Check user notification settings
                var settings = await _context.UserNotificationSettings
                    .FirstOrDefaultAsync(s => s.UserId == user.Id);

                if (settings == null || !settings.EnableReminders)
                {
                    _logger.LogInformation($"Reminders disabled for user {user.Id}");
                    return;
                }

                // Check quiet hours
                if (IsQuietHours(settings))
                {
                    _logger.LogInformation($"Quiet hours active for user {user.Id}");
                    return;
                }

                // Check active days
                if (!IsActiveDay(settings))
                {
                    _logger.LogInformation($"Not an active day for user {user.Id}");
                    return;
                }

                // Create notification record
                var notification = new Notification
                {
                    UserId = user.Id,
                    TaskId = task.Id,
                    ReminderId = reminder.Id,
                    Title = $"Reminder: {task.Title}",
                    Message = reminder.CustomMessage ?? $"Don't forget: {task.Title}",
                    Type = "reminder",
                    ActionUrl = $"/tasks/{task.Id}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);

                // Send browser notification
                if (settings?.EnableBrowserNotifications ?? true)
                {
                    await SendBrowserNotificationAsync(reminder, task);
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending notification for reminder {reminder.Id}");
                throw;
            }
        }

        public async Task SendBrowserNotificationAsync(TaskReminder reminder, TodoTask task)
        {
            // Browser notifications are handled by the frontend via SignalR or polling
            // This method creates the notification record which the frontend will pick up
            _logger.LogInformation($"Browser notification queued for task {task.Id}");
            await Task.CompletedTask;
        }

        private bool IsQuietHours(UserNotificationSettings settings)
        {
            if (!settings.QuietHoursStart.HasValue || !settings.QuietHoursEnd.HasValue)
                return false;

            var now = DateTime.UtcNow.TimeOfDay;
            var start = settings.QuietHoursStart.Value.ToTimeSpan();
            var end = settings.QuietHoursEnd.Value.ToTimeSpan();

            if (start < end)
            {
                return now >= start && now <= end;
            }
            else
            {
                // Handles overnight quiet hours (e.g., 22:00 - 08:00)
                return now >= start || now <= end;
            }
        }

        private bool IsActiveDay(UserNotificationSettings settings)
        {
            if (string.IsNullOrWhiteSpace(settings.ActiveDays))
                return true;

            var currentDay = (int)DateTime.UtcNow.DayOfWeek;
            var activeDays = settings.ActiveDays.Split(',')
                .Select(d => int.TryParse(d.Trim(), out var day) ? day : -1)
                .Where(d => d >= 0 && d <= 6)
                .ToList();

            return activeDays.Contains(currentDay);
        }
    }
}
