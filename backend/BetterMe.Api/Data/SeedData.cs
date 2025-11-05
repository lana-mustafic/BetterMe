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
        }
    }
}
