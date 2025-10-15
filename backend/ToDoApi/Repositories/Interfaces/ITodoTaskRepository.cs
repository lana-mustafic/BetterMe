using ToDoApi.Models;

namespace ToDoApi.Repositories.Interfaces
{
    public interface ITodoTasksRepository
    {
        Task<TodoTask> GetByIdAsync(int id);
        Task<TodoTask> GetByIdWithTagsAsync(int id);
        Task<List<TodoTask>> GetAllByUserAsync(int userId);
        Task AddAsync(TodoTask task);
        void Remove(TodoTask task);
        Task SaveChangesAsync();
    }
}