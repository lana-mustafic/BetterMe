using BetterMe.Models;

namespace BetterMe.Api.Services.Interfaces
{
    public interface IHabitService
    {
        Task<List<Habit>> GetUserHabitsAsync(int userId);
        Task<Habit?> GetHabitByIdAsync(Guid id, int userId);
        Task<Habit> CreateHabitAsync(CreateHabitRequest request, int userId);
        Task<Habit?> UpdateHabitAsync(Guid id, UpdateHabitRequest request, int userId);
        Task<bool> DeleteHabitAsync(Guid id, int userId);
        Task<HabitCompletion> CompleteHabitAsync(Guid habitId, CompleteHabitRequest request, int userId);
        Task<bool> UncompleteHabitAsync(Guid habitId, DateTime date, int userId);
        Task<List<HabitCompletion>> GetHabitCompletionsAsync(Guid habitId, DateTime startDate, DateTime endDate, int userId);
        Task<HabitStatsResponse> GetHabitStatsAsync(int userId);
        Task<LevelSystemResponse> GetLevelSystemAsync(int userId);
        Task<List<Habit>> GetTodayHabitsAsync(int userId);
    }
}