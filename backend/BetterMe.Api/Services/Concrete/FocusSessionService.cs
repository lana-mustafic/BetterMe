using BetterMe.Api.Data;
using BetterMe.Api.Models;
using BetterMe.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Services.Concrete
{
    public class FocusSessionService : IFocusSessionService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<FocusSessionService> _logger;

        public FocusSessionService(AppDbContext context, ILogger<FocusSessionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FocusSession> StartSessionAsync(int userId, int? taskId, string sessionType, int durationMinutes)
        {
            // Check if there's an active session and complete it
            var activeSession = await GetActiveSessionAsync(userId);
            if (activeSession != null)
            {
                await CompleteSessionAsync(activeSession.Id, userId, wasInterrupted: true);
            }

            // Validate task exists if provided
            if (taskId.HasValue)
            {
                var task = await _context.TodoTasks.FindAsync(taskId.Value);
                if (task == null || task.UserId != userId)
                {
                    throw new UnauthorizedAccessException("Task not found or doesn't belong to user");
                }
            }

            var session = new FocusSession
            {
                UserId = userId,
                TaskId = taskId,
                SessionType = sessionType,
                DurationMinutes = durationMinutes,
                StartedAt = DateTime.UtcNow,
                IsCompleted = false
            };

            _context.FocusSessions.Add(session);
            await _context.SaveChangesAsync();

            // Reload with Task navigation property
            return await _context.FocusSessions
                .Include(s => s.Task)
                .FirstOrDefaultAsync(s => s.Id == session.Id) ?? session;
        }

        public async Task<FocusSession?> GetActiveSessionAsync(int userId)
        {
            return await _context.FocusSessions
                .Include(s => s.Task)
                .Where(s => s.UserId == userId && !s.IsCompleted)
                .OrderByDescending(s => s.StartedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<FocusSession> CompleteSessionAsync(int sessionId, int userId, bool wasInterrupted = false)
        {
            var session = await _context.FocusSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
            {
                throw new KeyNotFoundException("Session not found");
            }

            session.IsCompleted = true;
            session.CompletedAt = DateTime.UtcNow;
            session.WasInterrupted = wasInterrupted;

            // Calculate actual duration
            var duration = DateTime.UtcNow - session.StartedAt;
            session.ActualDurationMinutes = (int)Math.Round(duration.TotalMinutes);

            await _context.SaveChangesAsync();

            return session;
        }

        public async Task<List<FocusSession>> GetUserSessionsAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.FocusSessions
                .Where(s => s.UserId == userId && s.IsCompleted);

            if (startDate.HasValue)
            {
                query = query.Where(s => s.StartedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(s => s.StartedAt <= endDate.Value);
            }

            return await query
                .Include(s => s.Task)
                .OrderByDescending(s => s.StartedAt)
                .ToListAsync();
        }

        public async Task<FocusSessionStats> GetSessionStatsAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.FocusSessions
                .Where(s => s.UserId == userId && s.IsCompleted);

            if (startDate.HasValue)
            {
                query = query.Where(s => s.StartedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(s => s.StartedAt <= endDate.Value);
            }

            var sessions = await query.ToListAsync();

            var stats = new FocusSessionStats
            {
                TotalSessions = sessions.Count,
                CompletedSessions = sessions.Count(s => !s.WasInterrupted),
                InterruptedSessions = sessions.Count(s => s.WasInterrupted),
                TotalFocusMinutes = sessions.Where(s => s.SessionType == "work").Sum(s => s.ActualDurationMinutes),
                AverageSessionDuration = sessions.Any() 
                    ? (int)sessions.Where(s => s.SessionType == "work").Average(s => s.ActualDurationMinutes)
                    : 0,
                LongestSession = sessions.Where(s => s.SessionType == "work").Any()
                    ? sessions.Where(s => s.SessionType == "work").Max(s => s.ActualDurationMinutes)
                    : 0
            };

            // Group by task
            var taskGroups = sessions
                .Where(s => s.TaskId.HasValue && s.SessionType == "work")
                .GroupBy(s => s.TaskId)
                .ToList();

            foreach (var group in taskGroups)
            {
                var task = await _context.TodoTasks.FindAsync(group.Key);
                if (task != null)
                {
                    stats.SessionsByTask[task.Title] = group.Count();
                }
            }

            // Daily focus time (last 30 days)
            var end = endDate ?? DateTime.UtcNow;
            var start = startDate ?? end.AddDays(-30);

            var dailyGroups = sessions
                .Where(s => s.SessionType == "work" && s.StartedAt >= start && s.StartedAt <= end)
                .GroupBy(s => s.StartedAt.Date)
                .Select(g => new DailyFocusTime
                {
                    Date = g.Key,
                    FocusMinutes = g.Sum(s => s.ActualDurationMinutes),
                    SessionCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToList();

            stats.DailyFocusTime = dailyGroups;

            return stats;
        }

        public async Task<PomodoroSettings> GetPomodoroSettingsAsync(int userId)
        {
            // For now, return default settings
            // In the future, you could store these in a UserSettings table
            return new PomodoroSettings();
        }

        public async Task<PomodoroSettings> UpdatePomodoroSettingsAsync(int userId, PomodoroSettings settings)
        {
            // For now, just return the settings
            // In the future, save to UserSettings table
            return settings;
        }
    }
}

