using System.Threading.Tasks;

namespace BetterMe.Api.Services.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendVerificationEmailAsync(string email, string verificationToken, string displayName);
        Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string displayName);
        Task<bool> SendWelcomeEmailAsync(string email, string displayName);
        Task<bool> IsEmailConfiguredAsync();
        Task<bool> SendGenericEmailAsync(string email, string subject, string body, bool isHtml = true);
        Task<bool> SendNotificationEmailAsync(string email, string title, string message, string displayName);
    }
}