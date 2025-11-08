using System.Threading.Tasks;

namespace BetterMe.Api.Services.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendVerificationEmailAsync(string email, string verificationToken, string displayName);
        Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string displayName);
        Task<bool> SendWelcomeEmailAsync(string email, string displayName);
    }
}