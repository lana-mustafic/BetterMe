using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Models;

namespace BetterMe.Api.Services.Interfaces
{
    public interface ITaskTemplateService
    {
        Task<TaskTemplate> CreateTemplateAsync(CreateTaskTemplateRequest request, int userId);
        Task<List<TaskTemplate>> GetAllTemplatesAsync(int userId);
        Task<TaskTemplate?> GetTemplateByIdAsync(int id, int userId);
        Task<TaskTemplate> UpdateTemplateAsync(int id, UpdateTaskTemplateRequest request, int userId);
        Task<bool> DeleteTemplateAsync(int id, int userId);
        Task<TodoTask> CreateTaskFromTemplateAsync(int templateId, int userId, DateTime? dueDate = null);
        Task<TaskTemplate> ToggleFavoriteAsync(int id, int userId);
        Task<List<TaskTemplate>> GetFavoriteTemplatesAsync(int userId);
    }
}

