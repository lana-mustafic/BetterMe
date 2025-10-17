using ToDoApi.DTOs.Task;
using ToDoApi.Models;
using ToDoApi.Repositories.Interfaces;
using ToDoApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ToDoApi.Services
{
    public class TodoTaskService : ITodoTaskService
    {
        private readonly ITodoTasksRepository _tasksRepo;
        private readonly ITagRepository _tagRepo;

        public TodoTaskService(
            ITodoTasksRepository tasksRepo,
            ITagRepository tagRepo)
        {
            _tasksRepo = tasksRepo;
            _tagRepo = tagRepo;
        }

        public async Task<TodoTask> CreateTaskAsync(CreateTaskRequest request, int userId)
        {
            var task = new TodoTask
            {
                Title = request.Title,
                Description = request.Description,
                DueDate = request.DueDate,
                Priority = request.Priority,
                Category = request.Category,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Completed = false,
                CompletedAt = null,
                // Recurrence fields
                IsRecurring = request.IsRecurring,
                RecurrencePattern = request.RecurrencePattern ?? "none",
                RecurrenceInterval = request.RecurrenceInterval,
                RecurrenceEndDate = request.RecurrenceEndDate,
                NextDueDate = request.DueDate,
                CompletedInstances = new List<string>(),
                OriginalTaskId = null,
                TaskTags = new List<TaskTag>()
            };

            await _tasksRepo.AddAsync(task);
            await _tasksRepo.SaveChangesAsync();

            if (request.Tags != null && request.Tags.Count > 0)
            {
                await AssignTagsToTaskAsync(task, request.Tags, userId);
                await _tasksRepo.SaveChangesAsync();
            }

            return task;
        }

        public async Task<List<TodoTask>> GetAllTasksByUserAsync(int userId)
        {
            return await _tasksRepo.GetAllByUserAsync(userId);
        }

        public async Task<TodoTask> GetByIdAsync(int id)
        {
            return await _tasksRepo.GetByIdAsync(id);
        }

        public async Task<TodoTask> UpdateTaskAsync(int id, UpdateTaskRequest request, int userId)
        {
            // FIX: Use GetByIdAsync instead of GetByIdWithTagsAsync to avoid potential null issues
            var task = await _tasksRepo.GetByIdAsync(id);
            if (task == null || task.UserId != userId)
            {
                Console.WriteLine($"[DEBUG] Task not found or user mismatch. Task: {task != null}, UserId match: {task?.UserId == userId}");
                return null;
            }

            // Update basic fields
            if (!string.IsNullOrEmpty(request.Title))
                task.Title = request.Title;

            if (request.Description != null)
                task.Description = request.Description;

            // FIX: Convert string to DateTime
            if (request.DueDate != null)
                task.DueDate = DateTime.Parse(request.DueDate);

            if (request.Priority.HasValue)
                task.Priority = request.Priority.Value;

            if (request.Completed.HasValue)
                task.Completed = request.Completed.Value;

            if (request.Category != null)
            {
                task.Category = request.Category;
            }

            // Handle completion
            if (request.Completed.HasValue)
            {
                if (request.Completed.Value && !task.Completed)
                {
                    task.CompletedAt = DateTime.UtcNow;

                    // If this is a recurring task and it's being marked complete, handle instance tracking
                    if (task.IsRecurring)
                    {
                        await CompleteRecurringInstanceAsync(task.Id, userId, DateTime.UtcNow);
                    }
                }
                else if (!request.Completed.Value && task.Completed)
                {
                    task.CompletedAt = null;
                }
            }

            // Update recurrence fields
            if (request.IsRecurring.HasValue)
                task.IsRecurring = request.IsRecurring.Value;

            if (!string.IsNullOrEmpty(request.RecurrencePattern))
                task.RecurrencePattern = request.RecurrencePattern;

            if (request.RecurrenceInterval.HasValue)
                task.RecurrenceInterval = request.RecurrenceInterval.Value;

            if (request.RecurrenceEndDate.HasValue)
                task.RecurrenceEndDate = request.RecurrenceEndDate.Value;

            if (request.CompletedInstances != null)
                task.CompletedInstances = request.CompletedInstances;

            task.UpdatedAt = DateTime.UtcNow;

            // FIX: Only update tags if they are provided and the repository supports it
            if (request.Tags != null)
            {
                try
                {
                    await UpdateTaskTagsAsync(task, request.Tags, userId);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DEBUG] Error updating tags: {ex.Message}");
                    // Continue without tags if there's an error
                }
            }

            await _tasksRepo.SaveChangesAsync();
            return task;
        }

        public async Task<bool> DeleteTaskAsync(int id, int userId)
        {
            var task = await _tasksRepo.GetByIdAsync(id);
            if (task == null || task.UserId != userId)
            {
                Console.WriteLine($"[DEBUG] Delete failed - Task not found or user mismatch");
                return false;
            }

            _tasksRepo.Remove(task);
            await _tasksRepo.SaveChangesAsync();
            return true;
        }

        public async Task<TodoTask> CompleteRecurringInstanceAsync(int taskId, int userId, DateTime completionDate)
        {
            var task = await _tasksRepo.GetByIdAsync(taskId);
            if (task == null || task.UserId != userId || !task.IsRecurring) return null;

            var dateString = completionDate.ToString("yyyy-MM-dd");
            var completedInstances = task.CompletedInstances ?? new List<string>();

            if (!completedInstances.Contains(dateString))
            {
                completedInstances.Add(dateString);
                task.CompletedInstances = completedInstances;

                // Calculate next due date
                task.NextDueDate = CalculateNextDueDate(task.RecurrencePattern, task.RecurrenceInterval, completionDate);

                await _tasksRepo.SaveChangesAsync();
            }

            return task;
        }

        public async Task<List<TodoTask>> GenerateNextRecurringInstancesAsync()
        {
            var now = DateTime.UtcNow;
            var recurringTasks = await _tasksRepo.GetRecurringTasksDueForGenerationAsync(now);

            var newInstances = new List<TodoTask>();

            foreach (var task in recurringTasks)
            {
                // Only generate new instance if recurrence hasn't ended
                if (task.RecurrenceEndDate.HasValue && task.RecurrenceEndDate.Value < now)
                    continue;

                var newInstance = new TodoTask
                {
                    UserId = task.UserId,
                    Title = task.Title,
                    Description = task.Description,
                    DueDate = task.NextDueDate,
                    Priority = task.Priority,
                    Category = task.Category,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Completed = false,
                    CompletedAt = null,
                    IsRecurring = true,
                    RecurrencePattern = task.RecurrencePattern,
                    RecurrenceInterval = task.RecurrenceInterval,
                    RecurrenceEndDate = task.RecurrenceEndDate,
                    OriginalTaskId = task.OriginalTaskId ?? task.Id,
                    NextDueDate = CalculateNextDueDate(task.RecurrencePattern, task.RecurrenceInterval, task.NextDueDate ?? now),
                    CompletedInstances = new List<string>(),
                    TaskTags = new List<TaskTag>()
                };

                newInstances.Add(newInstance);

                // Update the original task's NextDueDate
                task.NextDueDate = newInstance.NextDueDate;
                task.UpdatedAt = DateTime.UtcNow;
            }

            if (newInstances.Count > 0)
            {
                foreach (var instance in newInstances)
                {
                    await _tasksRepo.AddAsync(instance);
                }
                await _tasksRepo.SaveChangesAsync();
            }

            return newInstances;
        }

        public async Task<int> CalculateHabitStreakAsync(int taskId)
        {
            var task = await _tasksRepo.GetByIdAsync(taskId);
            if (task == null || !task.IsRecurring || task.RecurrencePattern == "none") return 0;

            var completedInstances = task.CompletedInstances ?? new List<string>();
            if (completedInstances.Count == 0) return 0;

            var completedDates = completedInstances
                .Select(d => DateTime.Parse(d))
                .OrderByDescending(d => d)
                .ToList();

            var streak = 0;
            var currentDate = DateTime.UtcNow.Date;

            // Check if today is completed
            var todayStr = currentDate.ToString("yyyy-MM-dd");
            var todayCompleted = completedInstances.Contains(todayStr);

            if (todayCompleted)
            {
                streak = 1;
                currentDate = currentDate.AddDays(-1);
            }

            // Count consecutive days
            foreach (var completedDate in completedDates)
            {
                if (completedDate.Date == currentDate)
                {
                    streak++;
                    currentDate = currentDate.AddDays(-1);
                }
                else if (completedDate.Date < currentDate)
                {
                    // We've found a gap in the streak
                    break;
                }
            }

            return streak;
        }

        public async Task<TaskStatsResponse> GetTaskStatsAsync(int userId)
        {
            var tasks = await _tasksRepo.GetAllByUserAsync(userId);
            var tags = await _tagRepo.GetAllByUserAsync(userId);

            var categoryStats = tasks
                .GroupBy(t => t.Category ?? "Uncategorized")
                .Select(g => new CategoryResponse
                {
                    Name = g.Key,
                    TaskCount = g.Count()
                })
                .ToList();

            var popularTags = tags
                .OrderByDescending(t => t.TaskTags?.Count ?? 0)
                .Take(5)
                .Select(t => new TagResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    CreatedAt = t.CreatedAt,
                    TaskCount = t.TaskTags?.Count ?? 0
                })
                .ToList();

            return new TaskStatsResponse
            {
                TotalTasks = tasks.Count,
                CompletedTasks = tasks.Count(t => t.Completed),
                PendingTasks = tasks.Count(t => !t.Completed),
                Categories = categoryStats,
                PopularTags = popularTags
            };
        }

        // Helper method to calculate next due date
        private DateTime? CalculateNextDueDate(string pattern, int interval, DateTime fromDate)
        {
            return pattern?.ToLower() switch
            {
                "daily" => fromDate.AddDays(interval),
                "weekly" => fromDate.AddDays(interval * 7),
                "monthly" => fromDate.AddMonths(interval),
                "yearly" => fromDate.AddYears(interval),
                _ => null
            };
        }

        private async Task AssignTagsToTaskAsync(TodoTask task, List<string> tagNames, int userId)
        {
            foreach (var tagName in tagNames.Distinct())
            {
                var trimmedName = tagName.Trim();
                if (string.IsNullOrEmpty(trimmedName)) continue;

                var tag = await GetOrCreateTagAsync(trimmedName, userId);

                if (!task.TaskTags.Any(tt => tt.TagId == tag.Id))
                {
                    task.TaskTags.Add(new TaskTag { TodoTaskId = task.Id, TagId = tag.Id });
                }
            }
        }

        private async Task UpdateTaskTagsAsync(TodoTask task, List<string> newTagNames, int userId)
        {
            // Initialize TaskTags if null
            task.TaskTags ??= new List<TaskTag>();

            var currentTagNames = task.TaskTags.Select(tt => tt.Tag?.Name).Where(name => name != null).ToList();
            var tagsToRemove = task.TaskTags
                .Where(tt => !newTagNames.Contains(tt.Tag?.Name))
                .ToList();

            foreach (var tagToRemove in tagsToRemove)
            {
                task.TaskTags.Remove(tagToRemove);
            }

            foreach (var tagName in newTagNames.Distinct())
            {
                var trimmedName = tagName.Trim();
                if (string.IsNullOrEmpty(trimmedName)) continue;

                if (!currentTagNames.Contains(trimmedName))
                {
                    var tag = await GetOrCreateTagAsync(trimmedName, userId);
                    task.TaskTags.Add(new TaskTag { TodoTaskId = task.Id, TagId = tag.Id });
                }
            }
        }

        private async Task<Tag> GetOrCreateTagAsync(string tagName, int userId)
        {
            var existingTag = await _tagRepo.GetByNameAsync(tagName, userId);
            if (existingTag != null)
            {
                return existingTag;
            }

            var newTag = new Tag
            {
                Name = tagName,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _tagRepo.AddAsync(newTag);
            await _tagRepo.SaveChangesAsync();
            return newTag;
        }
    }
}