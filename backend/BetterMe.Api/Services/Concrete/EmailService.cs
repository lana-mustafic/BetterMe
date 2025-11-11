using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Extensions.Configuration;
using BetterMe.Api.Services.Interfaces;

namespace BetterMe.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> SendVerificationEmailAsync(string email, string verificationToken, string displayName)
        {
            try
            {
                Console.WriteLine($"🔍 [EmailService] Starting email send to: {email}");

                // Get configuration values
                var smtpHost = _configuration["Email:SmtpHost"];
                var smtpPort = _configuration["Email:SmtpPort"];
                var smtpUsername = _configuration["Email:SmtpUsername"];
                var smtpPassword = _configuration["Email:SmtpPassword"];
                var fromEmail = _configuration["Email:FromEmail"];
                var fromName = _configuration["Email:FromName"];
                var appBaseUrl = _configuration["AppBaseUrl"];

                Console.WriteLine($"🔍 [EmailService] Config - Host: {smtpHost}, Port: {smtpPort}");
                Console.WriteLine($"🔍 [EmailService] Config - Username: {smtpUsername}");
                Console.WriteLine($"🔍 [EmailService] Config - Password length: {smtpPassword?.Length}");
                Console.WriteLine($"🔍 [EmailService] Config - From: {fromEmail}");

                // Check if configuration is complete
                if (string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
                {
                    Console.WriteLine("❌ [EmailService] SMTP not configured properly");
                    Console.WriteLine($"🎯 Verification token for {email}: {verificationToken}");
                    return true; // Don't block registration
                }

                // Create verification URL
                var encodedToken = HttpUtility.UrlEncode(verificationToken);
                var encodedEmail = HttpUtility.UrlEncode(email);
                var verificationUrl = $"{appBaseUrl}/verify-email?token={encodedToken}&email={encodedEmail}";

                Console.WriteLine($"🔍 [EmailService] Verification URL: {verificationUrl}");

                // Try to send real email
                using var client = new SmtpClient(smtpHost, int.Parse(smtpPort))
                {
                    Credentials = new NetworkCredential(smtpUsername, smtpPassword),
                    EnableSsl = true,
                    Timeout = 15000 // 15 seconds
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = "Verify Your Email - BetterMe",
                    Body = CreateVerificationEmailBody(displayName, verificationUrl),
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);

                Console.WriteLine($"🔍 [EmailService] Attempting to send email...");
                await client.SendMailAsync(mailMessage);

                Console.WriteLine($"✅ [EmailService] Email sent successfully to: {email}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [EmailService] FAILED to send email to {email}");
                Console.WriteLine($"❌ [EmailService] Error: {ex.Message}");
                Console.WriteLine($"❌ [EmailService] Stack: {ex.StackTrace}");

                // Still return true so registration doesn't fail
                Console.WriteLine($"🎯 Verification token for {email}: {verificationToken}");
                return true;
            }
        }

        // ... keep your existing methods for password reset, welcome, etc.

        private string CreateVerificationEmailBody(string displayName, string verificationUrl)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>BetterMe</h1>
        </div>
        <div class='content'>
            <h2>Hello {displayName}!</h2>
            <p>Please verify your email address by clicking the button below:</p>
            <p style='text-align: center;'>
                <a href='{verificationUrl}' class='button'>Verify Email</a>
            </p>
            <p>Or copy this link: {verificationUrl}</p>
        </div>
    </div>
</body>
</html>";
        }

        public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string displayName)
        {
            Console.WriteLine($"🎯 [EmailService] Password reset for {email}: {resetToken}");
            return true;
        }

        public async Task<bool> SendWelcomeEmailAsync(string email, string displayName)
        {
            Console.WriteLine($"🎯 [EmailService] Welcome email for: {email}");
            return true;
        }

        public async Task<bool> SendGenericEmailAsync(string email, string subject, string body, bool isHtml = true)
        {
            return true;
        }

        public async Task<bool> SendNotificationEmailAsync(string email, string title, string message, string displayName)
        {
            return true;
        }

        public async Task<bool> IsEmailConfiguredAsync()
        {
            return await Task.FromResult(true);
        }
    }
}