using Microsoft.EntityFrameworkCore;
using BetterMe.Api.Data;
using BetterMe.Api.Models;
using BetterMe.Api.Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BetterMe.Api.Repositories.Concrete
{
    public class TodoTasksRepository : ITodoTasksRepository
    {
        private readonly AppDbContext _context;

        public TodoTasksRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TodoTask> GetByIdAsync(int id)
        {
            return await _context.TodoTasks
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<TodoTask> GetByIdWithTagsAsync(int id)
        {
            return await _context.TodoTasks
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<List<TodoTask>> GetAllByUserAsync(int userId)
        {
            return await _context.TodoTasks
                .Where(t => t.UserId == userId)
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<TodoTask>> GetRecurringTasksDueForGenerationAsync(DateTime currentDate)
        {
            return await _context.TodoTasks
                .Where(t => t.IsRecurring &&
                           !t.Completed &&
                           t.NextDueDate.HasValue &&
                           t.NextDueDate <= currentDate &&
                           (t.RecurrenceEndDate == null || t.RecurrenceEndDate > currentDate))
                .ToListAsync();
        }

        public async Task<List<TodoTask>> GetCompletedTasksByUserAsync(int userId)
        {
            return await _context.TodoTasks
                .Where(t => t.UserId == userId && t.Completed)
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .OrderByDescending(t => t.CompletedAt)
                .ToListAsync();
        }

        public async Task<List<TodoTask>> GetPendingTasksByUserAsync(int userId)
        {
            return await _context.TodoTasks
                .Where(t => t.UserId == userId && !t.Completed)
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .OrderBy(t => t.DueDate)
                .ThenByDescending(t => t.Priority)
                .ToListAsync();
        }

        public async Task<List<TodoTask>> GetTasksByCategoryAsync(int userId, string category)
        {
            return await _context.TodoTasks
                .Where(t => t.UserId == userId && t.Category == category)
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<TodoTask>> GetTasksByTagAsync(int userId, string tagName)
        {
            return await _context.TodoTasks
                .Where(t => t.UserId == userId &&
                           t.TaskTags.Any(tt => tt.Tag.Name == tagName))
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<TodoTask>> GetOverdueTasksAsync(int userId)
        {
            var now = DateTime.UtcNow;
            return await _context.TodoTasks
                .Where(t => t.UserId == userId &&
                           !t.Completed &&
                           t.DueDate.HasValue &&
                           t.DueDate < now)
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .OrderBy(t => t.DueDate)
                .ToListAsync();
        }

        public async Task AddAsync(TodoTask task)
        {
            await _context.TodoTasks.AddAsync(task);
        }

        public void Remove(TodoTask task)
        {
            _context.TodoTasks.Remove(task);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}