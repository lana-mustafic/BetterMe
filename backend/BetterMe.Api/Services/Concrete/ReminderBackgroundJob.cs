using BetterMe.Api.Data;
using BetterMe.Api.Services.Interfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Services.Concrete
{
    public class ReminderBackgroundJob
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReminderBackgroundJob> _logger;

        public ReminderBackgroundJob(IServiceProvider serviceProvider, ILogger<ReminderBackgroundJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ProcessDueReminders()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var reminderService = scope.ServiceProvider.GetRequiredService<IReminderService>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            try
            {
                var dueReminders = await reminderService.GetDueRemindersAsync();

                _logger.LogInformation($"Processing {dueReminders.Count} due reminders");

                foreach (var reminder in dueReminders)
                {
                    try
                    {
                        if (reminder.Task == null || reminder.User == null)
                        {
                            _logger.LogWarning($"Reminder {reminder.Id} has null task or user");
                            continue;
                        }

                        // Skip if task is already completed
                        if (reminder.Task.Completed)
                        {
                            await reminderService.MarkReminderAsSentAsync(reminder.Id);
                            continue;
                        }

                        // Send notification
                        await notificationService.SendNotificationAsync(reminder, reminder.Task, reminder.User);

                        // Mark as sent
                        await reminderService.MarkReminderAsSentAsync(reminder.Id);

                        _logger.LogInformation($"Processed reminder {reminder.Id} for task {reminder.Task.Id}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error processing reminder {reminder.Id}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ProcessDueReminders job");
                throw;
            }
        }
    }
}
