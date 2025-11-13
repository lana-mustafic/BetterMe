namespace BetterMe.Models
{
    public class HabitStatsResponse
    {
        public int TotalHabits { get; set; }
        public int ActiveHabits { get; set; }
        public int TotalCompletions { get; set; }
        public int CurrentStreak { get; set; }
        public int LongestStreak { get; set; }
        public double SuccessRate { get; set; }
        public int TotalPoints { get; set; }
        public int Level { get; set; }
        public List<WeeklyProgress> WeeklyProgress { get; set; } = new List<WeeklyProgress>();
        public List<CategoryBreakdown> CategoryBreakdown { get; set; } = new List<CategoryBreakdown>();
    }

    public class WeeklyProgress
    {
        public string Date { get; set; } = string.Empty;
        public int Completions { get; set; }
    }

    public class CategoryBreakdown
    {
        public string Category { get; set; } = string.Empty;
        public int Count { get; set; }
        public int Completed { get; set; }
    }

    public class LevelSystemResponse
    {
        public int Level { get; set; }
        public int Points { get; set; }
        public int PointsToNextLevel { get; set; }
        public double Progress { get; set; }
        public List<string> Rewards { get; set; } = new List<string>();
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }
}