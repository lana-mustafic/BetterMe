using Microsoft.AspNetCore.Identity;
using BetterMe.Api.Models;

namespace BetterMe.Api.Data
{
    public static class SeedData
    {
        public static void Initialize(AppDbContext context)
        {

            if (context.Users.Any())
                return;

            var passwordHasher = new PasswordHasher<User>();

            var testUser = new User
            {
                Name = "Test User",
                Email = "test@example.com",
                DateCreated = DateTime.UtcNow,
                LastLogin = DateTime.UtcNow
            };

            testUser.PasswordHash = passwordHasher.HashPassword(testUser, "Test@1234");

            context.Users.Add(testUser);
            context.SaveChanges();


            var tasks = new[]
            {
                new TodoTask
                {
                    Title = "Buy milk",
                    Description = "2L skim milk",
                    CreatedAt = DateTime.UtcNow,
                    CompletedInstancesJson = "[]", 
                    UserId = testUser.Id
                },
                new TodoTask
                {
                    Title = "Finish homework",
                    Description = "Math exercises",
                    CreatedAt = DateTime.UtcNow,
                    CompletedInstancesJson = "[]", 
                    UserId = testUser.Id
                },
                new TodoTask
                {
                    Title = "Call mom",
                    Description = "Check in with family",
                    CreatedAt = DateTime.UtcNow,
                    Completed = true,
                    CompletedAt = DateTime.UtcNow,
                    CompletedInstancesJson = "[]", 
                    UserId = testUser.Id
                }
            };

            context.TodoTasks.AddRange(tasks);
            context.SaveChanges();

            // Seed Achievements
            if (!context.Achievements.Any())
            {
                var achievements = new[]
                {
                    new Achievement
                    {
                        Code = "first_task",
                        Name = "First Steps",
                        Description = "Complete your first task",
                        Icon = "🎯",
                        Category = "tasks",
                        TasksCompletedRequired = 1,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "task_master_10",
                        Name = "Task Master",
                        Description = "Complete 10 tasks",
                        Icon = "⭐",
                        Category = "tasks",
                        TasksCompletedRequired = 10,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "task_master_50",
                        Name = "Task Champion",
                        Description = "Complete 50 tasks",
                        Icon = "🏆",
                        Category = "tasks",
                        TasksCompletedRequired = 50,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "task_master_100",
                        Name = "Task Legend",
                        Description = "Complete 100 tasks",
                        Icon = "👑",
                        Category = "tasks",
                        TasksCompletedRequired = 100,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "streak_3",
                        Name = "Getting Started",
                        Description = "Maintain a 3-day task completion streak",
                        Icon = "🔥",
                        Category = "streaks",
                        StreakRequired = 3,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "streak_7",
                        Name = "Week Warrior",
                        Description = "Maintain a 7-day task completion streak",
                        Icon = "🔥🔥",
                        Category = "streaks",
                        StreakRequired = 7,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "streak_30",
                        Name = "Monthly Master",
                        Description = "Maintain a 30-day task completion streak",
                        Icon = "🔥🔥🔥",
                        Category = "streaks",
                        StreakRequired = 30,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "points_100",
                        Name = "Point Collector",
                        Description = "Earn 100 points",
                        Icon = "💎",
                        Category = "points",
                        PointsRequired = 100,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "points_500",
                        Name = "Point Pro",
                        Description = "Earn 500 points",
                        Icon = "💎💎",
                        Category = "points",
                        PointsRequired = 500,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "points_1000",
                        Name = "Point Master",
                        Description = "Earn 1000 points",
                        Icon = "💎💎💎",
                        Category = "points",
                        PointsRequired = 1000,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "level_5",
                        Name = "Rising Star",
                        Description = "Reach level 5",
                        Icon = "⭐",
                        Category = "levels",
                        LevelRequired = 5,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Achievement
                    {
                        Code = "level_10",
                        Name = "Elite Performer",
                        Description = "Reach level 10",
                        Icon = "🌟",
                        Category = "levels",
                        LevelRequired = 10,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    }
                };

                context.Achievements.AddRange(achievements);
                context.SaveChanges();
            }
        }
    }
}
