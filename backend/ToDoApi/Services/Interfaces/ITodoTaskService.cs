using ToDoApi.DTOs.Task;
using ToDoApi.Models;

namespace ToDoApi.Services.Interfaces
{
    public interface ITodoTaskService
    {
        Task<TodoTask> CreateTaskAsync(CreateTaskRequest request, int userId);
        Task<List<TodoTask>> GetAllTasksByUserAsync(int userId);
        Task<TodoTask> GetByIdAsync(int id);
        Task<TodoTask> UpdateTaskAsync(int id, UpdateTaskRequest request, int userId);
        Task<bool> DeleteTaskAsync(int id, int userId);
    }
}