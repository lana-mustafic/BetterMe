using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Models;

namespace BetterMe.Api.Services.Interfaces
{
    public interface IReminderService
    {
        Task<TaskReminder> CreateReminderAsync(CreateReminderRequest request, int userId);
        Task<bool> DeleteReminderAsync(int reminderId, int userId);
        Task<List<TaskReminder>> GetTaskRemindersAsync(int taskId, int userId);
        Task<List<TaskReminder>> GetUserRemindersAsync(int userId);
        Task<List<TaskReminder>> GetDueRemindersAsync();
        Task<bool> MarkReminderAsSentAsync(int reminderId);
        Task<bool> ToggleReminderActiveAsync(int reminderId, int userId);
    }
}

