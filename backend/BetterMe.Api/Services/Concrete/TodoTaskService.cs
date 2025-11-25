using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Models;
using BetterMe.Api.Repositories.Interfaces;
using BetterMe.Api.Services.Interfaces;
using BetterMe.Api.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BetterMe.Api.Services
{
    public class TodoTaskService : ITodoTaskService
    {
        private readonly ITodoTasksRepository _tasksRepo;
        private readonly ITagRepository _tagRepo;
        private readonly AppDbContext _context;

        public TodoTaskService(
            ITodoTasksRepository tasksRepo,
            ITagRepository tagRepo,
            AppDbContext context)
        {
            _tasksRepo = tasksRepo;
            _tagRepo = tagRepo;
            _context = context;
        }

        public async Task<TodoTask> CreateTaskAsync(CreateTaskRequest request, int userId)
        {
            // Validate parent task if provided
            if (request.ParentTaskId.HasValue)
            {
                var parentTask = await _tasksRepo.GetByIdAsync(request.ParentTaskId.Value);
                if (parentTask == null || parentTask.UserId != userId)
                    throw new InvalidOperationException("Parent task not found or access denied");
            }

            var task = new TodoTask
            {
                Title = request.Title,
                Description = request.Description,
                DueDate = request.DueDate?.ToUniversalTime(), // ✅ Ensure UTC
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
                RecurrenceEndDate = request.RecurrenceEndDate?.ToUniversalTime(), // ✅ Ensure UTC
                NextDueDate = request.DueDate?.ToUniversalTime(), // ✅ Ensure UTC
                CompletedInstances = new List<string>(),
                OriginalTaskId = null,
                TaskTags = new List<TaskTag>(),
                IsInMyDay = request.IsInMyDay,
                AddedToMyDayAt = request.IsInMyDay ? DateTime.UtcNow : null,
                ParentTaskId = request.ParentTaskId
            };

            await _tasksRepo.AddAsync(task);
            await _tasksRepo.SaveChangesAsync();

            // Create subtasks if provided
            if (request.Subtasks != null && request.Subtasks.Count > 0)
            {
                foreach (var subtaskRequest in request.Subtasks)
                {
                    var subtask = new TodoTask
                    {
                        Title = subtaskRequest.Title,
                        Description = subtaskRequest.Description,
                        DueDate = subtaskRequest.DueDate?.ToUniversalTime(),
                        Priority = subtaskRequest.Priority,
                        Category = task.Category, // Inherit category from parent
                        UserId = userId,
                        ParentTaskId = task.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Completed = false,
                        TaskTags = new List<TaskTag>()
                    };
                    await _tasksRepo.AddAsync(subtask);
                }
                await _tasksRepo.SaveChangesAsync();
            }

            // Create dependencies if provided
            if (request.DependsOnTaskIds != null && request.DependsOnTaskIds.Count > 0)
            {
                foreach (var dependsOnTaskId in request.DependsOnTaskIds)
                {
                    var dependencyTask = await _tasksRepo.GetByIdAsync(dependsOnTaskId);
                    if (dependencyTask == null || dependencyTask.UserId != userId)
                        throw new InvalidOperationException($"Dependency task {dependsOnTaskId} not found or access denied");

                    // Prevent circular dependencies
                    if (dependsOnTaskId == task.Id)
                        throw new InvalidOperationException("Task cannot depend on itself");

                    var dependency = new TaskDependency
                    {
                        TaskId = task.Id,
                        DependsOnTaskId = dependsOnTaskId,
                        DependencyType = "blocks",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.TaskDependencies.Add(dependency);
                }
                await _context.SaveChangesAsync();
            }

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

            // ✅ FIXED: DueDate is now DateTime?, no parsing needed
            if (request.DueDate.HasValue)
                task.DueDate = request.DueDate.Value.ToUniversalTime();

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
                    // Check if all dependencies are completed
                    var dependencies = await _context.TaskDependencies
                        .Include(td => td.DependsOnTask)
                        .Where(td => td.TaskId == task.Id)
                        .ToListAsync();

                    var incompleteDependencies = dependencies
                        .Where(td => !td.DependsOnTask.Completed)
                        .ToList();

                    if (incompleteDependencies.Any())
                    {
                        var blockingTasks = incompleteDependencies
                            .Select(td => td.DependsOnTask.Title)
                            .ToList();
                        throw new InvalidOperationException(
                            $"Cannot complete task. The following tasks must be completed first: {string.Join(", ", blockingTasks)}");
                    }

                    // Check if all subtasks are completed (optional - can be configured)
                    var subtasks = await _context.TodoTasks
                        .Where(t => t.ParentTaskId == task.Id)
                        .ToListAsync();

                    var incompleteSubtasks = subtasks.Where(t => !t.Completed).ToList();
                    if (incompleteSubtasks.Any())
                    {
                        // Optionally warn but don't block - or make it configurable
                        // For now, we'll allow completion even if subtasks aren't done
                    }

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
                task.RecurrenceEndDate = request.RecurrenceEndDate.Value.ToUniversalTime(); // ✅ Ensure UTC

            if (request.CompletedInstances != null)
                task.CompletedInstances = request.CompletedInstances;

            // Update My Day status
            if (request.IsInMyDay.HasValue)
            {
                task.IsInMyDay = request.IsInMyDay.Value;
                task.AddedToMyDayAt = request.IsInMyDay.Value ? DateTime.UtcNow : null;
            }

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
                    DueDate = task.NextDueDate?.ToUniversalTime(), // ✅ Ensure UTC
                    Priority = task.Priority,
                    Category = task.Category,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Completed = false,
                    CompletedAt = null,
                    IsRecurring = true,
                    RecurrencePattern = task.RecurrencePattern,
                    RecurrenceInterval = task.RecurrenceInterval,
                    RecurrenceEndDate = task.RecurrenceEndDate?.ToUniversalTime(), // ✅ Ensure UTC
                    OriginalTaskId = task.OriginalTaskId ?? task.Id,
                    NextDueDate = CalculateNextDueDate(task.RecurrencePattern, task.RecurrenceInterval, task.NextDueDate ?? now)?.ToUniversalTime(), // ✅ Ensure UTC
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

        public async Task<(List<TodoTask> Tasks, int TotalCount)> SearchTasksAsync(SearchTasksRequest request, int userId)
        {
            var query = _context.TodoTasks
                .Include(t => t.TaskTags)
                    .ThenInclude(tt => tt.Tag)
                .Where(t => t.UserId == userId)
                .AsQueryable();

            // Search term (full-text search across title, description, and tags)
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchLower = request.SearchTerm.ToLower();
                query = query.Where(t =>
                    t.Title.ToLower().Contains(searchLower) ||
                    (t.Description != null && t.Description.ToLower().Contains(searchLower)) ||
                    t.TaskTags.Any(tt => tt.Tag.Name.ToLower().Contains(searchLower))
                );
            }

            // Category filter
            if (!string.IsNullOrWhiteSpace(request.Category))
            {
                query = query.Where(t => t.Category == request.Category);
            }

            // Completion status
            if (request.Completed.HasValue)
            {
                query = query.Where(t => t.Completed == request.Completed.Value);
            }

            // Priority filter
            if (request.Priority.HasValue)
            {
                query = query.Where(t => t.Priority == request.Priority.Value);
            }

            // Tags filter (AND/OR logic)
            if (request.Tags != null && request.Tags.Any())
            {
                if (request.TagLogic?.ToUpper() == "AND")
                {
                    // All tags must be present
                    foreach (var tagName in request.Tags)
                    {
                        var tagNameLower = tagName.ToLower();
                        query = query.Where(t => t.TaskTags.Any(tt => tt.Tag.Name.ToLower() == tagNameLower));
                    }
                }
                else
                {
                    // At least one tag must be present (OR)
                    query = query.Where(t => t.TaskTags.Any(tt => request.Tags.Contains(tt.Tag.Name)));
                }
            }

            // Due date range
            if (request.DueDateFrom.HasValue)
            {
                query = query.Where(t => t.DueDate.HasValue && t.DueDate >= request.DueDateFrom.Value);
            }

            if (request.DueDateTo.HasValue)
            {
                query = query.Where(t => t.DueDate.HasValue && t.DueDate <= request.DueDateTo.Value);
            }

            // Created date range
            if (request.CreatedFrom.HasValue)
            {
                query = query.Where(t => t.CreatedAt >= request.CreatedFrom.Value);
            }

            if (request.CreatedTo.HasValue)
            {
                query = query.Where(t => t.CreatedAt <= request.CreatedTo.Value);
            }

            // Has due date filter
            if (request.HasDueDate.HasValue)
            {
                if (request.HasDueDate.Value)
                {
                    query = query.Where(t => t.DueDate.HasValue);
                }
                else
                {
                    query = query.Where(t => !t.DueDate.HasValue);
                }
            }

            // Overdue filter
            if (request.IsOverdue == true)
            {
                var now = DateTime.UtcNow;
                query = query.Where(t => t.DueDate.HasValue && 
                    t.DueDate.Value < now && 
                    !t.Completed);
            }

            // Due today filter
            if (request.IsDueToday == true)
            {
                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);
                query = query.Where(t => t.DueDate.HasValue && 
                    t.DueDate.Value >= today && 
                    t.DueDate.Value < tomorrow);
            }

            // Recurring filter
            if (request.IsRecurring.HasValue)
            {
                query = query.Where(t => t.IsRecurring == request.IsRecurring.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Sorting
            query = request.SortBy?.ToLower() switch
            {
                "duedate" => request.SortDirection?.ToLower() == "asc"
                    ? query.OrderBy(t => t.DueDate ?? DateTime.MaxValue)
                    : query.OrderByDescending(t => t.DueDate ?? DateTime.MinValue),
                "priority" => request.SortDirection?.ToLower() == "asc"
                    ? query.OrderBy(t => t.Priority)
                    : query.OrderByDescending(t => t.Priority),
                "title" => request.SortDirection?.ToLower() == "asc"
                    ? query.OrderBy(t => t.Title)
                    : query.OrderByDescending(t => t.Title),
                _ => request.SortDirection?.ToLower() == "asc"
                    ? query.OrderBy(t => t.CreatedAt)
                    : query.OrderByDescending(t => t.CreatedAt)
            };

            // Pagination
            var page = request.Page ?? 1;
            var pageSize = request.PageSize ?? 100;
            var skip = (page - 1) * pageSize;

            var tasks = await query
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            return (tasks, totalCount);
        }

        public async Task<bool> AddTaskToMyDayAsync(int taskId, int userId)
        {
            var task = await _tasksRepo.GetByIdAsync(taskId);
            if (task == null || task.UserId != userId)
                return false;

            task.IsInMyDay = true;
            task.AddedToMyDayAt = DateTime.UtcNow;
            await _tasksRepo.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveTaskFromMyDayAsync(int taskId, int userId)
        {
            var task = await _tasksRepo.GetByIdAsync(taskId);
            if (task == null || task.UserId != userId)
                return false;

            task.IsInMyDay = false;
            task.AddedToMyDayAt = null;
            await _tasksRepo.SaveChangesAsync();
            return true;
        }

        public async Task<List<TodoTask>> GetMyDayTasksAsync(int userId)
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            return await _context.TodoTasks
                .Where(t => t.UserId == userId && t.IsInMyDay && !t.Completed)
                .OrderBy(t => t.Priority)
                .ThenBy(t => t.DueDate ?? DateTime.MaxValue)
                .ToListAsync();
        }

        public async Task<List<TodoTask>> GetSuggestedTasksForMyDayAsync(int userId)
        {
            var today = DateTime.UtcNow.Date;
            var nextWeek = today.AddDays(7);

            // Get tasks that are:
            // 1. Not already in My Day
            // 2. Not completed
            // 3. Due today or in the next week, OR high priority
            var suggestedTasks = await _context.TodoTasks
                .Where(t => t.UserId == userId 
                    && !t.IsInMyDay 
                    && !t.Completed
                    && (
                        (t.DueDate.HasValue && t.DueDate.Value.Date <= nextWeek) ||
                        t.Priority == 3 // High priority
                    ))
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate ?? DateTime.MaxValue)
                .Take(10)
                .ToListAsync();

            return suggestedTasks;
        }
    }
}