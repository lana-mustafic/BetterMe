using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BetterMe.Api.Services.Interfaces
{
    public interface ITodoTaskService
    {
        Task<TodoTask> CreateTaskAsync(CreateTaskRequest request, int userId);
        Task<List<TodoTask>> GetAllTasksByUserAsync(int userId);
        Task<TodoTask> GetByIdAsync(int id);
        Task<TodoTask> UpdateTaskAsync(int id, UpdateTaskRequest request, int userId);
        Task<bool> DeleteTaskAsync(int id, int userId);
        Task<TodoTask> CompleteRecurringInstanceAsync(int taskId, int userId, DateTime completionDate);
        Task<List<TodoTask>> GenerateNextRecurringInstancesAsync();
        Task<int> CalculateHabitStreakAsync(int taskId);
        Task<TaskStatsResponse> GetTaskStatsAsync(int userId);
    }
}