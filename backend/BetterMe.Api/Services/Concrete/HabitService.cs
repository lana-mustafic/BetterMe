using BetterMe.Api.Data;
using BetterMe.Api.Services.Interfaces;
using BetterMe.Models;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Services.Concrete
{
    public class HabitService : IHabitService
    {
        private readonly AppDbContext _context;
        private readonly int[] _levelThresholds = { 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500 };

        public HabitService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Habit>> GetUserHabitsAsync(int userId)
        {
            return await _context.Habits
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();
        }

        public async Task<Habit?> GetHabitByIdAsync(Guid id, int userId)
        {
            return await _context.Habits
                .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId);
        }

        public async Task<Habit> CreateHabitAsync(CreateHabitRequest request, int userId)
        {
            var habit = new Habit
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name,
                Description = request.Description,
                Frequency = string.IsNullOrWhiteSpace(request.Frequency) ? "daily" : request.Frequency,
                Streak = 0,
                BestStreak = 0,
                CompletedDates = new List<DateTime>(),
                TargetCount = request.TargetCount > 0 ? request.TargetCount : 1,
                CurrentCount = 0,
                Category = string.IsNullOrWhiteSpace(request.Category) ? "Health & Fitness" : request.Category,
                Color = string.IsNullOrWhiteSpace(request.Color) ? "#4ade80" : request.Color,
                Icon = string.IsNullOrWhiteSpace(request.Icon) ? "✅" : request.Icon,
                Difficulty = string.IsNullOrWhiteSpace(request.Difficulty) ? "easy" : request.Difficulty,
                Points = request.Points > 0 ? request.Points : 10,
                IsActive = true,
                ReminderTime = request.ReminderTime,
                Tags = request.Tags ?? new List<string>(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Habits.Add(habit);
            await _context.SaveChangesAsync();
            return habit;
        }

        public async Task<Habit?> UpdateHabitAsync(Guid id, UpdateHabitRequest request, int userId)
        {
            var habit = await GetHabitByIdAsync(id, userId);
            if (habit == null) return null;

            if (!string.IsNullOrEmpty(request.Name)) habit.Name = request.Name;
            if (request.Description != null) habit.Description = request.Description;
            if (!string.IsNullOrEmpty(request.Frequency)) habit.Frequency = request.Frequency;
            if (request.TargetCount.HasValue) habit.TargetCount = request.TargetCount.Value;
            if (!string.IsNullOrEmpty(request.Category)) habit.Category = request.Category;
            if (!string.IsNullOrEmpty(request.Color)) habit.Color = request.Color;
            if (!string.IsNullOrEmpty(request.Icon)) habit.Icon = request.Icon;
            if (!string.IsNullOrEmpty(request.Difficulty)) habit.Difficulty = request.Difficulty;
            if (request.Points.HasValue) habit.Points = request.Points.Value;
            if (request.IsActive.HasValue) habit.IsActive = request.IsActive.Value;
            if (request.ReminderTime != null) habit.ReminderTime = request.ReminderTime;
            if (request.Tags != null) habit.Tags = request.Tags;

            habit.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return habit;
        }

        public async Task<bool> DeleteHabitAsync(Guid id, int userId)
        {
            var habit = await GetHabitByIdAsync(id, userId);
            if (habit == null) return false;

            _context.Habits.Remove(habit);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<HabitCompletion> CompleteHabitAsync(Guid habitId, CompleteHabitRequest request, int userId)
        {
            var habit = await GetHabitByIdAsync(habitId, userId);
            if (habit == null) throw new ArgumentException("Habit not found");

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            if (habit.CompletedDates.Any(d => d.Date == today))
                throw new InvalidOperationException("Habit already completed today");

            var pointsEarned = CalculatePoints(habit);

            var completion = new HabitCompletion
            {
                Id = Guid.NewGuid(),
                HabitId = habitId,
                UserId = userId,
                CompletedAt = DateTime.UtcNow,
                Notes = request.Notes,
                Mood = request.Mood,
                PointsEarned = pointsEarned
            };

            _context.HabitCompletions.Add(completion);

            habit.CompletedDates.Add(today);
            habit.CurrentCount = habit.CompletedDates.Count(d => IsInCurrentPeriod(d, habit.Frequency));

            if (habit.CompletedDates.Any(d => d.Date == yesterday) || habit.Streak == 0)
            {
                habit.Streak++;
            }
            else
            {
                habit.Streak = 1;
            }

            habit.BestStreak = Math.Max(habit.Streak, habit.BestStreak);
            habit.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return completion;
        }

        public async Task<bool> UncompleteHabitAsync(Guid habitId, DateTime date, int userId)
        {
            var habit = await GetHabitByIdAsync(habitId, userId);
            if (habit == null) return false;

            var completion = await _context.HabitCompletions
                .FirstOrDefaultAsync(c => c.HabitId == habitId &&
                                         c.UserId == userId &&
                                         c.CompletedAt.Date == date.Date);

            if (completion != null)
            {
                _context.HabitCompletions.Remove(completion);
            }

            habit.CompletedDates.RemoveAll(d => d.Date == date.Date);
            habit.CurrentCount = habit.CompletedDates.Count(d => IsInCurrentPeriod(d, habit.Frequency));

            await RecalculateStreakAsync(habit);
            habit.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<HabitCompletion>> GetHabitCompletionsAsync(Guid habitId, DateTime startDate, DateTime endDate, int userId)
        {
            return await _context.HabitCompletions
                .Where(c => c.HabitId == habitId &&
                           c.UserId == userId &&
                           c.CompletedAt >= startDate &&
                           c.CompletedAt <= endDate)
                .OrderByDescending(c => c.CompletedAt)
                .ToListAsync();
        }

        public async Task<HabitStatsResponse> GetHabitStatsAsync(int userId)
        {
            var habits = await GetUserHabitsAsync(userId);
            var activeHabits = habits.Where(h => h.IsActive).ToList();

            var totalCompletions = activeHabits.Sum(h => h.CompletedDates.Count);
            var currentStreak = activeHabits.Any() ? activeHabits.Max(h => h.Streak) : 0;
            var longestStreak = activeHabits.Any() ? activeHabits.Max(h => h.BestStreak) : 0;
            var totalPoints = activeHabits.Sum(h => h.CompletedDates.Count * h.Points);

            var totalTarget = activeHabits.Sum(h => h.TargetCount);
            var totalCurrentCompletions = activeHabits.Sum(h => h.CurrentCount);
            var successRate = totalTarget > 0 ? (double)totalCurrentCompletions / totalTarget * 100 : 0;

            var weeklyProgress = GenerateWeeklyProgress(activeHabits);
            var categoryBreakdown = GetCategoryBreakdown(activeHabits);

            return new HabitStatsResponse
            {
                TotalHabits = habits.Count,
                ActiveHabits = activeHabits.Count,
                TotalCompletions = totalCompletions,
                CurrentStreak = currentStreak,
                LongestStreak = longestStreak,
                SuccessRate = Math.Round(successRate, 1),
                TotalPoints = totalPoints,
                Level = CalculateLevel(totalPoints),
                WeeklyProgress = weeklyProgress,
                CategoryBreakdown = categoryBreakdown
            };
        }

        public async Task<LevelSystemResponse> GetLevelSystemAsync(int userId)
        {
            var stats = await GetHabitStatsAsync(userId);
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

        public async Task<List<Habit>> GetTodayHabitsAsync(int userId)
        {
            var habits = await GetUserHabitsAsync(userId);
            var today = DateTime.UtcNow.Date;

            return habits.Where(habit =>
                habit.IsActive && IsHabitDueToday(habit, today)
            ).ToList();
        }

        // Private helper methods
        private int CalculatePoints(Habit habit)
        {
            var points = habit.Points;

            if (habit.Streak >= 7)
            {
                var streakBonus = (int)(habit.Streak / 7 * 0.1 * points);
                points += streakBonus;
            }

            return points;
        }

        private async Task RecalculateStreakAsync(Habit habit)
        {
            if (!habit.CompletedDates.Any())
            {
                habit.Streak = 0;
                return;
            }

            var sortedDates = habit.CompletedDates.OrderBy(d => d).ToList();
            var currentStreak = 1;
            var maxStreak = 1;

            for (int i = 1; i < sortedDates.Count; i++)
            {
                if ((sortedDates[i] - sortedDates[i - 1]).TotalDays == 1)
                {
                    currentStreak++;
                    maxStreak = Math.Max(maxStreak, currentStreak);
                }
                else
                {
                    currentStreak = 1;
                }
            }

            habit.Streak = currentStreak;
            habit.BestStreak = Math.Max(habit.BestStreak, maxStreak);
        }

        private bool IsHabitDueToday(Habit habit, DateTime today)
        {
            var lastCompleted = habit.CompletedDates.OrderByDescending(d => d).FirstOrDefault();

            if (lastCompleted == default) return true;

            switch (habit.Frequency)
            {
                case "daily":
                    return lastCompleted.Date < today;
                case "weekly":
                    return (today - lastCompleted).TotalDays >= 7;
                case "monthly":
                    return lastCompleted.Month != today.Month || lastCompleted.Year != today.Year;
                default:
                    return true;
            }
        }

        private bool IsInCurrentPeriod(DateTime date, string frequency)
        {
            var now = DateTime.UtcNow;

            switch (frequency)
            {
                case "daily":
                    return date.Date == now.Date;
                case "weekly":
                    var startOfWeek = now.AddDays(-(int)now.DayOfWeek + (int)DayOfWeek.Monday);
                    return date >= startOfWeek.Date;
                case "monthly":
                    return date.Year == now.Year && date.Month == now.Month;
                default:
                    return false;
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
                "Welcome to habit tracking! 🎉",
                "Unlocked: Advanced statistics 📊",
                "Unlocked: Habit streaks 🔥",
                "Unlocked: Custom categories 🎨",
                "Unlocked: Progress charts 📈",
                "Unlocked: Achievement badges 🏆",
                "Unlocked: Export data 📤",
                "Unlocked: Advanced analytics 🔍",
                "Unlocked: Habit templates 📝",
                "Master Habit Builder! 🌟"
            };

            return rewards.Take(level).ToList();
        }

        private List<WeeklyProgress> GenerateWeeklyProgress(List<Habit> habits)
        {
            var progress = new List<WeeklyProgress>();
            var today = DateTime.UtcNow.Date;

            for (int i = 6; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var completions = habits.Sum(habit =>
                    habit.CompletedDates.Count(d => d.Date == date.Date)
                );

                progress.Add(new WeeklyProgress
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    Completions = completions
                });
            }

            return progress;
        }

        private List<CategoryBreakdown> GetCategoryBreakdown(List<Habit> habits)
        {
            var categories = habits.Select(h => h.Category).Distinct();
            var breakdown = new List<CategoryBreakdown>();

            foreach (var category in categories)
            {
                var categoryHabits = habits.Where(h => h.Category == category).ToList();
                var completed = categoryHabits.Sum(h => h.CurrentCount);

                breakdown.Add(new CategoryBreakdown
                {
                    Category = category,
                    Count = categoryHabits.Count,
                    Completed = completed
                });
            }

            return breakdown;
        }
    }
}