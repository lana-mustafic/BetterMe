using BetterMe.Api.Models;
using BetterMe.Models;

namespace BetterMe.Api.Services.Interfaces
{
    public interface IGamificationService
    {
        Task<int> AwardTaskCompletionPointsAsync(int taskId, int userId, bool isRecurringInstance = false);
        Task UpdateUserStreakAsync(int userId);
        Task<List<Achievement>> CheckAndAwardAchievementsAsync(int userId);
        Task<GamificationStatsResponse> GetGamificationStatsAsync(int userId);
        Task<LevelSystemResponse> GetUnifiedLevelSystemAsync(int userId);
        Task<List<UserAchievement>> GetUserAchievementsAsync(int userId, bool includeUnlocked = true);
        Task<List<LeaderboardEntry>> GetLeaderboardAsync(int limit = 10);
        Task MarkAchievementAsReadAsync(int userAchievementId, int userId);
    }
}

