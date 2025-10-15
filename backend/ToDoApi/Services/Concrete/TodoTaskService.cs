using ToDoApi.DTOs.Task;
using ToDoApi.Models;
using ToDoApi.Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToDoApi.Services.Interfaces;

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
                Completed = false
            };

            await _tasksRepo.AddAsync(task);
            await _tasksRepo.SaveChangesAsync();

            if (request.Tags != null && request.Tags.Any())
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
            var task = await _tasksRepo.GetByIdWithTagsAsync(id);
            if (task == null || task.UserId != userId) return null;

            task.Title = request.Title ?? task.Title;
            task.Description = request.Description ?? task.Description;
            task.DueDate = request.DueDate ?? task.DueDate;
            task.Priority = request.Priority ?? task.Priority;
            task.Completed = request.Completed ?? task.Completed;

            if (request.Category != null)
            {
                task.Category = request.Category;
            }

            if (request.Completed.HasValue)
            {
                if (request.Completed.Value && !task.Completed)
                {
                    task.CompletedAt = DateTime.UtcNow;
                }
                else if (!request.Completed.Value && task.Completed)
                {
                    task.CompletedAt = null;
                }
            }

            task.UpdatedAt = DateTime.UtcNow;

            if (request.Tags != null)
            {
                await UpdateTaskTagsAsync(task, request.Tags, userId);
            }

            await _tasksRepo.SaveChangesAsync();
            return task;
        }

        public async Task<bool> DeleteTaskAsync(int id, int userId)
        {
            var task = await _tasksRepo.GetByIdAsync(id);
            if (task == null || task.UserId != userId) return false;

            _tasksRepo.Remove(task);
            await _tasksRepo.SaveChangesAsync();
            return true;
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
                    // FIXED: Use TodoTaskId instead of TaskId
                    task.TaskTags.Add(new TaskTag { TodoTaskId = task.Id, TagId = tag.Id });
                }
            }
        }

        private async Task UpdateTaskTagsAsync(TodoTask task, List<string> newTagNames, int userId)
        {
            var tagsToRemove = task.TaskTags
                .Where(tt => !newTagNames.Contains(tt.Tag.Name))
                .ToList();

            foreach (var tagToRemove in tagsToRemove)
            {
                task.TaskTags.Remove(tagToRemove);
            }

            foreach (var tagName in newTagNames.Distinct())
            {
                var trimmedName = tagName.Trim();
                if (string.IsNullOrEmpty(trimmedName)) continue;

                if (!task.TaskTags.Any(tt => tt.Tag.Name == trimmedName))
                {
                    var tag = await GetOrCreateTagAsync(trimmedName, userId);
                    // FIXED: Use TodoTaskId instead of TaskId
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

        public async Task<TaskStatsResponse> GetTaskStatsAsync(int userId)
        {
            var tasks = await _tasksRepo.GetAllByUserAsync(userId);
            var tags = await _tagRepo.GetAllByUserAsync(userId);

            var categoryStats = tasks
                .GroupBy(t => t.Category)
                .Select(g => new CategoryResponse
                {
                    Name = g.Key,
                    TaskCount = g.Count() // FIXED: Added parentheses
                })
                .ToList();

            var popularTags = tags
                .OrderByDescending(t => t.TaskTags.Count) // FIXED: Added parentheses
                .Take(5)
                .Select(t => new TagResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    CreatedAt = t.CreatedAt,
                    TaskCount = t.TaskTags.Count() // FIXED: Added parentheses
                })
                .ToList();

            return new TaskStatsResponse
            {
                TotalTasks = tasks.Count, // FIXED: Added parentheses
                CompletedTasks = tasks.Count(t => t.Completed), // FIXED: Added parentheses
                PendingTasks = tasks.Count(t => !t.Completed), // FIXED: Added parentheses
                Categories = categoryStats,
                PopularTags = popularTags
            };
        }
    }
}