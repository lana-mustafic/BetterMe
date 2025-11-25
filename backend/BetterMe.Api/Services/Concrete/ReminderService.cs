using BetterMe.Api.Data;
using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Models;
using BetterMe.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Services.Concrete
{
    public class ReminderService : IReminderService
    {
        private readonly AppDbContext _context;

        public ReminderService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TaskReminder> CreateReminderAsync(CreateReminderRequest request, int userId)
        {
            // Verify task belongs to user
            var task = await _context.TodoTasks.FirstOrDefaultAsync(t => t.Id == request.TaskId && t.UserId == userId);
            if (task == null)
                throw new InvalidOperationException("Task not found or access denied");

            // Calculate RemindAt based on reminder type
            DateTime remindAt = CalculateRemindAt(request, task);

            var reminder = new TaskReminder
            {
                TaskId = request.TaskId,
                UserId = userId,
                RemindAt = remindAt,
                ReminderType = request.ReminderType,
                Offset = request.Offset,
                NotificationMethod = request.NotificationMethod,
                CustomMessage = request.CustomMessage,
                IsActive = true,
                IsSent = false
            };

            _context.TaskReminders.Add(reminder);
            await _context.SaveChangesAsync();

            return reminder;
        }

        private DateTime CalculateRemindAt(CreateReminderRequest request, TodoTask task)
        {
            switch (request.ReminderType.ToLower())
            {
                case "at_due":
                    if (!task.DueDate.HasValue)
                        throw new InvalidOperationException("Task must have a due date for 'at_due' reminder");
                    return task.DueDate.Value;

                case "before_due":
                    if (!task.DueDate.HasValue)
                        throw new InvalidOperationException("Task must have a due date for 'before_due' reminder");
                    return CalculateBeforeDueTime(task.DueDate.Value, request.Offset);

                case "custom":
                    if (!request.CustomDateTime.HasValue)
                        throw new InvalidOperationException("CustomDateTime is required for 'custom' reminder");
                    return request.CustomDateTime.Value.ToUniversalTime();

                default:
                    throw new InvalidOperationException($"Unknown reminder type: {request.ReminderType}");
            }
        }

        private DateTime CalculateBeforeDueTime(DateTime dueDate, string? offset)
        {
            if (string.IsNullOrWhiteSpace(offset))
                offset = "1 hour"; // Default

            var offsetLower = offset.ToLower().Trim();
            var dueDateUtc = dueDate.ToUniversalTime();

            // Parse offset like "1 hour", "30 minutes", "1 day", "2 days", etc.
            if (offsetLower.Contains("minute"))
            {
                var minutes = ExtractNumber(offsetLower);
                return dueDateUtc.AddMinutes(-minutes);
            }
            else if (offsetLower.Contains("hour"))
            {
                var hours = ExtractNumber(offsetLower);
                return dueDateUtc.AddHours(-hours);
            }
            else if (offsetLower.Contains("day"))
            {
                var days = ExtractNumber(offsetLower);
                return dueDateUtc.AddDays(-days);
            }
            else if (offsetLower.Contains("week"))
            {
                var weeks = ExtractNumber(offsetLower);
                return dueDateUtc.AddDays(-weeks * 7);
            }

            // Default to 1 hour if parsing fails
            return dueDateUtc.AddHours(-1);
        }

        private int ExtractNumber(string input)
        {
            var parts = input.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length > 0 && int.TryParse(parts[0], out var number))
                return number;
            return 1; // Default
        }

        public async Task<bool> DeleteReminderAsync(int reminderId, int userId)
        {
            var reminder = await _context.TaskReminders
                .FirstOrDefaultAsync(r => r.Id == reminderId && r.UserId == userId);

            if (reminder == null)
                return false;

            _context.TaskReminders.Remove(reminder);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<TaskReminder>> GetTaskRemindersAsync(int taskId, int userId)
        {
            return await _context.TaskReminders
                .Where(r => r.TaskId == taskId && r.UserId == userId)
                .OrderBy(r => r.RemindAt)
                .ToListAsync();
        }

        public async Task<List<TaskReminder>> GetUserRemindersAsync(int userId)
        {
            return await _context.TaskReminders
                .Where(r => r.UserId == userId && r.IsActive)
                .Include(r => r.Task)
                .OrderBy(r => r.RemindAt)
                .ToListAsync();
        }

        public async Task<List<TaskReminder>> GetDueRemindersAsync()
        {
            var now = DateTime.UtcNow;
            var fiveMinutesFromNow = now.AddMinutes(5);

            return await _context.TaskReminders
                .Where(r => r.IsActive 
                    && !r.IsSent 
                    && r.RemindAt <= fiveMinutesFromNow 
                    && r.RemindAt >= now.AddMinutes(-1)) // Allow 1 minute grace period
                .Include(r => r.Task)
                .Include(r => r.User)
                .ToListAsync();
        }

        public async Task<bool> MarkReminderAsSentAsync(int reminderId)
        {
            var reminder = await _context.TaskReminders.FindAsync(reminderId);
            if (reminder == null)
                return false;

            reminder.IsSent = true;
            reminder.SentAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleReminderActiveAsync(int reminderId, int userId)
        {
            var reminder = await _context.TaskReminders
                .FirstOrDefaultAsync(r => r.Id == reminderId && r.UserId == userId);

            if (reminder == null)
                return false;

            reminder.IsActive = !reminder.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

