using BetterMe.Api.Models;

namespace BetterMe.Api.Services.Interfaces
{
    public interface IFocusSessionService
    {
        Task<FocusSession> StartSessionAsync(int userId, int? taskId, string sessionType, int durationMinutes);
        Task<FocusSession?> GetActiveSessionAsync(int userId);
        Task<FocusSession> CompleteSessionAsync(int sessionId, int userId, bool wasInterrupted = false);
        Task<List<FocusSession>> GetUserSessionsAsync(int userId, DateTime? startDate = null, DateTime? endDate = null);
        Task<FocusSessionStats> GetSessionStatsAsync(int userId, DateTime? startDate = null, DateTime? endDate = null);
        Task<PomodoroSettings> GetPomodoroSettingsAsync(int userId);
        Task<PomodoroSettings> UpdatePomodoroSettingsAsync(int userId, PomodoroSettings settings);
    }

    public class FocusSessionStats
    {
        public int TotalSessions { get; set; }
        public int CompletedSessions { get; set; }
        public int InterruptedSessions { get; set; }
        public int TotalFocusMinutes { get; set; }
        public int AverageSessionDuration { get; set; }
        public int LongestSession { get; set; }
        public Dictionary<string, int> SessionsByTask { get; set; } = new Dictionary<string, int>();
        public List<DailyFocusTime> DailyFocusTime { get; set; } = new List<DailyFocusTime>();
    }

    public class DailyFocusTime
    {
        public DateTime Date { get; set; }
        public int FocusMinutes { get; set; }
        public int SessionCount { get; set; }
    }
}

