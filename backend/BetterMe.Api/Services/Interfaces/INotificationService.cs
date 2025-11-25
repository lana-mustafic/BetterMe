using BetterMe.Api.Models;

namespace BetterMe.Api.Services.Interfaces
{
    public interface INotificationService
    {
        Task SendBrowserNotificationAsync(TaskReminder reminder, TodoTask task);
        Task SendNotificationAsync(TaskReminder reminder, TodoTask task, User user);
    }
}

