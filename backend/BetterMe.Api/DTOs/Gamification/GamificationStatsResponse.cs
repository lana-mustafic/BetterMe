namespace BetterMe.Models
{
    public class GamificationStatsResponse
    {
        public int TotalPoints { get; set; }
        public int HabitPoints { get; set; }
        public int TaskPoints { get; set; }
        public int CurrentStreak { get; set; }
        public int BestStreak { get; set; }
        public int Level { get; set; }
        public int TasksCompleted { get; set; }
        public int HabitsCompleted { get; set; }
        public int TotalAchievements { get; set; }
        public int NewAchievements { get; set; }
    }

    public class LeaderboardEntry
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public int Level { get; set; }
        public int CurrentStreak { get; set; }
        public int Rank { get; set; }
    }
}

