
using Microsoft.AspNetCore.Identity;
using BetterMe.Api.Models;

namespace BetterMe.Api.Data
{
    public static class SeedData
    {
       public static void Initialize(AppDbContext context)
        {
            if (context.Users.Any()) return;

            var passwordHasher=new PasswordHasher<User>();

            var testUser = new User
            {
                Name = "Test User",
                Email = "test@example.com",
                DateCreated = DateTime.UtcNow,
            };

            testUser.PasswordHash = passwordHasher.HashPassword(testUser, "Test@1234");

            context.Users.Add(testUser);
            context.SaveChanges();

            var tasks = new[]
                {
  new TodoTask { Title = "Buy milk", Description = "2L skim milk", UserId = testUser.Id },
                new TodoTask { Title = "Finish homework", Description = "Math exercises", UserId = testUser.Id },
                new TodoTask { Title = "Call mom", Description = "Check in with family", UserId = testUser.Id, Completed = true }
                };
            context.TodoTasks.AddRange(tasks);
            context.SaveChanges();
            }
        }

    }

