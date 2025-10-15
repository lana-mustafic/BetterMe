using Microsoft.EntityFrameworkCore;
using ToDoApi.Models;

namespace ToDoApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<TodoTask> TodoTasks { get; set; }

        // NEW: Add DbSets for Tags and TaskTags
        public DbSet<Tag> Tags { get; set; }
        public DbSet<TaskTag> TaskTags { get; set; }

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

            // NEW: Set default category for TodoTask
            modelBuilder.Entity<TodoTask>()
                .Property(t => t.Category)
                .HasDefaultValue("Other");

            // NEW: Tag configuration - unique name per user
            modelBuilder.Entity<Tag>()
                .HasIndex(t => new { t.Name, t.UserId })
                .IsUnique();

            modelBuilder.Entity<Tag>()
                .HasOne(t => t.User)
                .WithMany(u => u.Tags)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // NEW: TaskTag configuration - many-to-many relationship
            modelBuilder.Entity<TaskTag>()
                .HasKey(tt => new { tt.TodoTaskId, tt.TagId });

            modelBuilder.Entity<TaskTag>()
                .HasOne(tt => tt.TodoTask)
                .WithMany(t => t.TaskTags)
                .HasForeignKey(tt => tt.TodoTaskId)
                .OnDelete(DeleteBehavior.ClientCascade); // Changed to ClientCascade

            modelBuilder.Entity<TaskTag>()
                .HasOne(tt => tt.Tag)
                .WithMany(t => t.TaskTags)
                .HasForeignKey(tt => tt.TagId)
                .OnDelete(DeleteBehavior.ClientCascade); // Changed to ClientCascade
        }
    }
}