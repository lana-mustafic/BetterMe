using BetterMe.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BetterMe.Api.Repositories.Interfaces
{
    public interface ITodoTasksRepository
    {
        // Basic CRUD operations
        Task<TodoTask> GetByIdAsync(int id);
        Task<TodoTask> GetByIdWithTagsAsync(int id);
        Task<List<TodoTask>> GetAllByUserAsync(int userId);
        Task<List<TodoTask>> GetRecurringTasksDueForGenerationAsync(DateTime currentDate);
        Task AddAsync(TodoTask task);
        void Remove(TodoTask task);
        Task SaveChangesAsync();

        // Enhanced query operations
        Task<List<TodoTask>> GetCompletedTasksByUserAsync(int userId);
        Task<List<TodoTask>> GetPendingTasksByUserAsync(int userId);
        Task<List<TodoTask>> GetTasksByCategoryAsync(int userId, string category);
        Task<List<TodoTask>> GetTasksByTagAsync(int userId, string tagName);
        Task<List<TodoTask>> GetOverdueTasksAsync(int userId);
    }
}