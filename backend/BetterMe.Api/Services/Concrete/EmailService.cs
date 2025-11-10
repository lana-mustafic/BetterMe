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
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly string _appBaseUrl;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            _smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            _smtpUsername = _configuration["Email:SmtpUsername"];
            _smtpPassword = _configuration["Email:SmtpPassword"];
            _fromEmail = _configuration["Email:FromEmail"] ?? _smtpUsername;
            _fromName = _configuration["Email:FromName"] ?? "BetterMe";
            _appBaseUrl = _configuration["AppBaseUrl"] ?? "https://betterme-frontend.onrender.com";
        }

        public async Task<bool> SendVerificationEmailAsync(string email, string verificationToken, string displayName)
        {
            try
            {
                Console.WriteLine($"[EmailService] Starting verification email for: {email}");

                var encodedToken = HttpUtility.UrlEncode(verificationToken);
                var encodedEmail = HttpUtility.UrlEncode(email);
                var verificationUrl = $"{_appBaseUrl}/verify-email?token={encodedToken}&email={encodedEmail}";

                Console.WriteLine($"[EmailService] Verification URL: {verificationUrl}");

                var subject = "Verify Your Email - BetterMe";
                var body = CreateVerificationEmailBody(displayName, verificationUrl);

                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send verification email: {ex.Message}");
                Console.WriteLine($"[EmailService] Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string displayName)
        {
            try
            {
                var encodedToken = HttpUtility.UrlEncode(resetToken);
                var encodedEmail = HttpUtility.UrlEncode(email);
                var resetUrl = $"{_appBaseUrl}/reset-password?token={encodedToken}&email={encodedEmail}";

                var subject = "Reset Your Password - BetterMe";
                var body = CreatePasswordResetEmailBody(displayName, resetUrl);

                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send password reset email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string email, string displayName)
        {
            try
            {
                var subject = "Welcome to BetterMe!";
                var body = CreateWelcomeEmailBody(displayName);

                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send welcome email: {ex.Message}");
                return false;
            }
        }

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
        .header {{ background: #667eea; color: white; padding: 20px; text-align: center; }}
        .content {{ background: #f9f9f9; padding: 20px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }}
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
            <p>This link will expire in 24 hours.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string CreatePasswordResetEmailBody(string displayName, string resetUrl)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #667eea; color: white; padding: 20px; text-align: center; }}
        .content {{ background: #f9f9f9; padding: 20px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Password Reset</h1>
        </div>
        <div class='content'>
            <h2>Hello {displayName}!</h2>
            <p>Click the button below to reset your password:</p>
            <p style='text-align: center;'>
                <a href='{resetUrl}' class='button'>Reset Password</a>
            </p>
            <p>This link will expire in 1 hour.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string CreateWelcomeEmailBody(string displayName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #667eea; color: white; padding: 20px; text-align: center; }}
        .content {{ background: #f9f9f9; padding: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to BetterMe!</h1>
        </div>
        <div class='content'>
            <h2>Hello {displayName}!</h2>
            <p>Your account has been successfully verified!</p>
            <p>Start organizing your tasks and boosting your productivity.</p>
        </div>
    </div>
</body>
</html>";
        }

        private async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            // If no SMTP configuration, log and return true (for development)
            if (string.IsNullOrEmpty(_smtpUsername) || string.IsNullOrEmpty(_smtpPassword))
            {
                Console.WriteLine($"[EmailService] SMTP not configured. Would send email to: {toEmail}");
                Console.WriteLine($"[EmailService] Subject: {subject}");
                Console.WriteLine($"[EmailService] Verification would use URL in email body");
                return true; // Return true to not block registration
            }

            try
            {
                Console.WriteLine($"[EmailService] Attempting to send email via {_smtpHost}:{_smtpPort}");

                using var client = new SmtpClient(_smtpHost, _smtpPort)
                {
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                    Timeout = 10000
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);

                Console.WriteLine($"[EmailService] ✅ Email sent successfully to: {toEmail}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] ❌ Failed to send email to {toEmail}: {ex.Message}");
                return false;
            }
        }
    }
}