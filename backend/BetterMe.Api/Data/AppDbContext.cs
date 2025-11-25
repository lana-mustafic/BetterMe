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
        public DbSet<FocusSession> FocusSessions { get; set; }
        public DbSet<TaskTemplate> TaskTemplates { get; set; }
        public DbSet<TaskAttachment> TaskAttachments { get; set; }
        public DbSet<SharedTask> SharedTasks { get; set; }
        public DbSet<TaskComment> TaskComments { get; set; }
        public DbSet<TaskActivity> TaskActivities { get; set; }
        public DbSet<SharedTemplate> SharedTemplates { get; set; }

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

            // FocusSession configuration
            modelBuilder.Entity<FocusSession>(entity =>
            {
                entity.HasKey(fs => fs.Id);

                // Indexes for efficient queries
                entity.HasIndex(fs => new { fs.UserId, fs.IsCompleted });
                entity.HasIndex(fs => fs.StartedAt);

                // Relationship with User
                entity.HasOne(fs => fs.User)
                    .WithMany()
                    .HasForeignKey(fs => fs.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship with TodoTask (optional)
                entity.HasOne(fs => fs.Task)
                    .WithMany()
                    .HasForeignKey(fs => fs.TaskId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Set default values
                entity.Property(fs => fs.SessionType)
                    .HasDefaultValue("work");

                entity.Property(fs => fs.DurationMinutes)
                    .HasDefaultValue(25);

                entity.Property(fs => fs.IsCompleted)
                    .HasDefaultValue(false);

                entity.Property(fs => fs.WasInterrupted)
                    .HasDefaultValue(false);

                // FIXED: PostgreSQL uses NOW() instead of GETUTCDATE()
                entity.Property(fs => fs.StartedAt)
                    .HasDefaultValueSql("NOW()");
            });

            // TaskTemplate configuration
            modelBuilder.Entity<TaskTemplate>(entity =>
            {
                entity.HasKey(tt => tt.Id);

                // Indexes for efficient queries
                entity.HasIndex(tt => new { tt.UserId, tt.IsFavorite });
                entity.HasIndex(tt => tt.CreatedAt);

                // Relationship with User
                entity.HasOne(tt => tt.User)
                    .WithMany()
                    .HasForeignKey(tt => tt.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Set default values
                entity.Property(tt => tt.Category)
                    .HasDefaultValue("Other");

                entity.Property(tt => tt.Priority)
                    .HasDefaultValue(1);

                entity.Property(tt => tt.IsRecurring)
                    .HasDefaultValue(false);

                entity.Property(tt => tt.RecurrencePattern)
                    .HasDefaultValue("none");

                entity.Property(tt => tt.RecurrenceInterval)
                    .HasDefaultValue(1);

                entity.Property(tt => tt.UseCount)
                    .HasDefaultValue(0);

                entity.Property(tt => tt.IsFavorite)
                    .HasDefaultValue(false);

                // TagsJson is stored as string, conversion handled in model
                entity.Property(tt => tt.TagsJson)
                    .HasDefaultValue("[]");

                // FIXED: PostgreSQL uses NOW() instead of GETUTCDATE()
                entity.Property(tt => tt.CreatedAt)
                    .HasDefaultValueSql("NOW()");
            });

            // TaskAttachment configuration
            modelBuilder.Entity<TaskAttachment>(entity =>
            {
                entity.HasKey(ta => ta.Id);

                // Indexes for efficient queries
                entity.HasIndex(ta => ta.TodoTaskId);

                // Relationship with TodoTask
                entity.HasOne(ta => ta.TodoTask)
                    .WithMany(t => t.Attachments)
                    .HasForeignKey(ta => ta.TodoTaskId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Set default values
                entity.Property(ta => ta.UploadedAt)
                    .HasDefaultValueSql("NOW()");
            });

            // SharedTask configuration
            modelBuilder.Entity<SharedTask>(entity =>
            {
                entity.HasKey(st => st.Id);

                // Indexes for efficient queries
                entity.HasIndex(st => new { st.TaskId, st.SharedWithUserId });
                entity.HasIndex(st => st.SharedWithUserId);
                entity.HasIndex(st => st.OwnerId);
                entity.HasIndex(st => st.ShareToken).IsUnique().HasFilter("\"ShareToken\" IS NOT NULL");

                // Relationship with TodoTask
                entity.HasOne(st => st.Task)
                    .WithMany(t => t.SharedWith)
                    .HasForeignKey(st => st.TaskId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship with Owner
                entity.HasOne(st => st.Owner)
                    .WithMany()
                    .HasForeignKey(st => st.OwnerId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship with SharedWithUser
                entity.HasOne(st => st.SharedWithUser)
                    .WithMany()
                    .HasForeignKey(st => st.SharedWithUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Set default values
                entity.Property(st => st.Permission)
                    .HasDefaultValue(SharePermission.View);

                entity.Property(st => st.SharedAt)
                    .HasDefaultValueSql("NOW()");

                entity.Property(st => st.IsPublic)
                    .HasDefaultValue(false);
            });

            // TaskComment configuration
            modelBuilder.Entity<TaskComment>(entity =>
            {
                entity.HasKey(tc => tc.Id);

                // Indexes for efficient queries
                entity.HasIndex(tc => tc.TaskId);
                entity.HasIndex(tc => tc.UserId);
                entity.HasIndex(tc => tc.ParentCommentId);

                // Relationship with TodoTask
                entity.HasOne(tc => tc.Task)
                    .WithMany(t => t.Comments)
                    .HasForeignKey(tc => tc.TaskId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship with User
                entity.HasOne(tc => tc.User)
                    .WithMany()
                    .HasForeignKey(tc => tc.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Self-referencing relationship for replies
                entity.HasOne(tc => tc.ParentComment)
                    .WithMany(pc => pc.Replies)
                    .HasForeignKey(tc => tc.ParentCommentId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Set default values
                entity.Property(tc => tc.CreatedAt)
                    .HasDefaultValueSql("NOW()");

                entity.Property(tc => tc.IsEdited)
                    .HasDefaultValue(false);
            });

            // TaskActivity configuration
            modelBuilder.Entity<TaskActivity>(entity =>
            {
                entity.HasKey(ta => ta.Id);

                // Indexes for efficient queries
                entity.HasIndex(ta => ta.TaskId);
                entity.HasIndex(ta => ta.UserId);
                entity.HasIndex(ta => ta.CreatedAt);
                entity.HasIndex(ta => new { ta.TaskId, ta.CreatedAt });

                // Relationship with TodoTask
                entity.HasOne(ta => ta.Task)
                    .WithMany(t => t.Activities)
                    .HasForeignKey(ta => ta.TaskId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship with User
                entity.HasOne(ta => ta.User)
                    .WithMany()
                    .HasForeignKey(ta => ta.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship with RelatedUser
                entity.HasOne(ta => ta.RelatedUser)
                    .WithMany()
                    .HasForeignKey(ta => ta.RelatedUserId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Relationship with RelatedComment
                entity.HasOne(ta => ta.RelatedComment)
                    .WithMany()
                    .HasForeignKey(ta => ta.RelatedCommentId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Set default values
                entity.Property(ta => ta.CreatedAt)
                    .HasDefaultValueSql("NOW()");
            });
        }
    }
}