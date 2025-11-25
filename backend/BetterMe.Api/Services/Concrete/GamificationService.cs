using BetterMe.Api.Data;
using BetterMe.Api.Models;
using BetterMe.Api.Services.Interfaces;
using BetterMe.Models;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Services.Concrete
{
    public class GamificationService : IGamificationService
    {
        private readonly AppDbContext _context;
        private readonly int[] _levelThresholds = { 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500 };

        public GamificationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> AwardTaskCompletionPointsAsync(int taskId, int userId, bool isRecurringInstance = false)
        {
            var task = await _context.TodoTasks.FindAsync(taskId);
            if (task == null || task.UserId != userId) return 0;

            // Calculate points based on priority (1-5, where 5 is highest)
            // Base points: 10, 15, 20, 25, 30 for priorities 1-5
            var basePoints = 10 + (task.Priority * 5);
            
            // Bonus for completing on time (before or on due date)
            var onTimeBonus = 0;
            if (task.DueDate.HasValue && task.CompletedAt.HasValue)
            {
                if (task.CompletedAt.Value <= task.DueDate.Value)
                {
                    onTimeBonus = 5;
                }
            }
            else if (!task.DueDate.HasValue)
            {
                // No due date, small bonus for completing
                onTimeBonus = 2;
            }

            var totalPoints = basePoints + onTimeBonus;

            // Create or update user gamification
            var userGamification = await _context.UserGamifications
                .FirstOrDefaultAsync(ug => ug.UserId == userId);

            if (userGamification == null)
            {
                userGamification = new UserGamification
                {
                    UserId = userId,
                    TotalPoints = 0,
                    CurrentStreak = 0,
                    BestStreak = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.UserGamifications.Add(userGamification);
            }

            // Record task completion
            var completion = new TaskCompletion
            {
                TaskId = taskId,
                UserId = userId,
                CompletedAt = task.CompletedAt ?? DateTime.UtcNow,
                PointsEarned = totalPoints,
                IsRecurringInstance = isRecurringInstance,
                RecurringInstanceDate = isRecurringInstance ? task.CompletedAt?.ToString("yyyy-MM-dd") : null
            };

            _context.TaskCompletions.Add(completion);

            // Update total points (always add points for any completion)
            userGamification.TotalPoints += totalPoints;
            userGamification.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Update streak
            await UpdateUserStreakAsync(userId);

            // Check for achievements
            await CheckAndAwardAchievementsAsync(userId);

            return totalPoints;
        }

        public async Task UpdateUserStreakAsync(int userId)
        {
            var userGamification = await _context.UserGamifications
                .FirstOrDefaultAsync(ug => ug.UserId == userId);

            if (userGamification == null) return;

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            // Get all task completions for this user
            var completions = await _context.TaskCompletions
                .Where(tc => tc.UserId == userId && !tc.IsRecurringInstance)
                .OrderByDescending(tc => tc.CompletedAt)
                .ToListAsync();

            if (!completions.Any())
            {
                userGamification.CurrentStreak = 0;
                userGamification.LastTaskCompletionDate = null;
                userGamification.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return;
            }

            // Get unique completion dates
            var completionDates = completions
                .Select(tc => tc.CompletedAt.Date)
                .Distinct()
                .OrderByDescending(d => d)
                .ToList();

            var currentStreak = 0;
            var checkDate = today;

            // Check if there's a completion today or yesterday
            if (completionDates.Contains(today) || completionDates.Contains(yesterday))
            {
                // Start from today or yesterday
                if (completionDates.Contains(today))
                {
                    checkDate = today;
                }
                else
                {
                    checkDate = yesterday;
                }

                // Count consecutive days
                foreach (var date in completionDates)
                {
                    if (date == checkDate || date == checkDate.AddDays(-currentStreak))
                    {
                        currentStreak++;
                        checkDate = date.AddDays(-1);
                    }
                    else
                    {
                        break;
                    }
                }
            }

            userGamification.CurrentStreak = currentStreak;
            userGamification.BestStreak = Math.Max(userGamification.BestStreak, currentStreak);
            userGamification.LastTaskCompletionDate = completionDates.FirstOrDefault();
            userGamification.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<List<Achievement>> CheckAndAwardAchievementsAsync(int userId)
        {
            var userGamification = await _context.UserGamifications
                .FirstOrDefaultAsync(ug => ug.UserId == userId);

            if (userGamification == null) return new List<Achievement>();

            var stats = await GetGamificationStatsAsync(userId);
            var unlockedAchievements = new List<Achievement>();

            // Get all active achievements
            var achievements = await _context.Achievements
                .Where(a => a.IsActive)
                .ToListAsync();

            // Get already unlocked achievements
            var unlockedAchievementIds = await _context.UserAchievements
                .Where(ua => ua.UserId == userId)
                .Select(ua => ua.AchievementId)
                .ToListAsync();

            foreach (var achievement in achievements)
            {
                if (unlockedAchievementIds.Contains(achievement.Id)) continue;

                bool shouldUnlock = false;

                // Check achievement criteria
                if (achievement.PointsRequired > 0 && stats.TotalPoints >= achievement.PointsRequired)
                    shouldUnlock = true;
                else if (achievement.StreakRequired.HasValue && stats.CurrentStreak >= achievement.StreakRequired.Value)
                    shouldUnlock = true;
                else if (achievement.LevelRequired.HasValue && stats.Level >= achievement.LevelRequired.Value)
                    shouldUnlock = true;
                else if (achievement.TasksCompletedRequired.HasValue && stats.TasksCompleted >= achievement.TasksCompletedRequired.Value)
                    shouldUnlock = true;

                if (shouldUnlock)
                {
                    var userAchievement = new UserAchievement
                    {
                        UserId = userId,
                        AchievementId = achievement.Id,
                        UnlockedAt = DateTime.UtcNow,
                        IsNew = true
                    };

                    _context.UserAchievements.Add(userAchievement);
                    unlockedAchievements.Add(achievement);
                }
            }

            if (unlockedAchievements.Any())
            {
                await _context.SaveChangesAsync();
            }

            return unlockedAchievements;
        }

        public async Task<GamificationStatsResponse> GetGamificationStatsAsync(int userId)
        {
            var userGamification = await _context.UserGamifications
                .FirstOrDefaultAsync(ug => ug.UserId == userId);

            // Get habit points
            var habitCompletions = await _context.HabitCompletions
                .Where(hc => hc.UserId == userId)
                .ToListAsync();
            var habitPoints = habitCompletions.Sum(hc => hc.PointsEarned);

            // Get task points
            var taskCompletions = await _context.TaskCompletions
                .Where(tc => tc.UserId == userId && !tc.IsRecurringInstance)
                .ToListAsync();
            var taskPoints = taskCompletions.Sum(tc => tc.PointsEarned);

            var totalPoints = habitPoints + taskPoints;
            if (userGamification != null)
            {
                totalPoints = userGamification.TotalPoints;
            }

            // Get task and habit counts
            var tasksCompleted = await _context.TaskCompletions
                .Where(tc => tc.UserId == userId && !tc.IsRecurringInstance)
                .Select(tc => tc.TaskId)
                .Distinct()
                .CountAsync();

            var habitsCompleted = await _context.Habits
                .Where(h => h.UserId == userId && h.CompletedDates.Any())
                .CountAsync();

            // Get achievements
            var totalAchievements = await _context.UserAchievements
                .Where(ua => ua.UserId == userId)
                .CountAsync();

            var newAchievements = await _context.UserAchievements
                .Where(ua => ua.UserId == userId && ua.IsNew)
                .CountAsync();

            var level = CalculateLevel(totalPoints);
            var currentStreak = userGamification?.CurrentStreak ?? 0;
            var bestStreak = userGamification?.BestStreak ?? 0;

            return new GamificationStatsResponse
            {
                TotalPoints = totalPoints,
                HabitPoints = habitPoints,
                TaskPoints = taskPoints,
                CurrentStreak = currentStreak,
                BestStreak = bestStreak,
                Level = level,
                TasksCompleted = tasksCompleted,
                HabitsCompleted = habitsCompleted,
                TotalAchievements = totalAchievements,
                NewAchievements = newAchievements
            };
        }

        public async Task<LevelSystemResponse> GetUnifiedLevelSystemAsync(int userId)
        {
            var stats = await GetGamificationStatsAsync(userId);
            var level = stats.Level;
            var points = stats.TotalPoints;

            var nextLevelThreshold = level <= _levelThresholds.Length ? _levelThresholds[level - 1] : _levelThresholds[^1] * 2;
            var currentLevelThreshold = level > 1 ? _levelThresholds[level - 2] : 0;
            var progress = points >= nextLevelThreshold ? 100 : ((double)(points - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;

            var rewards = GetLevelRewards(level);

            return new LevelSystemResponse
            {
                Level = level,
                Points = points,
                PointsToNextLevel = Math.Max(0, nextLevelThreshold - points),
                Progress = Math.Round(progress, 1),
                Rewards = rewards
            };
        }

        public async Task<List<UserAchievement>> GetUserAchievementsAsync(int userId, bool includeUnlocked = true)
        {
            var query = _context.UserAchievements
                .Include(ua => ua.Achievement)
                .Where(ua => ua.UserId == userId);

            if (!includeUnlocked)
            {
                query = query.Where(ua => ua.IsNew);
            }

            return await query
                .OrderByDescending(ua => ua.UnlockedAt)
                .ToListAsync();
        }

        public async Task<List<LeaderboardEntry>> GetLeaderboardAsync(int limit = 10)
        {
            var users = await _context.UserGamifications
                .Include(ug => ug.User)
                .OrderByDescending(ug => ug.TotalPoints)
                .Take(limit)
                .Select(ug => new LeaderboardEntry
                {
                    UserId = ug.UserId,
                    UserName = ug.User.Name,
                    TotalPoints = ug.TotalPoints,
                    Level = CalculateLevel(ug.TotalPoints),
                    CurrentStreak = ug.CurrentStreak
                })
                .ToListAsync();

            // Add rank
            for (int i = 0; i < users.Count; i++)
            {
                users[i].Rank = i + 1;
            }

            return users;
        }

        public async Task MarkAchievementAsReadAsync(int userAchievementId, int userId)
        {
            var userAchievement = await _context.UserAchievements
                .FirstOrDefaultAsync(ua => ua.Id == userAchievementId && ua.UserId == userId);

            if (userAchievement != null)
            {
                userAchievement.IsNew = false;
                await _context.SaveChangesAsync();
            }
        }

        private int CalculateLevel(int points)
        {
            for (int i = 0; i < _levelThresholds.Length; i++)
            {
                if (points < _levelThresholds[i])
                {
                    return i + 1;
                }
            }
            return _levelThresholds.Length + 1;
        }

        private List<string> GetLevelRewards(int level)
        {
            var rewards = new List<string>
            {
                "Welcome to BetterMe! 🎉",
                "Unlocked: Advanced statistics 📊",
                "Unlocked: Task streaks 🔥",
                "Unlocked: Custom categories 🎨",
                "Unlocked: Progress charts 📈",
                "Unlocked: Achievement badges 🏆",
                "Unlocked: Export data 📤",
                "Unlocked: Advanced analytics 🔍",
                "Unlocked: Task templates 📝",
                "Master Task Manager! 🌟"
            };

            return rewards.Take(level).ToList();
        }
    }
}

