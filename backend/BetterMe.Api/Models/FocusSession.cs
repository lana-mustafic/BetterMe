using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BetterMe.Api.Models
{
    public class FocusSession
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        public int? TaskId { get; set; }

        [ForeignKey("TaskId")]
        public TodoTask? Task { get; set; }

        [Required]
        public string SessionType { get; set; } = "work"; // "work" or "break"

        [Required]
        public int DurationMinutes { get; set; } = 25; // Default Pomodoro work duration

        public int ActualDurationMinutes { get; set; } = 0; // Actual time spent

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedAt { get; set; }

        public bool IsCompleted { get; set; } = false;

        public bool WasInterrupted { get; set; } = false;

        public string? Notes { get; set; }
    }

    public class PomodoroSettings
    {
        public int WorkDurationMinutes { get; set; } = 25;
        public int ShortBreakMinutes { get; set; } = 5;
        public int LongBreakMinutes { get; set; } = 15;
        public int SessionsUntilLongBreak { get; set; } = 4;
        public bool AutoStartBreaks { get; set; } = false;
        public bool AutoStartPomodoros { get; set; } = false;
        public bool PlaySoundOnComplete { get; set; } = true;
        public bool ShowNotifications { get; set; } = true;
    }
}

