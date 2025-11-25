using Hangfire.Dashboard;

namespace BetterMe.Api.Filters
{
    public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
    {
        public bool Authorize(DashboardContext context)
        {
            // In production, add proper authorization
            // For now, allow in development
            return true;
        }
    }
}

