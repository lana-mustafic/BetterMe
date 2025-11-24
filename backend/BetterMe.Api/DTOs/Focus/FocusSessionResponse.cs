namespace BetterMe.Api.DTOs.Focus
{
    public class FocusSessionResponse
    {
        public int Id { get; set; }
        public int? TaskId { get; set; }
        public string? TaskTitle { get; set; }
        public string SessionType { get; set; } = string.Empty;
        public int DurationMinutes { get; set; }
        public int ActualDurationMinutes { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public bool IsCompleted { get; set; }
        public bool WasInterrupted { get; set; }
        public string? Notes { get; set; }
    }

    public class StartSessionRequest
    {
        public int? TaskId { get; set; }
        public string SessionType { get; set; } = "work";
        public int DurationMinutes { get; set; } = 25;
    }

    public class FocusSessionStatsResponse
    {
        public int TotalSessions { get; set; }
        public int CompletedSessions { get; set; }
        public int InterruptedSessions { get; set; }
        public int TotalFocusMinutes { get; set; }
        public int AverageSessionDuration { get; set; }
        public int LongestSession { get; set; }
        public Dictionary<string, int> SessionsByTask { get; set; } = new Dictionary<string, int>();
        public List<DailyFocusTimeResponse> DailyFocusTime { get; set; } = new List<DailyFocusTimeResponse>();
    }

    public class DailyFocusTimeResponse
    {
        public DateTime Date { get; set; }
        public int FocusMinutes { get; set; }
        public int SessionCount { get; set; }
    }

    public class PomodoroSettingsResponse
    {
        public int WorkDurationMinutes { get; set; } = 25;
        public int ShortBreakMinutes { get; set; } = 5;
        public int LongBreakMinutes { get; set; } = 15;
        public int SessionsUntilLongBreak { get; set; } = 4;
        public bool AutoStartBreaks { get; set; } = false;
        public bool AutoStartPomodoros { get; set; } = false;
        public bool PlaySoundOnComplete { get; set; } = true;
        public bool ShowNotifications { get; set; } = true;
    }
}

