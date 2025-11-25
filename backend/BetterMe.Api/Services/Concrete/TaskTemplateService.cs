using BetterMe.Api.Data;
using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Models;
using BetterMe.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Services.Concrete
{
    public class TaskTemplateService : ITaskTemplateService
    {
        private readonly AppDbContext _context;
        private readonly ITodoTaskService _taskService;

        public TaskTemplateService(AppDbContext context, ITodoTaskService taskService)
        {
            _context = context;
            _taskService = taskService;
        }

        public async Task<TaskTemplate> CreateTemplateAsync(CreateTaskTemplateRequest request, int userId)
        {
            var template = new TaskTemplate
            {
                UserId = userId,
                Name = request.Name,
                Description = request.Description,
                Title = request.Title,
                TaskDescription = request.TaskDescription,
                Category = request.Category,
                Priority = request.Priority,
                EstimatedDurationMinutes = request.EstimatedDurationMinutes,
                Difficulty = request.Difficulty,
                IsRecurring = request.IsRecurring,
                RecurrencePattern = request.RecurrencePattern,
                RecurrenceInterval = request.RecurrenceInterval,
                Tags = request.Tags ?? new List<string>(),
                CreatedAt = DateTime.UtcNow,
                UseCount = 0
            };

            _context.TaskTemplates.Add(template);
            await _context.SaveChangesAsync();

            return template;
        }

        public async Task<List<TaskTemplate>> GetAllTemplatesAsync(int userId)
        {
            return await _context.TaskTemplates
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.IsFavorite)
                .ThenByDescending(t => t.LastUsedAt)
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<TaskTemplate?> GetTemplateByIdAsync(int id, int userId)
        {
            return await _context.TaskTemplates
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        }

        public async Task<TaskTemplate> UpdateTemplateAsync(int id, UpdateTaskTemplateRequest request, int userId)
        {
            var template = await GetTemplateByIdAsync(id, userId);
            if (template == null)
            {
                throw new KeyNotFoundException("Template not found");
            }

            if (request.Name != null) template.Name = request.Name;
            if (request.Description != null) template.Description = request.Description;
            if (request.Title != null) template.Title = request.Title;
            if (request.TaskDescription != null) template.TaskDescription = request.TaskDescription;
            if (request.Category != null) template.Category = request.Category;
            if (request.Priority.HasValue) template.Priority = request.Priority.Value;
            if (request.EstimatedDurationMinutes.HasValue) template.EstimatedDurationMinutes = request.EstimatedDurationMinutes;
            if (request.Difficulty != null) template.Difficulty = request.Difficulty;
            if (request.IsRecurring.HasValue) template.IsRecurring = request.IsRecurring.Value;
            if (request.RecurrencePattern != null) template.RecurrencePattern = request.RecurrencePattern;
            if (request.RecurrenceInterval.HasValue) template.RecurrenceInterval = request.RecurrenceInterval.Value;
            if (request.Tags != null) template.Tags = request.Tags;
            if (request.IsFavorite.HasValue) template.IsFavorite = request.IsFavorite.Value;

            await _context.SaveChangesAsync();

            return template;
        }

        public async Task<bool> DeleteTemplateAsync(int id, int userId)
        {
            var template = await GetTemplateByIdAsync(id, userId);
            if (template == null)
            {
                return false;
            }

            _context.TaskTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<TodoTask> CreateTaskFromTemplateAsync(int templateId, int userId, DateTime? dueDate = null)
        {
            var template = await GetTemplateByIdAsync(templateId, userId);
            if (template == null)
            {
                throw new KeyNotFoundException("Template not found");
            }

            // Create task request from template
            var taskRequest = new CreateTaskRequest
            {
                Title = template.Title,
                Description = template.TaskDescription,
                DueDate = dueDate,
                Priority = template.Priority,
                Category = template.Category,
                Tags = template.Tags,
                IsRecurring = template.IsRecurring,
                RecurrencePattern = template.RecurrencePattern,
                RecurrenceInterval = template.RecurrenceInterval
            };

            // Create the task
            var task = await _taskService.CreateTaskAsync(taskRequest, userId);

            // Update template usage stats
            template.UseCount++;
            template.LastUsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return task;
        }

        public async Task<TaskTemplate> ToggleFavoriteAsync(int id, int userId)
        {
            var template = await GetTemplateByIdAsync(id, userId);
            if (template == null)
            {
                throw new KeyNotFoundException("Template not found");
            }

            template.IsFavorite = !template.IsFavorite;
            await _context.SaveChangesAsync();

            return template;
        }

        public async Task<List<TaskTemplate>> GetFavoriteTemplatesAsync(int userId)
        {
            return await _context.TaskTemplates
                .Where(t => t.UserId == userId && t.IsFavorite)
                .OrderByDescending(t => t.LastUsedAt)
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync();
        }
    }
}

