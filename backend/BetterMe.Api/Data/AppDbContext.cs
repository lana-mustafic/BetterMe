using Microsoft.EntityFrameworkCore;
using BetterMe.Api.Models;
using BetterMe.Models;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace BetterMe.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<TodoTask> TodoTasks { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<TaskTag> TaskTags { get; set; }
        public DbSet<Habit> Habits { get; set; }
        public DbSet<HabitCompletion> HabitCompletions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // TodoTask configuration
            modelBuilder.Entity<TodoTask>()
                .HasOne(t => t.User)
                .WithMany(u => u.TodoTasks)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Set default category for TodoTask
            modelBuilder.Entity<TodoTask>()
                .Property(t => t.Category)
                .HasDefaultValue("Other");

            // Tag configuration - unique name per user
            modelBuilder.Entity<Tag>()
                .HasIndex(t => new { t.Name, t.UserId })
                .IsUnique();

            modelBuilder.Entity<Tag>()
                .HasOne(t => t.User)
                .WithMany(u => u.Tags)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskTag configuration - many-to-many relationship
            modelBuilder.Entity<TaskTag>()
                .HasKey(tt => new { tt.TodoTaskId, tt.TagId });

            modelBuilder.Entity<TaskTag>()
                .HasOne(tt => tt.TodoTask)
                .WithMany(t => t.TaskTags)
                .HasForeignKey(tt => tt.TodoTaskId)
                .OnDelete(DeleteBehavior.ClientCascade);

            modelBuilder.Entity<TaskTag>()
                .HasOne(tt => tt.Tag)
                .WithMany(t => t.TaskTags)
                .HasForeignKey(tt => tt.TagId)
                .OnDelete(DeleteBehavior.ClientCascade);

            // FIXED: Habit configuration for PostgreSQL
            modelBuilder.Entity<Habit>(entity =>
            {
                entity.HasKey(h => h.Id);

                // Index for user queries
                entity.HasIndex(h => h.UserId);

                // Relationship with User
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(h => h.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Convert CompletedDates list to JSON string for storage with value comparer
                entity.Property(h => h.CompletedDates)
                    .HasConversion(
                        v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                        v => System.Text.Json.JsonSerializer.Deserialize<List<DateTime>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<DateTime>()
                    )
                    .Metadata.SetValueComparer(new ValueComparer<List<DateTime>>(
                        (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
                        c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                        c => c.ToList()));

                // Convert Tags list to JSON string for storage with value comparer
                entity.Property(h => h.Tags)
                    .HasConversion(
                        v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                        v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
                    )
                    .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                        (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
                        c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v != null ? v.GetHashCode() : 0)),
                        c => c.ToList()));

                // Set default values for PostgreSQL
                entity.Property(h => h.Frequency)
                    .HasDefaultValue("daily");

                entity.Property(h => h.Streak)
                    .HasDefaultValue(0);

                entity.Property(h => h.BestStreak)
                    .HasDefaultValue(0);

                entity.Property(h => h.TargetCount)
                    .HasDefaultValue(1);

                entity.Property(h => h.CurrentCount)
                    .HasDefaultValue(0);

                entity.Property(h => h.Category)
                    .HasDefaultValue("Health & Fitness");

                entity.Property(h => h.Color)
                    .HasDefaultValue("#4ade80");

                entity.Property(h => h.Icon)
                    .HasDefaultValue("✅");

                entity.Property(h => h.Difficulty)
                    .HasDefaultValue("easy");

                entity.Property(h => h.Points)
                    .HasDefaultValue(10);

                entity.Property(h => h.IsActive)
                    .HasDefaultValue(true);

                // FIXED: PostgreSQL uses NOW() instead of GETUTCDATE()
                entity.Property(h => h.CreatedAt)
                    .HasDefaultValueSql("NOW()");

                entity.Property(h => h.UpdatedAt)
                    .HasDefaultValueSql("NOW()");

                // REMOVED: Don't set default values for JSON properties - let the service handle it
                // entity.Property(h => h.CompletedDates).HasDefaultValue("[]");
                // entity.Property(h => h.Tags).HasDefaultValue("[]");
            });

            // FIXED: HabitCompletion configuration for PostgreSQL
            modelBuilder.Entity<HabitCompletion>(entity =>
            {
                entity.HasKey(hc => hc.Id);

                // Indexes for efficient queries
                entity.HasIndex(hc => new { hc.HabitId, hc.UserId });
                entity.HasIndex(hc => hc.CompletedAt);

                // Relationship with Habit
                entity.HasOne<Habit>()
                    .WithMany()
                    .HasForeignKey(hc => hc.HabitId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship with User
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(hc => hc.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Set default values
                entity.Property(hc => hc.PointsEarned)
                    .HasDefaultValue(0);

                // FIXED: PostgreSQL uses NOW() instead of GETUTCDATE()
                entity.Property(hc => hc.CompletedAt)
                    .HasDefaultValueSql("NOW()");
            });
        }
    }
}